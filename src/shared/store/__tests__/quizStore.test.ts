/**
 * Quiz Store Tests
 */

import { useQuizStore } from '../quizStore';
import { useVocabularyStore } from '../vocabularyStore';
import { useProgressStore } from '../progressStore';

describe('quizStore', () => {
  beforeAll(() => {
    // Ensure vocabulary is loaded
    useVocabularyStore.getState().loadVocabularyLists();
  });

  beforeEach(() => {
    // Reset both quiz and progress stores before each test to ensure test isolation
    useQuizStore.getState().resetStats();
    // Reset the entire quiz state
    useQuizStore.setState({
      currentSession: null,
      currentQuestion: null,
      currentQuestionIndex: 0,
      isQuizActive: false,
      sessionStats: { hintsUsed: 0, wrongAnswers: 0, correctAnswers: 0 },
      answered: [],
      lastWordIndex: -1,
    });
    // Clear progress store to prevent state bleeding between tests
    useProgressStore.getState().resetAllProgress();
  });

  describe('startQuiz', () => {
    it('initializes quiz session with correct data', () => {
      const store = useQuizStore.getState();
      store.startQuiz('list-a', 'basic');

      // Get fresh state after mutation
      const updatedStore = useQuizStore.getState();

      expect(updatedStore.isQuizActive).toBe(true);
      expect(updatedStore.currentSession).not.toBeNull();
      expect(updatedStore.currentSession?.listId).toBe('list-a');
      expect(updatedStore.currentSession?.levelId).toBe('basic');
      expect(updatedStore.currentSession?.words.length).toBeGreaterThan(0);
    });

    it('initializes answered array with 0s', () => {
      const store = useQuizStore.getState();
      store.startQuiz('list-a', 'basic');

      const wordCount = store.currentSession?.words.length || 0;
      expect(store.answered).toHaveLength(wordCount);
      expect(store.answered.every((state) => state === 0)).toBe(true);
    });

    it('resets session stats to 0', () => {
      const store = useQuizStore.getState();
      store.startQuiz('list-a', 'basic');

      expect(store.sessionStats.hintsUsed).toBe(0);
      expect(store.sessionStats.wrongAnswers).toBe(0);
      expect(store.sessionStats.correctAnswers).toBe(0);
    });

    it('generates first question', () => {
      useQuizStore.getState().startQuiz('list-a', 'basic');

      const state = useQuizStore.getState();
      expect(state.currentQuestion).not.toBeNull();
      expect(state.currentQuestion?.word).toBeDefined();
      expect(state.currentQuestion?.type).toMatch(/multiple|fillin/);
    });
  });

  describe('getNextQuestion', () => {
    it('selects a word that is not mastered', () => {
      useQuizStore.getState().startQuiz('list-a', 'basic');

      const state = useQuizStore.getState();
      const firstQuestion = state.currentQuestion;
      expect(firstQuestion).not.toBeNull();

      // The word's state should be less than 3
      const wordIndex = state.lastWordIndex;
      expect(state.answered[wordIndex]).toBeLessThan(3);
    });

    it('avoids repeating the same word consecutively', () => {
      useQuizStore.getState().startQuiz('list-a', 'basic');

      const firstWordIndex = useQuizStore.getState().lastWordIndex;

      // Get next question multiple times
      for (let i = 0; i < 5; i++) {
        useQuizStore.getState().getNextQuestion();
        const state = useQuizStore.getState();
        const currentWordIndex = state.lastWordIndex;

        // Should not be the same as previous (unless all other words are mastered)
        if (state.answered.filter((s) => s < 3).length > 1) {
          expect(currentWordIndex).not.toBe(firstWordIndex);
        }
      }
    });

    it('generates options for multiple choice questions', () => {
      const store = useQuizStore.getState();
      store.startQuiz('list-a', 'basic');

      // Try multiple questions to find a multiple choice one
      for (let i = 0; i < 10; i++) {
        if (store.currentQuestion?.type === 'multiple') {
          expect(store.currentQuestion.options).toBeDefined();
          expect(store.currentQuestion.options).toHaveLength(4);
          break;
        }
        store.getNextQuestion();
      }
    });
  });

  describe('submitAnswer', () => {
    describe('correct answers', () => {
      it('increments correct answer count', () => {
        useQuizStore.getState().startQuiz('list-a', 'basic');

        const correctWord = useQuizStore.getState().currentQuestion!.word.word;
        const initialCorrect = useQuizStore.getState().sessionStats.correctAnswers;

        useQuizStore.getState().submitAnswer(correctWord);

        const state = useQuizStore.getState();
        expect(state.sessionStats.correctAnswers).toBe(initialCorrect + 1);
      });

      it('progresses word state for multiple choice: 0→1', () => {
        const store = useQuizStore.getState();
        store.startQuiz('list-a', 'basic');

        // Find a multiple choice question with word state 0
        for (let i = 0; i < 20; i++) {
          const wordIndex = store.lastWordIndex;
          if (store.currentQuestion?.type === 'multiple' && store.answered[wordIndex] === 0) {
            const correctWord = store.currentQuestion.word.word;
            store.submitAnswer(correctWord);
            expect(store.answered[wordIndex]).toBe(1);
            break;
          }
          store.getNextQuestion();
        }
      });

      it('progresses word state for fill-in-blank: 0→2', () => {
        const store = useQuizStore.getState();
        store.startQuiz('list-a', 'basic');

        // Find a fill-in-blank question with word state 0
        for (let i = 0; i < 20; i++) {
          const wordIndex = store.lastWordIndex;
          if (store.currentQuestion?.type === 'fillin' && store.answered[wordIndex] === 0) {
            const correctWord = store.currentQuestion.word.word;
            store.submitAnswer(correctWord);
            expect(store.answered[wordIndex]).toBe(2);
            break;
          }
          store.getNextQuestion();
        }
      });
    });

    describe('wrong answers', () => {
      it('increments wrong answer count', () => {
        useQuizStore.getState().startQuiz('list-a', 'basic');

        const initialWrong = useQuizStore.getState().sessionStats.wrongAnswers;
        useQuizStore.getState().submitAnswer('wronganswer');

        const state = useQuizStore.getState();
        expect(state.sessionStats.wrongAnswers).toBe(initialWrong + 1);
      });

      it('does not change word state', () => {
        const store = useQuizStore.getState();
        store.startQuiz('list-a', 'basic');

        const wordIndex = store.lastWordIndex;
        const initialState = store.answered[wordIndex];

        store.submitAnswer('wronganswer');

        expect(store.answered[wordIndex]).toBe(initialState);
      });
    });

    it('returns result with isCorrect and correctAnswer', () => {
      useQuizStore.getState().startQuiz('list-a', 'basic');

      const correctWord = useQuizStore.getState().currentQuestion!.word.word;
      const result = useQuizStore.getState().submitAnswer(correctWord);

      expect(result).toHaveProperty('isCorrect');
      expect(result).toHaveProperty('correctAnswer');
      expect(result.isCorrect).toBe(true);
      expect(result.correctAnswer).toBe(correctWord);
    });
  });

  describe('useHint', () => {
    it('increments hint count', () => {
      useQuizStore.getState().startQuiz('list-a', 'basic');

      const initialHints = useQuizStore.getState().sessionStats.hintsUsed;
      useQuizStore.getState().useHint();

      const state = useQuizStore.getState();
      expect(state.sessionStats.hintsUsed).toBe(initialHints + 1);
    });

    it('returns word definition', () => {
      useQuizStore.getState().startQuiz('list-a', 'basic');

      const expectedDefinition = useQuizStore.getState().currentQuestion!.word.definition;
      const definition = useQuizStore.getState().useHint();

      expect(definition).toBe(expectedDefinition);
    });
  });

  describe('calculateProgress', () => {
    it('returns 0 for new quiz', () => {
      useQuizStore.getState().startQuiz('list-a', 'basic');

      expect(useQuizStore.getState().calculateProgress()).toBe(0);
    });

    it('calculates sum of word states', () => {
      useQuizStore.getState().startQuiz('list-a', 'basic');

      // Manually set some word states for testing using the store's set method
      const state = useQuizStore.getState();
      const newAnswered = [...state.answered];
      newAnswered[0] = 1;
      newAnswered[1] = 2;
      newAnswered[2] = 3;
      useQuizStore.setState({ answered: newAnswered });

      const progress = useQuizStore.getState().calculateProgress();
      expect(progress).toBe(6); // 1 + 2 + 3
    });
  });

  describe('isQuizComplete', () => {
    it('returns false for new quiz', () => {
      const store = useQuizStore.getState();
      store.startQuiz('list-a', 'basic');

      expect(store.isQuizComplete()).toBe(false);
    });

    it('returns true when all words at state 3', () => {
      useQuizStore.getState().startQuiz('list-a', 'basic');

      // Set all words to mastered using the store's set method
      const state = useQuizStore.getState();
      const newAnswered = state.answered.map(() => 3 as const);
      useQuizStore.setState({ answered: newAnswered });

      expect(useQuizStore.getState().isQuizComplete()).toBe(true);
    });
  });

  describe('endQuiz', () => {
    it('returns final stats', () => {
      const store = useQuizStore.getState();
      store.startQuiz('list-a', 'basic');

      // Add some stats
      store.useHint();
      store.submitAnswer('wrong');

      const stats = store.endQuiz();

      expect(stats.hints).toBe(1);
      expect(stats.wrong).toBe(1);
    });

    it('sets isQuizActive to false', () => {
      useQuizStore.getState().startQuiz('list-a', 'basic');

      expect(useQuizStore.getState().isQuizActive).toBe(true);

      useQuizStore.getState().endQuiz();

      expect(useQuizStore.getState().isQuizActive).toBe(false);
    });
  });

  describe('stat tracking', () => {
    it('tracks multiple hints', () => {
      useQuizStore.getState().startQuiz('list-a', 'basic');

      useQuizStore.getState().incrementHints();
      useQuizStore.getState().incrementHints();
      useQuizStore.getState().incrementHints();

      expect(useQuizStore.getState().sessionStats.hintsUsed).toBe(3);
    });

    it('tracks multiple wrong answers', () => {
      useQuizStore.getState().startQuiz('list-a', 'basic');

      useQuizStore.getState().incrementWrong();
      useQuizStore.getState().incrementWrong();

      expect(useQuizStore.getState().sessionStats.wrongAnswers).toBe(2);
    });

    it('tracks multiple correct answers', () => {
      useQuizStore.getState().startQuiz('list-a', 'basic');

      useQuizStore.getState().incrementCorrect();
      useQuizStore.getState().incrementCorrect();
      useQuizStore.getState().incrementCorrect();

      expect(useQuizStore.getState().sessionStats.correctAnswers).toBe(3);
    });
  });
});
