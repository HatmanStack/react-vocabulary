/**
 * Progress Store Tests
 *
 * Comprehensive tests for progress tracking logic.
 */

import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProgressStore } from '../progressStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('ProgressStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    const { result } = renderHook(() => useProgressStore());
    act(() => {
      result.current.resetAllProgress();
    });
  });

  describe('Word Progress Tracking', () => {
    it('initializes with empty progress', () => {
      const { result } = renderHook(() => useProgressStore());
      expect(result.current.listLevelProgress).toEqual({});
      expect(result.current.globalStats.totalWordsLearned).toBe(0);
    });

    it('updates word progress correctly', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 1, true, false);
      });

      const progress = result.current.getWordProgress('word-1');
      expect(progress).toBeDefined();
      expect(progress?.state).toBe(1);
      expect(progress?.correctAttempts).toBe(1);
      expect(progress?.wrongAttempts).toBe(0);
    });

    it('increments hints when hint is used', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 1, true, true);
      });

      const progress = result.current.getWordProgress('word-1');
      expect(progress?.hintsUsed).toBe(1);
    });

    it('increments wrong attempts when answer is incorrect', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 0, false, false);
      });

      const progress = result.current.getWordProgress('word-1');
      expect(progress?.wrongAttempts).toBe(1);
      expect(progress?.correctAttempts).toBe(0);
    });

    it('sets mastered date when state reaches 3', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 3, true, false);
      });

      const progress = result.current.getWordProgress('word-1');
      expect(progress?.masteredDate).toBeDefined();
      expect(progress?.state).toBe(3);
    });

    it('retrieves list-level progress correctly', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 1, true, false);
        result.current.updateWordProgress('word-2', 'list-a', 'basic', 2, true, false);
      });

      const levelProgress = result.current.getListLevelProgress('list-a', 'basic');
      expect(levelProgress).toHaveLength(2);
    });
  });

  describe('Best Score Tracking', () => {
    it('sets initial best score on first completion', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.startSession('list-a', 'basic');
        result.current.endSession('list-a', 'basic', { hints: 2, wrong: 1, correct: 10 });
      });

      const bestScore = result.current.getBestScore('list-a', 'basic');
      expect(bestScore).toBeDefined();
      expect(bestScore?.hints).toBe(2);
      expect(bestScore?.wrong).toBe(1);
    });

    it('updates best score when new score is better (fewer hints)', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.startSession('list-a', 'basic');
        result.current.endSession('list-a', 'basic', { hints: 3, wrong: 2, correct: 10 });
      });

      act(() => {
        result.current.startSession('list-a', 'basic');
        result.current.endSession('list-a', 'basic', { hints: 1, wrong: 2, correct: 10 });
      });

      const bestScore = result.current.getBestScore('list-a', 'basic');
      expect(bestScore?.hints).toBe(1);
    });

    it('updates best score when hints same but fewer wrong', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.startSession('list-a', 'basic');
        result.current.endSession('list-a', 'basic', { hints: 2, wrong: 3, correct: 10 });
      });

      act(() => {
        result.current.startSession('list-a', 'basic');
        result.current.endSession('list-a', 'basic', { hints: 2, wrong: 1, correct: 10 });
      });

      const bestScore = result.current.getBestScore('list-a', 'basic');
      expect(bestScore?.wrong).toBe(1);
    });

    it('does not update best score when new score is worse', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.startSession('list-a', 'basic');
        result.current.endSession('list-a', 'basic', { hints: 1, wrong: 1, correct: 10 });
      });

      act(() => {
        result.current.startSession('list-a', 'basic');
        result.current.endSession('list-a', 'basic', { hints: 3, wrong: 2, correct: 10 });
      });

      const bestScore = result.current.getBestScore('list-a', 'basic');
      expect(bestScore?.hints).toBe(1);
      expect(bestScore?.wrong).toBe(1);
    });
  });

  describe('Global Stats Tracking', () => {
    it('increments global stats correctly', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.incrementGlobalStats(3, 2, 10);
      });

      const stats = result.current.getGlobalStats();
      expect(stats.allTimeHints).toBe(3);
      expect(stats.allTimeWrong).toBe(2);
      expect(stats.allTimeCorrect).toBe(10);
    });

    it('accumulates stats across multiple sessions', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.incrementGlobalStats(2, 1, 8);
        result.current.incrementGlobalStats(3, 2, 7);
      });

      const stats = result.current.getGlobalStats();
      expect(stats.allTimeHints).toBe(5);
      expect(stats.allTimeWrong).toBe(3);
      expect(stats.allTimeCorrect).toBe(15);
    });

    it('tracks total words learned correctly', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 3, true, false);
        result.current.updateWordProgress('word-2', 'list-a', 'basic', 3, true, false);
        result.current.updateWordProgress('word-3', 'list-b', 'basic', 3, true, false);
      });

      const totalLearned = result.current.getTotalWordsLearned();
      expect(totalLearned).toBe(3);
    });

    it('does not count non-mastered words in total learned', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 3, true, false);
        result.current.updateWordProgress('word-2', 'list-a', 'basic', 2, true, false);
        result.current.updateWordProgress('word-3', 'list-a', 'basic', 1, true, false);
      });

      const totalLearned = result.current.getTotalWordsLearned();
      expect(totalLearned).toBe(1);
    });
  });

  describe('Progress Calculation', () => {
    it('calculates level progress correctly', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 3, true, false);
        result.current.updateWordProgress('word-2', 'list-a', 'basic', 3, true, false);
        result.current.updateWordProgress('word-3', 'list-a', 'basic', 2, true, false);
        result.current.updateWordProgress('word-4', 'list-a', 'basic', 1, true, false);
      });

      const progress = result.current.calculateLevelProgress('list-a', 'basic');
      expect(progress).toBe(50); // 2 out of 4 words mastered = 50%
    });

    it('returns 0 progress for empty level', () => {
      const { result } = renderHook(() => useProgressStore());

      const progress = result.current.calculateLevelProgress('list-a', 'basic');
      expect(progress).toBe(0);
    });

    it('calculates list progress across multiple levels', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        // Level 1: 2/2 words
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 3, true, false);
        result.current.updateWordProgress('word-2', 'list-a', 'basic', 3, true, false);

        // Level 2: 1/2 words
        result.current.updateWordProgress('word-3', 'list-a', 'intermediate', 3, true, false);
        result.current.updateWordProgress('word-4', 'list-a', 'intermediate', 2, true, false);
      });

      const progress = result.current.calculateListProgress('list-a');
      expect(progress).toBe(75); // 3 out of 4 words mastered = 75%
    });
  });

  describe('Completion Tracking', () => {
    it('detects level completion', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 3, true, false);
        result.current.updateWordProgress('word-2', 'list-a', 'basic', 3, true, false);
      });

      // Mock level is complete
      const progress = result.current.calculateLevelProgress('list-a', 'basic');
      const isComplete = progress === 100;
      expect(isComplete).toBe(true);
    });

    it('detects list completion', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 3, true, false);
        result.current.updateWordProgress('word-2', 'list-a', 'basic', 3, true, false);
      });

      const isComplete = result.current.isListCompleted('list-a');
      expect(isComplete).toBe(true);
    });

    it('returns false for incomplete list', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 3, true, false);
        result.current.updateWordProgress('word-2', 'list-a', 'basic', 2, true, false);
      });

      const isComplete = result.current.isListCompleted('list-a');
      expect(isComplete).toBe(false);
    });
  });

  describe('Reset Functionality', () => {
    it('resets list-level progress correctly', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 3, true, false);
        result.current.resetListLevelProgress('list-a', 'basic');
      });

      const progress = result.current.getListLevelProgress('list-a', 'basic');
      expect(progress).toHaveLength(0);
    });

    it('resets all progress correctly', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 3, true, false);
        result.current.incrementGlobalStats(5, 3, 10);
        result.current.resetAllProgress();
      });

      expect(result.current.listLevelProgress).toEqual({});
      const stats = result.current.getGlobalStats();
      expect(stats.allTimeHints).toBe(0);
      expect(stats.allTimeWrong).toBe(0);
      expect(stats.allTimeCorrect).toBe(0);
    });

    it('preserves other levels when resetting one level', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.updateWordProgress('word-1', 'list-a', 'basic', 3, true, false);
        result.current.updateWordProgress('word-2', 'list-a', 'intermediate', 3, true, false);
        result.current.resetListLevelProgress('list-a', 'basic');
      });

      const basicProgress = result.current.getListLevelProgress('list-a', 'basic');
      const intermediateProgress = result.current.getListLevelProgress('list-a', 'intermediate');

      expect(basicProgress).toHaveLength(0);
      expect(intermediateProgress).toHaveLength(1);
    });
  });

  describe('Session Management', () => {
    it('starts session correctly', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.startSession('list-a', 'basic');
      });

      expect(result.current.currentListId).toBe('list-a');
      expect(result.current.currentLevelId).toBe('basic');
    });

    it('ends session and updates stats', () => {
      const { result } = renderHook(() => useProgressStore());

      act(() => {
        result.current.startSession('list-a', 'basic');
        result.current.endSession('list-a', 'basic', { hints: 2, wrong: 1, correct: 10 });
      });

      const stats = result.current.getGlobalStats();
      expect(stats.allTimeHints).toBe(2);
      expect(stats.allTimeWrong).toBe(1);
      expect(stats.allTimeCorrect).toBe(10);
    });
  });
});
