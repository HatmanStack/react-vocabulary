/**
 * Adaptive Difficulty Store Tests
 */

import { useAdaptiveDifficultyStore } from '../adaptiveDifficultyStore';

describe('adaptiveDifficultyStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAdaptiveDifficultyStore.getState().resetPerformance();
  });

  describe('updatePerformance', () => {
    it('tracks multiple choice performance correctly', () => {
      useAdaptiveDifficultyStore.getState().updatePerformance('multiple', true);
      let state = useAdaptiveDifficultyStore.getState();
      expect(state.multipleChoiceAttempts).toBe(1);
      expect(state.multipleChoiceCorrect).toBe(1);
      expect(state.multipleChoiceAccuracy).toBe(1.0);

      useAdaptiveDifficultyStore.getState().updatePerformance('multiple', false);
      state = useAdaptiveDifficultyStore.getState();
      expect(state.multipleChoiceAttempts).toBe(2);
      expect(state.multipleChoiceCorrect).toBe(1);
      expect(state.multipleChoiceAccuracy).toBe(0.5);
    });

    it('tracks fill-in-blank performance correctly', () => {
      useAdaptiveDifficultyStore.getState().updatePerformance('fillin', true);
      let state = useAdaptiveDifficultyStore.getState();
      expect(state.fillInBlankAttempts).toBe(1);
      expect(state.fillInBlankCorrect).toBe(1);
      expect(state.fillInBlankAccuracy).toBe(1.0);

      useAdaptiveDifficultyStore.getState().updatePerformance('fillin', false);
      state = useAdaptiveDifficultyStore.getState();
      expect(state.fillInBlankAttempts).toBe(2);
      expect(state.fillInBlankCorrect).toBe(1);
      expect(state.fillInBlankAccuracy).toBe(0.5);
    });

    it('tracks both types independently', () => {
      useAdaptiveDifficultyStore.getState().updatePerformance('multiple', true);
      useAdaptiveDifficultyStore.getState().updatePerformance('fillin', false);

      const state = useAdaptiveDifficultyStore.getState();
      expect(state.multipleChoiceAccuracy).toBe(1.0);
      expect(state.fillInBlankAccuracy).toBe(0.0);
    });
  });

  describe('getOptimalQuestionType', () => {
    it('always returns fillin for wordState 1', () => {
      const store = useAdaptiveDifficultyStore.getState();
      expect(store.getOptimalQuestionType(1)).toBe('fillin');
    });

    it('always returns multiple for wordState 2', () => {
      const store = useAdaptiveDifficultyStore.getState();
      expect(store.getOptimalQuestionType(2)).toBe('multiple');
    });

    it('returns random 50/50 before minimum attempts threshold', () => {
      // Add some attempts but below threshold (5)
      useAdaptiveDifficultyStore.getState().updatePerformance('multiple', true);
      useAdaptiveDifficultyStore.getState().updatePerformance('multiple', true);
      useAdaptiveDifficultyStore.getState().updatePerformance('fillin', true);

      const results = new Set<string>();
      for (let i = 0; i < 20; i++) {
        results.add(useAdaptiveDifficultyStore.getState().getOptimalQuestionType(0));
      }

      // Should see both types with limited data
      expect(results.has('multiple')).toBe(true);
      expect(results.has('fillin')).toBe(true);
    });

    it('biases toward fillin when user excels at multiple choice (>80%)', () => {
      // User excels at multiple choice (100% accuracy)
      for (let i = 0; i < 10; i++) {
        useAdaptiveDifficultyStore.getState().updatePerformance('multiple', true);
      }

      // Add minimum fillin attempts
      for (let i = 0; i < 5; i++) {
        useAdaptiveDifficultyStore.getState().updatePerformance('fillin', true);
      }

      // Should bias toward fillin (70% chance)
      const results = { fillin: 0, multiple: 0 };
      for (let i = 0; i < 100; i++) {
        const type = useAdaptiveDifficultyStore.getState().getOptimalQuestionType(0);
        results[type]++;
      }

      // With 70% bias, we expect more fillin than multiple
      expect(results.fillin).toBeGreaterThan(results.multiple);
    });

    it('biases toward multiple when user struggles with fillin (<50%)', () => {
      // User struggles with fill-in-blank (40% accuracy)
      for (let i = 0; i < 10; i++) {
        useAdaptiveDifficultyStore.getState().updatePerformance('fillin', i < 4); // 4 correct out of 10
      }

      // Add minimum multiple choice attempts with moderate accuracy (60%)
      // Important: keep multiple choice accuracy < 80% so it doesn't trigger the first bias condition
      for (let i = 0; i < 10; i++) {
        useAdaptiveDifficultyStore.getState().updatePerformance('multiple', i < 6); // 6 correct out of 10 = 60%
      }

      // Should bias toward multiple (70% chance)
      const results = { fillin: 0, multiple: 0 };
      for (let i = 0; i < 100; i++) {
        const type = useAdaptiveDifficultyStore.getState().getOptimalQuestionType(0);
        results[type]++;
      }

      // With 70% bias, we expect more multiple than fillin
      expect(results.multiple).toBeGreaterThan(results.fillin);
    });

    it('returns balanced 50/50 when performance is balanced', () => {
      // Balanced performance (60% for both)
      for (let i = 0; i < 10; i++) {
        useAdaptiveDifficultyStore.getState().updatePerformance('multiple', i < 6);
        useAdaptiveDifficultyStore.getState().updatePerformance('fillin', i < 6);
      }

      const results = { fillin: 0, multiple: 0 };
      for (let i = 0; i < 100; i++) {
        const type = useAdaptiveDifficultyStore.getState().getOptimalQuestionType(0);
        results[type]++;
      }

      // Should be roughly 50/50 (allow 40-60 range for randomness)
      expect(results.fillin).toBeGreaterThan(30);
      expect(results.fillin).toBeLessThan(70);
      expect(results.multiple).toBeGreaterThan(30);
      expect(results.multiple).toBeLessThan(70);
    });
  });

  describe('resetPerformance', () => {
    it('resets all stats to 0', () => {
      // Add some performance data
      useAdaptiveDifficultyStore.getState().updatePerformance('multiple', true);
      useAdaptiveDifficultyStore.getState().updatePerformance('fillin', false);

      // Reset
      useAdaptiveDifficultyStore.getState().resetPerformance();

      const state = useAdaptiveDifficultyStore.getState();
      expect(state.multipleChoiceAttempts).toBe(0);
      expect(state.multipleChoiceCorrect).toBe(0);
      expect(state.multipleChoiceAccuracy).toBe(0);
      expect(state.fillInBlankAttempts).toBe(0);
      expect(state.fillInBlankCorrect).toBe(0);
      expect(state.fillInBlankAccuracy).toBe(0);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('returns current metrics', () => {
      useAdaptiveDifficultyStore.getState().updatePerformance('multiple', true);
      useAdaptiveDifficultyStore.getState().updatePerformance('fillin', true);

      const metrics = useAdaptiveDifficultyStore.getState().getPerformanceMetrics();

      expect(metrics).toEqual({
        multipleChoiceAccuracy: 1.0,
        fillInBlankAccuracy: 1.0,
        multipleChoiceAttempts: 1,
        fillInBlankAttempts: 1,
      });
    });
  });
});
