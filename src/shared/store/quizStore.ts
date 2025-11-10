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
  currentQuestionIndex: number;
  isQuizActive: boolean;
  sessionStats: SessionStats;
  answered: WordState[]; // Word states: 0, 1, 2, or 3
  lastWordIndex: number; // Track to avoid repeating same word consecutively

  // Actions
  startQuiz: (listId: string, levelId: string) => void;
  getNextQuestion: () => void;
  determineQuestionType: (wordState: WordState) => QuestionType;
  submitAnswer: (userAnswer: string) => { isCorrect: boolean; correctAnswer: string };
  useHint: () => string;
  calculateProgress: () => number;
  incrementHints: () => void;
  incrementWrong: () => void;
  incrementCorrect: () => void;
  resetStats: () => void;
  endQuiz: () => { hints: number; wrong: number; correct: number };
  isQuizComplete: () => boolean;
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
  answered: [],
  lastWordIndex: -1,

  // Start a new quiz session
  startQuiz: (listId: string, levelId: string) => {
    const vocabularyStore = useVocabularyStore.getState();
    const progressStore = useProgressStore.getState();
    const words = vocabularyStore.getWordsByListLevel(listId, levelId);

    if (words.length === 0) {
      console.error(`No words found for list ${listId}, level ${levelId}`);
      return;
    }

    // Load existing progress from progressStore
    const answered = new Array(words.length).fill(0) as WordState[];
    words.forEach((word, index) => {
      const wordProgress = progressStore.getWordProgress(word.id);
      if (wordProgress) {
        answered[index] = wordProgress.state;
      }
    });

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

    set({
      currentSession: session,
      currentQuestionIndex: 0,
      isQuizActive: true,
      sessionStats: { hintsUsed: 0, wrongAnswers: 0, correctAnswers: 0 },
      answered,
      lastWordIndex: -1,
    });

    // Get first question
    get().getNextQuestion();
  },

  // Get next question
  getNextQuestion: () => {
    const { currentSession, answered, lastWordIndex } = get();

    if (!currentSession) {
      console.error('No active quiz session');
      return;
    }

    // Check if quiz is complete (all words mastered)
    if (get().isQuizComplete()) {
      console.log('Quiz complete! All words mastered.');
      return;
    }

    const { words } = currentSession;
    const totalWords = words.length;

    // Find a random word that is not mastered (state < 3)
    let attempts = 0;
    let wordIndex = -1;

    while (attempts < totalWords * 2) {
      // Try random selection
      const randomIndex = Math.floor(Math.random() * totalWords);

      // Check if word is not mastered and not the last word
      if (answered[randomIndex] < 3 && randomIndex !== lastWordIndex) {
        wordIndex = randomIndex;
        break;
      }

      attempts++;
    }

    // Fallback: find first non-mastered word
    if (wordIndex === -1) {
      wordIndex = answered.findIndex((state) => state < 3);
    }

    // If still not found, quiz is complete
    if (wordIndex === -1) {
      console.log('All words mastered!');
      return;
    }

    const word = words[wordIndex];
    const wordState = answered[wordIndex];

    // Determine question type based on word state
    const questionType = get().determineQuestionType(wordState);

    // Generate options for multiple choice questions
    const options =
      questionType === 'multiple' ? generateMultipleChoiceOptions(word, words) : undefined;

    const question: QuizQuestion = {
      word,
      type: questionType,
      options,
    };

    set({
      currentQuestion: question,
      currentQuestionIndex: get().currentQuestionIndex + 1,
      lastWordIndex: wordIndex,
    });
  },

  // Determine question type based on word state and adaptive difficulty
  // Word state 1: fill-in-blank only
  // Word state 2: multiple choice only
  // Word state 0 or 3: use adaptive difficulty algorithm
  determineQuestionType: (wordState: WordState): QuestionType => {
    const adaptiveStore = useAdaptiveDifficultyStore.getState();
    return adaptiveStore.getOptimalQuestionType(wordState);
  },

  // Submit answer and update word state
  submitAnswer: (userAnswer: string) => {
    const { currentQuestion, currentSession, lastWordIndex, answered, sessionStats } = get();

    if (!currentQuestion || !currentSession || lastWordIndex === -1) {
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

    // Track if hint was used in this question (check if hints increased since last question)
    const hintUsedInThisQuestion = false; // Hint tracking is separate via useHint()

    // Update stats
    if (isCorrect) {
      get().incrementCorrect();
    } else {
      get().incrementWrong();
    }

    // Update adaptive difficulty performance
    const adaptiveStore = useAdaptiveDifficultyStore.getState();
    adaptiveStore.updatePerformance(type, isCorrect);

    // Update word state progression (only if correct)
    if (isCorrect) {
      const currentWordState = answered[lastWordIndex];
      let newWordState: WordState = currentWordState;

      // Word state progression logic (from Android app)
      if (type === 'multiple') {
        // Multiple choice correct: state 0→1, state 2→3
        if (currentWordState === 0) {
          newWordState = 1;
        } else if (currentWordState === 2) {
          newWordState = 3;
        }
      } else if (type === 'fillin') {
        // Fill-in-blank correct: state 0→2, state 1→3
        if (currentWordState === 0) {
          newWordState = 2;
        } else if (currentWordState === 1) {
          newWordState = 3;
        }
      }

      // Update answered array
      const newAnswered = [...answered];
      newAnswered[lastWordIndex] = newWordState;
      set({ answered: newAnswered });

      // Save progress to progressStore
      const progressStore = useProgressStore.getState();
      progressStore.updateWordProgress(
        word.id,
        currentSession.listId,
        currentSession.levelId,
        newWordState,
        isCorrect,
        hintUsedInThisQuestion
      );
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

  // Calculate quiz progress (sum of all word states)
  calculateProgress: () => {
    const { answered } = get();
    return answered.reduce((sum, state) => sum + state, 0 as number) as number;
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

  // Check if quiz is complete (all words at state 3)
  isQuizComplete: () => {
    const { answered } = get();
    return answered.every((state) => state === 3);
  },
}));
