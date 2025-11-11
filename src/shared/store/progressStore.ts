/**
 * Progress Store
 *
 * Manages user progress tracking.
 * Tracks word states, best scores, and all-time statistics.
 * Progress is persisted to AsyncStorage directly (without Zustand persist middleware).
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WordProgress,
  ListLevelProgress,
  UserProgress,
  WordState,
  Achievement,
} from '@/shared/types';
import { checkAllAchievements, getAllAchievements } from '@/features/progress/utils/achievements';

const STORAGE_KEY = 'vocabulary-progress';

interface ProgressState extends UserProgress {
  // Loading state
  isLoading: boolean;
  lastSyncedAt: string | null;

  // Word progress actions
  updateWordProgress: (
    wordId: string,
    listId: string,
    levelId: string,
    newState: WordState,
    isCorrect: boolean,
    hintUsed: boolean
  ) => void;
  getWordProgress: (wordId: string) => WordProgress | undefined;
  getListLevelProgress: (listId: string, levelId: string) => WordProgress[];

  // Session stats actions
  startSession: (listId: string, levelId: string) => void;
  endSession: (
    listId: string,
    levelId: string,
    stats: { hints: number; wrong: number; correct: number }
  ) => void;

  // Best score tracking
  updateBestScore: (
    listId: string,
    levelId: string,
    stats: { hints: number; wrong: number }
  ) => void;
  getBestScore: (
    listId: string,
    levelId: string
  ) => { hints: number; wrong: number; completedAt: string } | undefined;

  // Global stats tracking
  incrementGlobalStats: (hints: number, wrong: number, correct: number) => void;
  getGlobalStats: () => UserProgress['globalStats'];

  // Progress calculation
  calculateListProgress: (listId: string) => number;
  calculateLevelProgress: (listId: string, levelId: string) => number;
  getTotalWordsLearned: () => number;

  // List completion tracking
  isListCompleted: (listId: string) => boolean;
  isLevelCompleted: (listId: string, levelId: string) => boolean;

  // Reset functionality
  resetListLevelProgress: (listId: string, levelId: string) => void;
  resetAllProgress: () => void;

  // Achievement tracking
  checkAndUnlockAchievements: (sessionData?: {
    listId: string;
    levelId: string;
    hints: number;
    wrong: number;
    durationMinutes: number;
  }) => Achievement[];
  getAchievements: () => Achievement[];
  getUnlockedAchievements: () => Achievement[];

  // Utility
  _hydrated: boolean;
  setHydrated: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const initialState: Omit<
  ProgressState,
  | 'updateWordProgress'
  | 'getWordProgress'
  | 'getListLevelProgress'
  | 'startSession'
  | 'endSession'
  | 'updateBestScore'
  | 'getBestScore'
  | 'incrementGlobalStats'
  | 'getGlobalStats'
  | 'calculateListProgress'
  | 'calculateLevelProgress'
  | 'getTotalWordsLearned'
  | 'isListCompleted'
  | 'isLevelCompleted'
  | 'resetListLevelProgress'
  | 'resetAllProgress'
  | 'checkAndUnlockAchievements'
  | 'getAchievements'
  | 'getUnlockedAchievements'
  | '_hydrated'
  | 'setHydrated'
> = {
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
};

// Helper to save state to AsyncStorage
const saveStateToStorage = async (state: ProgressState) => {
  try {
    const dataToSave = {
      currentListId: state.currentListId,
      currentLevelId: state.currentLevelId,
      listLevelProgress: state.listLevelProgress,
      globalStats: state.globalStats,
      achievements: state.achievements,
      dailyProgress: state.dailyProgress,
      lastSyncedAt: state.lastSyncedAt,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Failed to save progress to storage:', error);
  }
};

export const useProgressStore = create<ProgressState>()((set, get) => ({
  ...initialState,
  _hydrated: false,

  setHydrated: () => set({ _hydrated: true }),

  // Load progress from AsyncStorage
  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          ...data,
          _hydrated: true,
        });
      } else {
        set({ _hydrated: true });
      }
    } catch (error) {
      console.error('Failed to load progress from storage:', error);
      set({ _hydrated: true });
    }
  },

  // Save progress to AsyncStorage
  saveToStorage: async () => {
    await saveStateToStorage(get());
  },

      // Update word progress
      updateWordProgress: (wordId, listId, levelId, newState, isCorrect, hintUsed) => {
        const state = get();
        const key = `${listId}-${levelId}`;
        const now = new Date().toISOString();

        // Get or create list-level progress
        const listLevel = state.listLevelProgress[key] || {
          listId,
          levelId,
          wordProgress: {},
        };

        // Get or create word progress
        const wordProgress = listLevel.wordProgress[wordId] || {
          state: 0,
          hintsUsed: 0,
          wrongAttempts: 0,
          correctAttempts: 0,
          lastAttemptDate: now,
          firstAttemptDate: now,
        };

        // Update word progress
        const updatedWordProgress: WordProgress = {
          ...wordProgress,
          state: newState,
          hintsUsed: wordProgress.hintsUsed + (hintUsed ? 1 : 0),
          wrongAttempts: wordProgress.wrongAttempts + (isCorrect ? 0 : 1),
          correctAttempts: wordProgress.correctAttempts + (isCorrect ? 1 : 0),
          lastAttemptDate: now,
          masteredDate:
            newState === 3 && !wordProgress.masteredDate ? now : wordProgress.masteredDate,
        };

        // Update list-level progress
        const updatedListLevel: ListLevelProgress = {
          ...listLevel,
          wordProgress: {
            ...listLevel.wordProgress,
            [wordId]: updatedWordProgress,
          },
        };

        // Update daily progress if word was just mastered
        const wasJustMastered = newState === 3 && wordProgress.state !== 3;
        const updatedDailyProgress = { ...state.dailyProgress };
        if (wasJustMastered) {
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          updatedDailyProgress[today] = (updatedDailyProgress[today] || 0) + 1;
        }

        set({
          listLevelProgress: {
            ...state.listLevelProgress,
            [key]: updatedListLevel,
          },
          dailyProgress: updatedDailyProgress,
          lastSyncedAt: now,
        });

        // Save to storage after update
        saveStateToStorage(get());
      },

      // Get word progress
      getWordProgress: (wordId) => {
        const state = get();
        // Search through all list-level progress
        for (const listLevel of Object.values(state.listLevelProgress)) {
          if (listLevel.wordProgress[wordId]) {
            return listLevel.wordProgress[wordId];
          }
        }
        return undefined;
      },

      // Get list-level progress
      getListLevelProgress: (listId, levelId) => {
        const key = `${listId}-${levelId}`;
        const listLevel = get().listLevelProgress[key];
        return listLevel ? Object.values(listLevel.wordProgress) : [];
      },

      // Start session
      startSession: (listId, levelId) => {
        set({
          currentListId: listId,
          currentLevelId: levelId,
        });
      },

      // End session
      endSession: (listId, levelId, stats) => {
        get().updateBestScore(listId, levelId, { hints: stats.hints, wrong: stats.wrong });
        get().incrementGlobalStats(stats.hints, stats.wrong, stats.correct);
      },

      // Update best score
      updateBestScore: (listId, levelId, stats) => {
        const state = get();
        const key = `${listId}-${levelId}`;
        const now = new Date().toISOString();

        // Get or create list-level progress
        const listLevel = state.listLevelProgress[key] || {
          listId,
          levelId,
          wordProgress: {},
        };

        const currentBest = listLevel.bestScore;

        // Better score = fewer hints AND fewer wrong, or no previous best
        const isBetter =
          !currentBest ||
          stats.hints < currentBest.hints ||
          (stats.hints === currentBest.hints && stats.wrong < currentBest.wrong);

        if (isBetter) {
          set({
            listLevelProgress: {
              ...state.listLevelProgress,
              [key]: {
                ...listLevel,
                bestScore: {
                  hints: stats.hints,
                  wrong: stats.wrong,
                  completedAt: now,
                },
              },
            },
          });

          // Save to storage after update
          saveStateToStorage(get());
        }
      },

      // Get best score
      getBestScore: (listId, levelId) => {
        const key = `${listId}-${levelId}`;
        return get().listLevelProgress[key]?.bestScore;
      },

      // Increment global stats
      incrementGlobalStats: (hints, wrong, correct) => {
        const state = get();
        set({
          globalStats: {
            ...state.globalStats,
            allTimeHints: state.globalStats.allTimeHints + hints,
            allTimeWrong: state.globalStats.allTimeWrong + wrong,
            allTimeCorrect: state.globalStats.allTimeCorrect + correct,
            totalWordsLearned: get().getTotalWordsLearned(),
          },
        });

        // Save to storage after update
        saveStateToStorage(get());
      },

      // Get global stats
      getGlobalStats: () => {
        return get().globalStats;
      },

      // Calculate list progress (percentage)
      calculateListProgress: (listId) => {
        const state = get();
        let totalWords = 0;
        let masteredWords = 0;

        // Count words across all levels for this list
        Object.values(state.listLevelProgress).forEach((listLevel) => {
          if (listLevel.listId === listId) {
            Object.values(listLevel.wordProgress).forEach((wordProgress) => {
              totalWords++;
              if (wordProgress.state === 3) {
                masteredWords++;
              }
            });
          }
        });

        return totalWords > 0 ? (masteredWords / totalWords) * 100 : 0;
      },

      // Calculate level progress (percentage)
      calculateLevelProgress: (listId, levelId) => {
        const key = `${listId}-${levelId}`;
        const listLevel = get().listLevelProgress[key];

        if (!listLevel) return 0;

        const wordProgressArray = Object.values(listLevel.wordProgress);
        const totalWords = wordProgressArray.length;
        const masteredWords = wordProgressArray.filter((wp) => wp.state === 3).length;

        return totalWords > 0 ? (masteredWords / totalWords) * 100 : 0;
      },

      // Get total words learned
      getTotalWordsLearned: () => {
        const state = get();
        const uniqueWords = new Set<string>();

        // Count unique words at state 3
        Object.values(state.listLevelProgress).forEach((listLevel) => {
          Object.entries(listLevel.wordProgress).forEach(([wordId, wordProgress]) => {
            if (wordProgress.state === 3) {
              uniqueWords.add(wordId);
            }
          });
        });

        return uniqueWords.size;
      },

      // Check if list is completed
      isListCompleted: (listId) => {
        const progress = get().calculateListProgress(listId);
        return progress === 100;
      },

      // Check if level is completed
      isLevelCompleted: (listId, levelId) => {
        const progress = get().calculateLevelProgress(listId, levelId);
        return progress === 100;
      },

      // Reset list-level progress
      resetListLevelProgress: (listId, levelId) => {
        const state = get();
        const key = `${listId}-${levelId}`;
        const newListLevelProgress = { ...state.listLevelProgress };
        delete newListLevelProgress[key];

        set({
          listLevelProgress: newListLevelProgress,
        });

        // Save to storage after reset
        saveStateToStorage(get());
      },

      // Reset all progress
      resetAllProgress: () => {
        set({
          ...initialState,
          _hydrated: true,
        });

        // Clear storage
        AsyncStorage.removeItem(STORAGE_KEY).catch((error) =>
          console.error('Failed to clear storage:', error)
        );
      },

      // Check and unlock achievements
      checkAndUnlockAchievements: (sessionData) => {
        const state = get();
        const currentAchievements = state.achievements || [];

        // Get current progress as UserProgress (without methods)
        const progress: UserProgress = {
          currentListId: state.currentListId,
          currentLevelId: state.currentLevelId,
          listLevelProgress: state.listLevelProgress,
          globalStats: state.globalStats,
          achievements: currentAchievements,
        };

        // Check for newly unlocked achievements
        const newlyUnlocked = checkAllAchievements(progress, currentAchievements, sessionData);

        // Update state with newly unlocked achievements
        if (newlyUnlocked.length > 0) {
          set({
            achievements: [...currentAchievements, ...newlyUnlocked],
          });

          // Save to storage after unlocking achievements
          saveStateToStorage(get());
        }

        return newlyUnlocked;
      },

      // Get all achievements with their current state
      getAchievements: () => {
        const state = get();
        const progress: UserProgress = {
          currentListId: state.currentListId,
          currentLevelId: state.currentLevelId,
          listLevelProgress: state.listLevelProgress,
          globalStats: state.globalStats,
          achievements: state.achievements,
        };

        return getAllAchievements(progress, state.achievements || []);
      },

      // Get only unlocked achievements
      getUnlockedAchievements: () => {
        const state = get();
        return (state.achievements || []).filter((a) => a.isUnlocked);
      },
}));
