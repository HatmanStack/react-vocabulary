/**
 * Quiz Store
 *
 * Manages quiz session state, question generation, and answer submission.
 * Handles word state progression (0→1→2→3) based on question type and correctness.
 */

import { create } from 'zustand';
import { QuizQuestion, QuizSession, QuestionType, WordState } from '@/shared/types';
import { useVocabularyStore } from './vocabularyStore';
import { useAdaptiveDifficultyStore } from './adaptiveDifficultyStore';
import { useProgressStore } from './progressStore';
import { validateMultipleChoice, validateFillInBlank } from '@/features/quiz/utils/answerValidator';
import { generateMultipleChoiceOptions } from '@/features/quiz/utils/questionGenerator';

interface SessionStats {
  hintsUsed: number;
  wrongAnswers: number;
  correctAnswers: number;
}

interface QuizState {
  // Session data
  currentSession: QuizSession | null;
  currentQuestion: QuizQuestion | null;
  currentQuestionIndex: number; // 1-based question number for display (1-8)
  isQuizActive: boolean;
  sessionStats: SessionStats;
  questionOrder: { wordIndex: number; type: QuestionType }[]; // Shuffled questions (8 total)
  correctTracker: number[]; // 0 = not answered correctly, 1 = answered correctly (length 8)
  wrongCountTracker: number[]; // Count of wrong answers for each question (length 8)
  currentOrderIndex: number; // Current position in questionOrder (0-based)

  // Actions
  startQuiz: (listId: string, levelId: string) => void;
  getNextQuestion: () => void;
  submitAnswer: (userAnswer: string) => { isCorrect: boolean; correctAnswer: string };
  useHint: () => string;
  getCorrectAnswer: () => string;
  incrementHints: () => void;
  incrementWrong: () => void;
  incrementCorrect: () => void;
  endQuiz: () => { hints: number; wrong: number; correct: number };
  isQuizComplete: () => boolean;
  getCurrentWordWrongCount: () => number;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  // Initial state
  currentSession: null,
  currentQuestion: null,
  currentQuestionIndex: 0,
  isQuizActive: false,
  sessionStats: {
    hintsUsed: 0,
    wrongAnswers: 0,
    correctAnswers: 0,
  },
  questionOrder: [],
  correctTracker: [],
  wrongCountTracker: [],
  currentOrderIndex: 0,

  // Start a new quiz session
  startQuiz: (listId: string, levelId: string) => {
    const vocabularyStore = useVocabularyStore.getState();
    const progressStore = useProgressStore.getState();
    const words = vocabularyStore.getWordsByListLevel(listId, levelId);

    if (words.length === 0) {
      console.error(`No words found for list ${listId}, level ${levelId}`);
      return;
    }

    const session: QuizSession = {
      listId,
      levelId,
      words,
      currentQuestionIndex: 0,
      sessionStats: {
        hintsUsed: 0,
        wrongAnswers: 0,
        correctAnswers: 0,
      },
      startedAt: new Date().toISOString(),
    };

    // Start session in progress store
    progressStore.startSession(listId, levelId);

    // Create question order: 2 questions per word (multiple + fillin)
    const questionOrder: { wordIndex: number; type: QuestionType }[] = [];
    words.forEach((_, wordIndex) => {
      questionOrder.push({ wordIndex, type: 'multiple' });
      questionOrder.push({ wordIndex, type: 'fillin' });
    });

    // Shuffle using Fisher-Yates
    for (let i = questionOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questionOrder[i], questionOrder[j]] = [questionOrder[j], questionOrder[i]];
    }

    // Initialize tracker arrays (all 0s) - 8 questions total
    const correctTracker = new Array(questionOrder.length).fill(0);
    const wrongCountTracker = new Array(questionOrder.length).fill(0);

    set({
      currentSession: session,
      currentQuestionIndex: 0,
      isQuizActive: true,
      sessionStats: { hintsUsed: 0, wrongAnswers: 0, correctAnswers: 0 },
      questionOrder,
      correctTracker,
      wrongCountTracker,
      currentOrderIndex: 0,
    });

