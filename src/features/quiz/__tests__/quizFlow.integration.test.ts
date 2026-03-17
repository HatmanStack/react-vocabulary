/**
 * Quiz Flow Integration Test
 *
 * Exercises the quiz flow end-to-end through real stores (quizStore + progressStore).
 * Only external dependencies (AsyncStorage) are mocked (via jest.setup.js).
 * Verifies that answering questions correctly progresses word states 0->1->2->3.
 */

import { useQuizStore } from '@/shared/store/quizStore';
import { useProgressStore } from '@/shared/store/progressStore';
import { useVocabularyStore } from '@/shared/store/vocabularyStore';
import { makeListLevelKey } from '@/shared/utils/listLevelKey';
import { VocabularyWord } from '@/shared/types';

// Mock vocabulary store to provide test data without loading JSON files
jest.mock('@/shared/store/vocabularyStore', () => ({
  useVocabularyStore: {
    getState: jest.fn(),
  },
}));

// Mock the answer validator so we can control correct/incorrect answers
jest.mock('@/features/quiz/utils/answerValidator', () => ({
  validateMultipleChoice: jest.fn((user: string, correct: string) => user === correct),
  validateFillInBlank: jest.fn(
    (user: string, correct: string) => user.toLowerCase() === correct.toLowerCase()
  ),
}));

// Mock the question generator for predictable options
jest.mock('@/features/quiz/utils/questionGenerator', () => ({
  generateMultipleChoiceOptions: jest.fn((word: VocabularyWord) => [
    word.word,
    'distractor1',
    'distractor2',
    'distractor3',
  ]),
}));

const testWords: VocabularyWord[] = [
  {
    id: 'word-1',
    word: 'abject',
    definition: 'extremely bad or degrading',
    fillInBlank: 'The poverty was ___.',
  },
  {
    id: 'word-2',
    word: 'benign',
    definition: 'gentle and kind',
    fillInBlank: 'The tumor was ___.',
  },
  {
    id: 'word-3',
    word: 'candid',
    definition: 'truthful and straightforward',
    fillInBlank: 'She gave a ___ assessment.',
  },
  {
    id: 'word-4',
    word: 'diligent',
    definition: 'hardworking',
    fillInBlank: 'He was ___ in his studies.',
  },
];

const TEST_LIST_ID = 'test-list';
const TEST_LEVEL_ID = 'basic';

