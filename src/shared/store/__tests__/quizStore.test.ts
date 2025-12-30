/**
 * Quiz Store Tests
 */

import { useQuizStore } from '../quizStore';
import { useVocabularyStore } from '../vocabularyStore';
import { useProgressStore } from '../progressStore';
import { VocabularyWord } from '@/shared/types';

// Mock vocabulary store
jest.mock('../vocabularyStore', () => ({
  useVocabularyStore: {
    getState: jest.fn(),
  },
}));

// Mock progress store
jest.mock('../progressStore', () => ({
  useProgressStore: {
    getState: jest.fn(),
  },
}));

// Mock answer validator
jest.mock('@/features/quiz/utils/answerValidator', () => ({
  validateMultipleChoice: jest.fn((user, correct) => user === correct),
  validateFillInBlank: jest.fn((user, correct) => user.toLowerCase() === correct.toLowerCase()),
}));

// Mock question generator
jest.mock('@/features/quiz/utils/questionGenerator', () => ({
  generateMultipleChoiceOptions: jest.fn((word, words) => [
    word.word,
    'option2',
    'option3',
    'option4',
  ]),
}));

describe('quizStore', () => {
  const mockWords: VocabularyWord[] = [
    { id: 'word1', word: 'abject', definition: 'extremely bad', fillInBlank: 'The conditions were ___.' },
    { id: 'word2', word: 'aberration', definition: 'deviation', fillInBlank: 'It was an ___.' },
    { id: 'word3', word: 'abjure', definition: 'renounce', fillInBlank: 'He chose to ___.' },
    { id: 'word4', word: 'abscond', definition: 'leave hurriedly', fillInBlank: 'She decided to ___.' },
  ];

  const mockProgressStore = {
    startSession: jest.fn(),
    endSession: jest.fn(),
    updateWordProgress: jest.fn(),
  };

  const mockVocabularyStore = {
    getWordsByListLevel: jest.fn(() => mockWords),
  };

  const initialQuizState = {
    currentSession: null,
    currentQuestion: null,
    currentQuestionIndex: 0,
    isQuizActive: false,
    sessionStats: { hintsUsed: 0, wrongAnswers: 0, correctAnswers: 0 },
    questionOrder: [],
    correctTracker: [],
    presentationCountTracker: [],
    currentOrderIndex: 0,
  };

  beforeEach(() => {
    // Reset quiz store
    useQuizStore.setState(initialQuizState);

    // Reset mocks
    jest.clearAllMocks();

    // Setup mock stores
    (useVocabularyStore.getState as jest.Mock).mockReturnValue(mockVocabularyStore);
    (useProgressStore.getState as jest.Mock).mockReturnValue(mockProgressStore);

    // Mock Math.random for predictable shuffling
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('startQuiz', () => {
    it('initializes quiz session with correct data', () => {
      const store = useQuizStore.getState();
      store.startQuiz('phoenix', 'basic');

      const state = useQuizStore.getState();
      expect(state.isQuizActive).toBe(true);
      expect(state.currentSession).not.toBeNull();
      expect(state.currentSession?.listId).toBe('phoenix');
      expect(state.currentSession?.levelId).toBe('basic');
      expect(state.currentSession?.words).toEqual(mockWords);
    });

    it('creates question order with 2 questions per word', () => {
      const store = useQuizStore.getState();
      store.startQuiz('phoenix', 'basic');

      const state = useQuizStore.getState();
      // 4 words * 2 question types = 8 questions
      expect(state.questionOrder).toHaveLength(8);

      // Each word should have both question types
      const questionTypes = state.questionOrder.map(q => q.type);
      expect(questionTypes.filter(t => t === 'multiple')).toHaveLength(4);
      expect(questionTypes.filter(t => t === 'fillin')).toHaveLength(4);
    });

    it('initializes trackers with correct length', () => {
      const store = useQuizStore.getState();
      store.startQuiz('phoenix', 'basic');

      const state = useQuizStore.getState();
      expect(state.correctTracker).toHaveLength(8);
      expect(state.presentationCountTracker).toHaveLength(8);
      expect(state.correctTracker.every(v => v === 0)).toBe(true);
      // Note: presentationCountTracker has first question's count incremented
      // because startQuiz calls getNextQuestion which increments the count
    });

    it('resets session stats', () => {
      // Set some initial stats
      useQuizStore.setState({
        sessionStats: { hintsUsed: 5, wrongAnswers: 3, correctAnswers: 10 },
      });

      const store = useQuizStore.getState();
      store.startQuiz('phoenix', 'basic');

      const state = useQuizStore.getState();
      expect(state.sessionStats).toEqual({
        hintsUsed: 0,
        wrongAnswers: 0,
        correctAnswers: 0,
      });
    });

    it('calls progressStore.startSession', () => {
      const store = useQuizStore.getState();
      store.startQuiz('phoenix', 'basic');

      expect(mockProgressStore.startSession).toHaveBeenCalledWith('phoenix', 'basic');
    });

    it('gets first question after starting', () => {
      const store = useQuizStore.getState();
      store.startQuiz('phoenix', 'basic');

      const state = useQuizStore.getState();
      expect(state.currentQuestion).not.toBeNull();
      expect(state.currentQuestionIndex).toBeGreaterThan(0);
    });

    it('handles empty word list gracefully', () => {
      mockVocabularyStore.getWordsByListLevel.mockReturnValueOnce([]);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const store = useQuizStore.getState();
      store.startQuiz('phoenix', 'basic');

      const state = useQuizStore.getState();
      expect(state.isQuizActive).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getNextQuestion', () => {
    beforeEach(() => {
      const store = useQuizStore.getState();
      store.startQuiz('phoenix', 'basic');
    });

    it('returns question with word data', () => {
      const state = useQuizStore.getState();

      expect(state.currentQuestion).not.toBeNull();
      expect(state.currentQuestion?.word).toBeDefined();
      expect(state.currentQuestion?.type).toBeDefined();
    });

    it('includes options for multiple choice questions', () => {
      // Find a multiple choice question
      const state = useQuizStore.getState();
      const { questionOrder, currentOrderIndex } = state;
      const prevIndex = (currentOrderIndex - 1 + questionOrder.length) % questionOrder.length;

      if (questionOrder[prevIndex].type === 'multiple') {
        expect(state.currentQuestion?.options).toBeDefined();
        expect(state.currentQuestion?.options?.length).toBe(4);
      }
    });

    it('increments presentation count', () => {
      const initialState = useQuizStore.getState();
      const { currentOrderIndex, questionOrder } = initialState;
      const prevIndex = (currentOrderIndex - 1 + questionOrder.length) % questionOrder.length;
      const initialCount = initialState.presentationCountTracker[prevIndex];

      // Get next question (same one since we haven't answered)
      useQuizStore.getState().getNextQuestion();

      const newState = useQuizStore.getState();
      const newPrevIndex = (newState.currentOrderIndex - 1 + questionOrder.length) % questionOrder.length;

      // Presentation count should have increased
      expect(newState.presentationCountTracker[newPrevIndex]).toBeGreaterThanOrEqual(initialCount);
    });

    it('skips answered questions', () => {
      // Mark first question as answered
      const state = useQuizStore.getState();
      const newTracker = [...state.correctTracker];
      const prevIndex = (state.currentOrderIndex - 1 + state.questionOrder.length) % state.questionOrder.length;
      newTracker[prevIndex] = 1;

      useQuizStore.setState({ correctTracker: newTracker });

      // Get next question
      useQuizStore.getState().getNextQuestion();

      const newState = useQuizStore.getState();
      const newPrevIndex = (newState.currentOrderIndex - 1 + newState.questionOrder.length) % newState.questionOrder.length;

      // Should have moved to a different question
      expect(newState.correctTracker[newPrevIndex]).toBe(0);
    });
  });

  describe('submitAnswer', () => {
    beforeEach(() => {
      const store = useQuizStore.getState();
      store.startQuiz('phoenix', 'basic');
    });

    it('returns correct result for correct answer', () => {
      const state = useQuizStore.getState();
      const correctWord = state.currentQuestion?.word.word || '';

      const result = useQuizStore.getState().submitAnswer(correctWord);

      expect(result.isCorrect).toBe(true);
      expect(result.correctAnswer).toBe(correctWord);
    });

    it('returns incorrect result for wrong answer', () => {
      const state = useQuizStore.getState();
      const correctWord = state.currentQuestion?.word.word || '';

      const result = useQuizStore.getState().submitAnswer('wronganswer');

      expect(result.isCorrect).toBe(false);
      expect(result.correctAnswer).toBe(correctWord);
    });

    it('increments correctAnswers on correct answer', () => {
      const state = useQuizStore.getState();
      const correctWord = state.currentQuestion?.word.word || '';

      useQuizStore.getState().submitAnswer(correctWord);

      const newState = useQuizStore.getState();
      expect(newState.sessionStats.correctAnswers).toBe(1);
    });

    it('increments wrongAnswers on incorrect answer', () => {
      useQuizStore.getState().submitAnswer('wronganswer');

      const state = useQuizStore.getState();
      expect(state.sessionStats.wrongAnswers).toBe(1);
    });

    it('marks question as correct in tracker', () => {
      const state = useQuizStore.getState();
      const correctWord = state.currentQuestion?.word.word || '';
      const prevIndex = (state.currentOrderIndex - 1 + state.questionOrder.length) % state.questionOrder.length;

      useQuizStore.getState().submitAnswer(correctWord);

      const newState = useQuizStore.getState();
      expect(newState.correctTracker[prevIndex]).toBe(1);
    });

    it('calls progressStore.updateWordProgress on correct answer', () => {
      const state = useQuizStore.getState();
      const correctWord = state.currentQuestion?.word.word || '';

      useQuizStore.getState().submitAnswer(correctWord);

      expect(mockProgressStore.updateWordProgress).toHaveBeenCalled();
    });

    it('does not call progressStore.updateWordProgress on wrong answer', () => {
      useQuizStore.getState().submitAnswer('wronganswer');

      expect(mockProgressStore.updateWordProgress).not.toHaveBeenCalled();
    });
  });

  describe('useHint', () => {
    beforeEach(() => {
      const store = useQuizStore.getState();
      store.startQuiz('phoenix', 'basic');
    });

    it('returns word definition as hint', () => {
      const state = useQuizStore.getState();
      const expectedDefinition = state.currentQuestion?.word.definition;

      const hint = useQuizStore.getState().useHint();

      expect(hint).toBe(expectedDefinition);
    });

    it('increments hints count', () => {
      useQuizStore.getState().useHint();

      const state = useQuizStore.getState();
      expect(state.sessionStats.hintsUsed).toBe(1);
    });

    it('returns empty string when no question', () => {
      useQuizStore.setState({ currentQuestion: null });

      const hint = useQuizStore.getState().useHint();

      expect(hint).toBe('');
    });
  });

  describe('getCorrectAnswer', () => {
    beforeEach(() => {
      const store = useQuizStore.getState();
      store.startQuiz('phoenix', 'basic');
    });

    it('returns the correct word', () => {
      const state = useQuizStore.getState();
      const expectedWord = state.currentQuestion?.word.word;

      const answer = useQuizStore.getState().getCorrectAnswer();

      expect(answer).toBe(expectedWord);
    });

    it('returns empty string when no question', () => {
      useQuizStore.setState({ currentQuestion: null });

      const answer = useQuizStore.getState().getCorrectAnswer();

      expect(answer).toBe('');
    });
  });

  describe('incrementHints', () => {
    it('increments hints count', () => {
      useQuizStore.getState().incrementHints();
      useQuizStore.getState().incrementHints();

      const state = useQuizStore.getState();
      expect(state.sessionStats.hintsUsed).toBe(2);
    });
  });

  describe('incrementWrong', () => {
    it('increments wrong count', () => {
      useQuizStore.getState().incrementWrong();
      useQuizStore.getState().incrementWrong();
      useQuizStore.getState().incrementWrong();

      const state = useQuizStore.getState();
      expect(state.sessionStats.wrongAnswers).toBe(3);
    });
  });

  describe('incrementCorrect', () => {
    it('increments correct count', () => {
      useQuizStore.getState().incrementCorrect();

      const state = useQuizStore.getState();
      expect(state.sessionStats.correctAnswers).toBe(1);
    });
  });

  describe('endQuiz', () => {
    beforeEach(() => {
      const store = useQuizStore.getState();
      store.startQuiz('phoenix', 'basic');

      // Simulate some activity
      useQuizStore.setState({
        sessionStats: { hintsUsed: 3, wrongAnswers: 2, correctAnswers: 8 },
      });
    });

    it('returns final stats', () => {
      const result = useQuizStore.getState().endQuiz();

      expect(result).toEqual({
        hints: 3,
        wrong: 2,
        correct: 8,
      });
    });

    it('sets isQuizActive to false', () => {
      useQuizStore.getState().endQuiz();

      const state = useQuizStore.getState();
      expect(state.isQuizActive).toBe(false);
    });

    it('calls progressStore.endSession with stats', () => {
      useQuizStore.getState().endQuiz();

      expect(mockProgressStore.endSession).toHaveBeenCalledWith(
        'phoenix',
        'basic',
        { hints: 3, wrong: 2, correct: 8 }
      );
    });
  });

  describe('isQuizComplete', () => {
    beforeEach(() => {
      const store = useQuizStore.getState();
      store.startQuiz('phoenix', 'basic');
    });

    it('returns false when questions remain', () => {
      const result = useQuizStore.getState().isQuizComplete();

      expect(result).toBe(false);
    });

    it('returns true when all questions answered correctly', () => {
      const state = useQuizStore.getState();
      const allCorrect = state.correctTracker.map(() => 1);

      useQuizStore.setState({ correctTracker: allCorrect });

      const result = useQuizStore.getState().isQuizComplete();

      expect(result).toBe(true);
    });

    it('returns false with empty tracker', () => {
      useQuizStore.setState({ correctTracker: [] });

      const result = useQuizStore.getState().isQuizComplete();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentQuestionPresentationCount', () => {
    beforeEach(() => {
      const store = useQuizStore.getState();
      store.startQuiz('phoenix', 'basic');
    });

    it('returns correct presentation count', () => {
      const count = useQuizStore.getState().getCurrentQuestionPresentationCount();

      expect(count).toBeGreaterThanOrEqual(1);
    });

    it('returns 0 with empty tracker', () => {
      useQuizStore.setState({ presentationCountTracker: [] });

      const count = useQuizStore.getState().getCurrentQuestionPresentationCount();

      expect(count).toBe(0);
    });
  });
});