    // Get first question
    get().getNextQuestion();
  },

  // Get next question
  getNextQuestion: () => {
    const { currentSession, questionOrder, correctTracker, currentOrderIndex } = get();

    if (!currentSession) {
      console.error('No active quiz session');
      return;
    }

    // Check if quiz is complete
    if (get().isQuizComplete()) {
      console.log('Quiz complete! All questions answered correctly.');
      return;
    }

    const { words } = currentSession;
    let nextIndex = currentOrderIndex;

    // Find next unanswered question
    for (let i = 0; i < questionOrder.length; i++) {
      const checkIndex = (currentOrderIndex + i) % questionOrder.length;

      if (correctTracker[checkIndex] === 0) {
        nextIndex = checkIndex;
        break;
      }
    }

    const questionInfo = questionOrder[nextIndex];
    const word = words[questionInfo.wordIndex];
    const questionType = questionInfo.type;

    // Generate options for multiple choice questions
    const options =
      questionType === 'multiple' ? generateMultipleChoiceOptions(word, words) : undefined;

    const question: QuizQuestion = {
      word,
      type: questionType,
      options,
    };

    // Question number is the position in shuffled order (1-based, 1-8)
    const questionNumber = nextIndex + 1;

    set({
      currentQuestion: question,
      currentQuestionIndex: questionNumber,
      currentOrderIndex: (nextIndex + 1) % questionOrder.length,
    });
  },

  // Submit answer and update tracker
  submitAnswer: (userAnswer: string) => {
    const { currentQuestion, currentSession, questionOrder, currentOrderIndex, correctTracker, wrongCountTracker } = get();

    if (!currentQuestion || !currentSession) {
      console.error('No active question');
      return { isCorrect: false, correctAnswer: '' };
    }

    const { word, type } = currentQuestion;
    const correctAnswer = word.word;

    // Validate answer based on question type
    const isCorrect =
      type === 'multiple'
        ? validateMultipleChoice(userAnswer, correctAnswer)
        : validateFillInBlank(userAnswer, correctAnswer);

    // Get the current question index in the order
    const prevIndex = (currentOrderIndex - 1 + questionOrder.length) % questionOrder.length;

    // Update stats
    if (isCorrect) {
      get().incrementCorrect();

      // Mark this specific question as answered correctly
      const newTracker = [...correctTracker];
      newTracker[prevIndex] = 1;
      set({ correctTracker: newTracker });

      // Save progress to progressStore (mark as mastered)
      const progressStore = useProgressStore.getState();
      progressStore.updateWordProgress(
        word.id,
        currentSession.listId,
        currentSession.levelId,
        3, // Mark as mastered
        isCorrect,
        false
      );
    } else {
      get().incrementWrong();

      // Increment wrong count for this specific question
      const newWrongCounts = [...wrongCountTracker];
      newWrongCounts[prevIndex] = newWrongCounts[prevIndex] + 1;
      set({ wrongCountTracker: newWrongCounts });
    }

    return { isCorrect, correctAnswer };
  },

  // Use hint for fill-in-blank question
  useHint: () => {
    const { currentQuestion } = get();

    if (!currentQuestion) {
      return '';
    }

    get().incrementHints();
    return currentQuestion.word.definition;
  },

  // Get the correct answer for "Help Me Out" feature
  getCorrectAnswer: () => {
    const { currentQuestion } = get();

    if (!currentQuestion) {
      return '';
    }

    return currentQuestion.word.word;
  },

  // Get the wrong answer count for the current question
  getCurrentWordWrongCount: () => {
    const { currentOrderIndex, wrongCountTracker } = get();

    if (wrongCountTracker.length === 0) {
      return 0;
    }

    const prevIndex = (currentOrderIndex - 1 + wrongCountTracker.length) % wrongCountTracker.length;
    return wrongCountTracker[prevIndex] || 0;
  },

  // Increment hint count
  incrementHints: () => {
    set((state) => ({
      sessionStats: {
        ...state.sessionStats,
        hintsUsed: state.sessionStats.hintsUsed + 1,
      },
    }));
  },

  // Increment wrong answer count
  incrementWrong: () => {
    set((state) => ({
      sessionStats: {
        ...state.sessionStats,
        wrongAnswers: state.sessionStats.wrongAnswers + 1,
      },
    }));
  },

  // Increment correct answer count
  incrementCorrect: () => {
    set((state) => ({
      sessionStats: {
        ...state.sessionStats,
        correctAnswers: state.sessionStats.correctAnswers + 1,
      },
    }));
  },

  // Reset session stats
  resetStats: () => {
    set({
      sessionStats: {
        hintsUsed: 0,
        wrongAnswers: 0,
        correctAnswers: 0,
      },
    });
  },

  // End quiz and return final stats
  endQuiz: () => {
    const { sessionStats, currentSession } = get();

    if (currentSession) {
      // Save progress to progressStore
      const progressStore = useProgressStore.getState();
      progressStore.endSession(currentSession.listId, currentSession.levelId, {
        hints: sessionStats.hintsUsed,
        wrong: sessionStats.wrongAnswers,
        correct: sessionStats.correctAnswers,
      });
    }

    set({
      isQuizActive: false,
    });

    return {
      hints: sessionStats.hintsUsed,
      wrong: sessionStats.wrongAnswers,
      correct: sessionStats.correctAnswers,
    };
  },

  // Check if quiz is complete (all tracker values are 1)
  isQuizComplete: () => {
    const { correctTracker } = get();
    return correctTracker.length > 0 && correctTracker.every((val) => val === 1);
  },
}));