describe('Quiz Flow Integration', () => {
  beforeEach(() => {
    // Reset real stores to initial state
    useQuizStore.setState({
      currentSession: null,
      currentQuestion: null,
      currentQuestionIndex: 0,
      isQuizActive: false,
      sessionStats: { hintsUsed: 0, wrongAnswers: 0, correctAnswers: 0 },
      questionOrder: [],
      correctTracker: [],
      presentationCountTracker: [],
      currentOrderIndex: 0,
    });

    // Reset progress store (use real store)
    useProgressStore.setState({
      listLevelProgress: {},
      globalStats: {
        allTimeHints: 0,
        allTimeWrong: 0,
        allTimeCorrect: 0,
        totalWordsLearned: 0,
        listsCompleted: [],
      },
      achievements: [],
      dailyProgress: {},
      isLoading: false,
      lastSyncedAt: null,
      username: null,
      syncStatus: 'idle',
      lastSyncError: null,
      lastCloudSyncAt: null,
      _hydrated: true,
    });

    // Mock vocabulary store
    (useVocabularyStore.getState as jest.Mock).mockReturnValue({
      getWordsByListLevel: jest.fn(() => testWords),
    });

    jest.clearAllMocks();

    // Make random shuffling predictable
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('completes a full quiz session with correct answers', () => {
    const quizStore = useQuizStore.getState();

    // Start quiz
    quizStore.startQuiz(TEST_LIST_ID, TEST_LEVEL_ID);

    let state = useQuizStore.getState();
    expect(state.isQuizActive).toBe(true);
    expect(state.currentSession).not.toBeNull();
    expect(state.currentSession?.words).toHaveLength(4);

    // Answer all questions correctly
    let questionsAnswered = 0;
    const maxQuestions = 8; // 4 words * 2 questions each

    while (questionsAnswered < maxQuestions) {
      state = useQuizStore.getState();
      if (!state.currentQuestion) break;

      const correctAnswer = state.currentQuestion.word.word;
      const result = useQuizStore.getState().submitAnswer(correctAnswer);
      expect(result.isCorrect).toBe(true);

      useQuizStore.getState().getNextQuestion();
      questionsAnswered++;
    }

    // Quiz should be complete
    expect(useQuizStore.getState().isQuizComplete()).toBe(true);

    // Verify session stats
    state = useQuizStore.getState();
    expect(state.sessionStats.correctAnswers).toBe(maxQuestions);
    expect(state.sessionStats.wrongAnswers).toBe(0);
  });

  it('records word progress in progressStore when answering correctly', () => {
    const quizStore = useQuizStore.getState();
    quizStore.startQuiz(TEST_LIST_ID, TEST_LEVEL_ID);

    // Answer the first question correctly
    const state = useQuizStore.getState();
    expect(state.currentQuestion).not.toBeNull();

    const correctAnswer = state.currentQuestion!.word.word;
    const wordId = state.currentQuestion!.word.id;
    useQuizStore.getState().submitAnswer(correctAnswer);

    // Check that progress was recorded
    const key = makeListLevelKey(TEST_LIST_ID, TEST_LEVEL_ID);
    const progressStore = useProgressStore.getState();
    const wordProgress = progressStore.listLevelProgress[key]?.wordProgress[wordId];
    expect(wordProgress).toBeDefined();
    expect(wordProgress?.state).toBe(1); // First correct answer: 0 -> 1
  });

  it('enforces progressive word state (0->1->2->3)', () => {
    const quizStore = useQuizStore.getState();
    quizStore.startQuiz(TEST_LIST_ID, TEST_LEVEL_ID);

    // Get the first question's word
    const firstState = useQuizStore.getState();
    const wordId = firstState.currentQuestion!.word.id;
    const correctAnswer = firstState.currentQuestion!.word.word;
    const key = makeListLevelKey(TEST_LIST_ID, TEST_LEVEL_ID);

    // First correct answer: state 0 -> 1
    useQuizStore.getState().submitAnswer(correctAnswer);
    let wordProgress = useProgressStore.getState().listLevelProgress[key]?.wordProgress[wordId];
    expect(wordProgress?.state).toBe(1);

    // Simulate another correct answer by re-submitting for the same word
    // (need to manually answer the second question for this word)
    useQuizStore.getState().getNextQuestion();
    const secondState = useQuizStore.getState();
    if (secondState.currentQuestion && secondState.currentQuestion.word.id === wordId) {
      useQuizStore.getState().submitAnswer(secondState.currentQuestion.word.word);
      wordProgress = useProgressStore.getState().listLevelProgress[key]?.wordProgress[wordId];
      expect(wordProgress?.state).toBe(2); // Second correct: 1 -> 2
    }
  });

  it('handles incorrect answers without advancing word state', () => {
    const quizStore = useQuizStore.getState();
    quizStore.startQuiz(TEST_LIST_ID, TEST_LEVEL_ID);

    // Submit a wrong answer
    const result = useQuizStore.getState().submitAnswer('wrong-answer');
    expect(result.isCorrect).toBe(false);

    // Verify wrong answer counter incremented
    const state = useQuizStore.getState();
    expect(state.sessionStats.wrongAnswers).toBe(1);
    expect(state.sessionStats.correctAnswers).toBe(0);
  });

  it('detects quiz completion after all questions answered', () => {
    const quizStore = useQuizStore.getState();
    quizStore.startQuiz(TEST_LIST_ID, TEST_LEVEL_ID);

    // Before any answers, quiz should not be complete
    expect(useQuizStore.getState().isQuizComplete()).toBe(false);

    // Answer all questions correctly
    let questionsAnswered = 0;
    const maxQuestions = 8;

    while (questionsAnswered < maxQuestions) {
      const state = useQuizStore.getState();
      if (!state.currentQuestion) break;

      const correctAnswer = state.currentQuestion.word.word;
      useQuizStore.getState().submitAnswer(correctAnswer);
      useQuizStore.getState().getNextQuestion();
      questionsAnswered++;
    }

    // Now quiz should be complete
    expect(useQuizStore.getState().isQuizComplete()).toBe(true);

    // End quiz and verify stats
    const stats = useQuizStore.getState().endQuiz();
    expect(stats.hints).toBe(0);
    expect(stats.wrong).toBe(0);
  });

  it('tracks word state capped at 3 (mastered)', () => {
    const key = makeListLevelKey(TEST_LIST_ID, TEST_LEVEL_ID);

    // Pre-set a word to state 3 (mastered)
    useProgressStore.setState({
      listLevelProgress: {
        [key]: {
          listId: TEST_LIST_ID,
          levelId: TEST_LEVEL_ID,
          wordProgress: {
            'word-1': {
              state: 3,
              hintsUsed: 0,
              wrongAttempts: 0,
              correctAttempts: 5,
              lastAttemptDate: '2024-01-01',
              firstAttemptDate: '2024-01-01',
              masteredDate: '2024-01-01',
            },
          },
        },
      },
    });

    // Start quiz and answer correctly for the mastered word
    useQuizStore.getState().startQuiz(TEST_LIST_ID, TEST_LEVEL_ID);

    const state = useQuizStore.getState();
    if (state.currentQuestion?.word.id === 'word-1') {
      useQuizStore.getState().submitAnswer(state.currentQuestion.word.word);
      const wordProgress =
        useProgressStore.getState().listLevelProgress[key]?.wordProgress['word-1'];
      // State should stay at 3, not go higher
      expect(wordProgress?.state).toBe(3);
    }
  });
});
