/**
 * Progress Store Tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProgressStore } from '../progressStore';
import { makeListLevelKey } from '@/shared/utils/listLevelKey';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock sync service
jest.mock('@/shared/services/syncService', () => ({
  checkUsername: jest.fn(),
  getProgress: jest.fn(),
  saveProgress: jest.fn(),
  isApiConfigured: jest.fn(() => false),
  SyncError: class SyncError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
    }
  },
}));

// Mock achievements
jest.mock('@/features/progress/utils/achievements', () => ({
  checkAllAchievements: jest.fn(() => []),
  getAllAchievements: jest.fn(() => []),
}));

describe('progressStore', () => {
  const initialProgressState = {
    currentListId: undefined,
    currentLevelId: undefined,
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
    syncStatus: 'idle' as const,
    lastSyncError: null,
    lastCloudSyncAt: null,
    _hydrated: false,
  };

  beforeEach(() => {
    // Reset store to initial state
    useProgressStore.setState({
      ...initialProgressState,
      _hydrated: true,
    });

    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('loadFromStorage', () => {
    it('loads progress from AsyncStorage', async () => {
      const storedData = {
        listLevelProgress: {
          [makeListLevelKey('list1', 'basic')]: {
            listId: 'list1',
            levelId: 'basic',
            wordProgress: {
              word1: { state: 3, hintsUsed: 0, wrongAttempts: 0, correctAttempts: 1 },
            },
          },
        },
        globalStats: {
          allTimeHints: 5,
          allTimeWrong: 10,
          allTimeCorrect: 50,
          totalWordsLearned: 25,
          listsCompleted: [],
        },
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(storedData));
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('testuser');

      await useProgressStore.getState().loadFromStorage();

      const state = useProgressStore.getState();
      expect(state.listLevelProgress).toEqual(storedData.listLevelProgress);
      expect(state.globalStats).toEqual(storedData.globalStats);
      expect(state.username).toBe('testuser');
      expect(state._hydrated).toBe(true);
    });

    it('handles missing storage data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await useProgressStore.getState().loadFromStorage();

      const state = useProgressStore.getState();
      expect(state._hydrated).toBe(true);
      expect(state.username).toBeNull();
    });

    it('handles storage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await useProgressStore.getState().loadFromStorage();

      const state = useProgressStore.getState();
      expect(state._hydrated).toBe(true);
    });
  });

  describe('updateWordProgress', () => {
    it('updates word progress correctly', () => {
      const store = useProgressStore.getState();
      store.updateWordProgress('word1', 'list1', 'basic', 1, true, false);

      const state = useProgressStore.getState();
      const wordProgress = state.listLevelProgress[makeListLevelKey('list1', 'basic')]?.wordProgress['word1'];

      expect(wordProgress).toBeDefined();
      expect(wordProgress?.state).toBe(1);
      expect(wordProgress?.correctAttempts).toBe(1);
      expect(wordProgress?.wrongAttempts).toBe(0);
      expect(wordProgress?.hintsUsed).toBe(0);
    });

    it('increments hints when hint is used', () => {
      const store = useProgressStore.getState();
      store.updateWordProgress('word1', 'list1', 'basic', 1, true, true);

      const state = useProgressStore.getState();
      const wordProgress = state.listLevelProgress[makeListLevelKey('list1', 'basic')]?.wordProgress['word1'];

      expect(wordProgress?.hintsUsed).toBe(1);
    });

    it('increments wrong attempts on incorrect answer', () => {
      const store = useProgressStore.getState();
      store.updateWordProgress('word1', 'list1', 'basic', 1, false, false);

      const state = useProgressStore.getState();
      const wordProgress = state.listLevelProgress[makeListLevelKey('list1', 'basic')]?.wordProgress['word1'];

      expect(wordProgress?.wrongAttempts).toBe(1);
      expect(wordProgress?.correctAttempts).toBe(0);
    });

    it('sets mastered date when state becomes 3', () => {
      const store = useProgressStore.getState();
      store.updateWordProgress('word1', 'list1', 'basic', 3, true, false);

      const state = useProgressStore.getState();
      const wordProgress = state.listLevelProgress[makeListLevelKey('list1', 'basic')]?.wordProgress['word1'];

      expect(wordProgress?.masteredDate).toBeDefined();
    });

    it('updates daily progress when word is mastered', () => {
      const store = useProgressStore.getState();
      store.updateWordProgress('word1', 'list1', 'basic', 3, true, false);

      const state = useProgressStore.getState();
      const today = new Date().toISOString().split('T')[0];

      expect(state.dailyProgress?.[today]).toBe(1);
    });

    it('schedules storage save after update', () => {
      const store = useProgressStore.getState();
      store.updateWordProgress('word1', 'list1', 'basic', 1, true, false);

      // Advance timers to trigger debounced save
      jest.advanceTimersByTime(600);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getWordProgress', () => {
    it('returns word progress when exists', () => {
      useProgressStore.setState({
        listLevelProgress: {
          [makeListLevelKey('list1', 'basic')]: {
            listId: 'list1',
            levelId: 'basic',
            wordProgress: {
              word1: {
                state: 2,
                hintsUsed: 1,
                wrongAttempts: 2,
                correctAttempts: 3,
                lastAttemptDate: '2024-01-01',
                firstAttemptDate: '2024-01-01',
              },
            },
          },
        },
      });

      const store = useProgressStore.getState();
      const progress = store.getWordProgress('word1');

      expect(progress?.state).toBe(2);
      expect(progress?.hintsUsed).toBe(1);
    });

    it('returns undefined for non-existent word', () => {
      const store = useProgressStore.getState();
      const progress = store.getWordProgress('non-existent');

      expect(progress).toBeUndefined();
    });
  });

  describe('session management', () => {
    it('starts session correctly', () => {
      const store = useProgressStore.getState();
      store.startSession('list1', 'basic');

      const state = useProgressStore.getState();
      expect(state.currentListId).toBe('list1');
      expect(state.currentLevelId).toBe('basic');
    });

    it('ends session and updates stats', () => {
      const store = useProgressStore.getState();
      store.startSession('list1', 'basic');
      store.endSession('list1', 'basic', { hints: 2, wrong: 3, correct: 5 });

      const state = useProgressStore.getState();
      expect(state.globalStats.allTimeHints).toBe(2);
      expect(state.globalStats.allTimeWrong).toBe(3);
      expect(state.globalStats.allTimeCorrect).toBe(5);
    });
  });

  describe('best score tracking', () => {
    it('sets best score on first completion', () => {
      const store = useProgressStore.getState();
      store.updateBestScore('list1', 'basic', { hints: 2, wrong: 1 });

      const bestScore = store.getBestScore('list1', 'basic');
      expect(bestScore?.hints).toBe(2);
      expect(bestScore?.wrong).toBe(1);
    });

    it('updates best score when improved', () => {
      const store = useProgressStore.getState();
      store.updateBestScore('list1', 'basic', { hints: 5, wrong: 3 });
      store.updateBestScore('list1', 'basic', { hints: 2, wrong: 1 });

      const bestScore = store.getBestScore('list1', 'basic');
      expect(bestScore?.hints).toBe(2);
      expect(bestScore?.wrong).toBe(1);
    });

    it('does not update when score is worse', () => {
      const store = useProgressStore.getState();
      store.updateBestScore('list1', 'basic', { hints: 2, wrong: 1 });
      store.updateBestScore('list1', 'basic', { hints: 5, wrong: 3 });

      const bestScore = store.getBestScore('list1', 'basic');
      expect(bestScore?.hints).toBe(2);
      expect(bestScore?.wrong).toBe(1);
    });
  });

  describe('progress calculation', () => {
    beforeEach(() => {
      useProgressStore.setState({
        listLevelProgress: {
          [makeListLevelKey('list1', 'basic')]: {
            listId: 'list1',
            levelId: 'basic',
            wordProgress: {
              word1: { state: 3, hintsUsed: 0, wrongAttempts: 0, correctAttempts: 1, lastAttemptDate: '', firstAttemptDate: '' },
              word2: { state: 3, hintsUsed: 0, wrongAttempts: 0, correctAttempts: 1, lastAttemptDate: '', firstAttemptDate: '' },
              word3: { state: 2, hintsUsed: 0, wrongAttempts: 0, correctAttempts: 1, lastAttemptDate: '', firstAttemptDate: '' },
              word4: { state: 1, hintsUsed: 0, wrongAttempts: 0, correctAttempts: 1, lastAttemptDate: '', firstAttemptDate: '' },
            },
          },
        },
      });
    });

    it('calculates level progress correctly', () => {
      const store = useProgressStore.getState();
      const progress = store.calculateLevelProgress('list1', 'basic');

      // 2 out of 4 words mastered = 50%
      expect(progress).toBe(50);
    });

    it('calculates list progress correctly', () => {
      const store = useProgressStore.getState();
      const progress = store.calculateListProgress('list1');

      // 2 out of 4 words mastered = 50%
      expect(progress).toBe(50);
    });

    it('returns 0 for non-existent level', () => {
      const store = useProgressStore.getState();
      const progress = store.calculateLevelProgress('list1', 'non-existent');

      expect(progress).toBe(0);
    });

    it('counts total words learned correctly', () => {
      const store = useProgressStore.getState();
      const total = store.getTotalWordsLearned();

      expect(total).toBe(2); // Only state 3 words
    });
  });

  describe('reset functionality', () => {
    it('resets list level progress', () => {
      useProgressStore.setState({
        listLevelProgress: {
          [makeListLevelKey('list1', 'basic')]: {
            listId: 'list1',
            levelId: 'basic',
            wordProgress: { word1: { state: 3, hintsUsed: 0, wrongAttempts: 0, correctAttempts: 1, lastAttemptDate: '', firstAttemptDate: '' } },
          },
        },
      });

      const store = useProgressStore.getState();
      store.resetListLevelProgress('list1', 'basic');

      const state = useProgressStore.getState();
      expect(state.listLevelProgress[makeListLevelKey('list1', 'basic')]).toBeUndefined();
    });

    it('resets all progress', async () => {
      useProgressStore.setState({
        listLevelProgress: {
          [makeListLevelKey('list1', 'basic')]: {
            listId: 'list1',
            levelId: 'basic',
            wordProgress: {},
          },
        },
        globalStats: {
          allTimeHints: 10,
          allTimeWrong: 5,
          allTimeCorrect: 50,
          totalWordsLearned: 25,
          listsCompleted: ['list1'],
        },
      });

      const store = useProgressStore.getState();
      await store.resetAllProgress();

      const state = useProgressStore.getState();
      expect(state.listLevelProgress).toEqual({});
      expect(state.globalStats.allTimeHints).toBe(0);
      expect(state.globalStats.totalWordsLearned).toBe(0);
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('username management', () => {
    it('sets username and persists to storage', async () => {
      const store = useProgressStore.getState();
      await store.setUsername('newuser');

      const state = useProgressStore.getState();
      expect(state.username).toBe('newuser');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('vocabulary-username', 'newuser');
    });

    it('removes username from storage when set to null', async () => {
      const store = useProgressStore.getState();
      await store.setUsername(null);

      const state = useProgressStore.getState();
      expect(state.username).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('vocabulary-username');
    });
  });
});
