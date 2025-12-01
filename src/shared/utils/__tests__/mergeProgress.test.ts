/**
 * Merge Progress Tests
 *
 * Tests for the progress merging utilities using "higher wins" strategy.
 */

import {
  mergeProgress,
  mergeWordProgress,
  mergeListLevelProgress,
  mergeAchievements,
} from '../mergeProgress';
import type { UserProgress, WordProgress, ListLevelProgress, Achievement } from '@/shared/types';

describe('mergeProgress', () => {
  describe('mergeWordProgress', () => {
    const baseWordProgress: WordProgress = {
      state: 1,
      hintsUsed: 2,
      wrongAttempts: 1,
      correctAttempts: 3,
      lastAttemptDate: '2024-01-10T10:00:00Z',
      firstAttemptDate: '2024-01-05T10:00:00Z',
    };

    it('takes higher state value', () => {
      const local: WordProgress = { ...baseWordProgress, state: 2 };
      const cloud: WordProgress = { ...baseWordProgress, state: 1 };

      const result = mergeWordProgress(local, cloud);
      expect(result.state).toBe(2);

      const result2 = mergeWordProgress(cloud, local);
      expect(result2.state).toBe(2);
    });

    it('takes higher numeric values for attempts and hints', () => {
      const local: WordProgress = {
        ...baseWordProgress,
        hintsUsed: 5,
        wrongAttempts: 3,
        correctAttempts: 10,
      };
      const cloud: WordProgress = {
        ...baseWordProgress,
        hintsUsed: 2,
        wrongAttempts: 5,
        correctAttempts: 7,
      };

      const result = mergeWordProgress(local, cloud);
      expect(result.hintsUsed).toBe(5);
      expect(result.wrongAttempts).toBe(5);
      expect(result.correctAttempts).toBe(10);
    });

    it('takes most recent lastAttemptDate', () => {
      const local: WordProgress = { ...baseWordProgress, lastAttemptDate: '2024-01-15T10:00:00Z' };
      const cloud: WordProgress = { ...baseWordProgress, lastAttemptDate: '2024-01-10T10:00:00Z' };

      const result = mergeWordProgress(local, cloud);
      expect(result.lastAttemptDate).toBe('2024-01-15T10:00:00Z');
    });

    it('takes earliest firstAttemptDate', () => {
      const local: WordProgress = { ...baseWordProgress, firstAttemptDate: '2024-01-05T10:00:00Z' };
      const cloud: WordProgress = { ...baseWordProgress, firstAttemptDate: '2024-01-01T10:00:00Z' };

      const result = mergeWordProgress(local, cloud);
      expect(result.firstAttemptDate).toBe('2024-01-01T10:00:00Z');
    });

    it('takes earliest masteredDate when both have it', () => {
      const local: WordProgress = { ...baseWordProgress, masteredDate: '2024-01-15T10:00:00Z' };
      const cloud: WordProgress = { ...baseWordProgress, masteredDate: '2024-01-10T10:00:00Z' };

      const result = mergeWordProgress(local, cloud);
      expect(result.masteredDate).toBe('2024-01-10T10:00:00Z');
    });

    it('preserves masteredDate if only one has it', () => {
      const local: WordProgress = { ...baseWordProgress, masteredDate: '2024-01-15T10:00:00Z' };
      const cloud: WordProgress = { ...baseWordProgress };

      const result = mergeWordProgress(local, cloud);
      expect(result.masteredDate).toBe('2024-01-15T10:00:00Z');
    });
  });

  describe('mergeListLevelProgress', () => {
    const baseListLevel: ListLevelProgress = {
      listId: 'list1',
      levelId: 'level1',
      wordProgress: {},
    };

    it('merges wordProgress from both sources', () => {
      const local: ListLevelProgress = {
        ...baseListLevel,
        wordProgress: {
          word1: {
            state: 2,
            hintsUsed: 1,
            wrongAttempts: 0,
            correctAttempts: 3,
            lastAttemptDate: '2024-01-15T10:00:00Z',
            firstAttemptDate: '2024-01-10T10:00:00Z',
          },
        },
      };
      const cloud: ListLevelProgress = {
        ...baseListLevel,
        wordProgress: {
          word2: {
            state: 1,
            hintsUsed: 2,
            wrongAttempts: 1,
            correctAttempts: 2,
            lastAttemptDate: '2024-01-12T10:00:00Z',
            firstAttemptDate: '2024-01-08T10:00:00Z',
          },
        },
      };

      const result = mergeListLevelProgress(local, cloud);
      expect(Object.keys(result.wordProgress)).toContain('word1');
      expect(Object.keys(result.wordProgress)).toContain('word2');
    });

    it('merges shared word progress correctly', () => {
      const local: ListLevelProgress = {
        ...baseListLevel,
        wordProgress: {
          word1: {
            state: 2,
            hintsUsed: 3,
            wrongAttempts: 1,
            correctAttempts: 5,
            lastAttemptDate: '2024-01-15T10:00:00Z',
            firstAttemptDate: '2024-01-10T10:00:00Z',
          },
        },
      };
      const cloud: ListLevelProgress = {
        ...baseListLevel,
        wordProgress: {
          word1: {
            state: 3,
            hintsUsed: 1,
            wrongAttempts: 2,
            correctAttempts: 3,
            lastAttemptDate: '2024-01-12T10:00:00Z',
            firstAttemptDate: '2024-01-08T10:00:00Z',
          },
        },
      };

      const result = mergeListLevelProgress(local, cloud);
      expect(result.wordProgress.word1.state).toBe(3);
      expect(result.wordProgress.word1.hintsUsed).toBe(3);
      expect(result.wordProgress.word1.wrongAttempts).toBe(2);
      expect(result.wordProgress.word1.correctAttempts).toBe(5);
    });

    it('takes better bestScore', () => {
      const local: ListLevelProgress = {
        ...baseListLevel,
        bestScore: { hints: 2, wrong: 1, completedAt: '2024-01-15T10:00:00Z' },
      };
      const cloud: ListLevelProgress = {
        ...baseListLevel,
        bestScore: { hints: 1, wrong: 2, completedAt: '2024-01-10T10:00:00Z' },
      };

      const result = mergeListLevelProgress(local, cloud);
      // Better = fewer hints, or equal hints and fewer wrong
      expect(result.bestScore?.hints).toBe(1);
    });

    it('preserves bestScore when only one has it', () => {
      const local: ListLevelProgress = {
        ...baseListLevel,
        bestScore: { hints: 2, wrong: 1, completedAt: '2024-01-15T10:00:00Z' },
      };
      const cloud: ListLevelProgress = { ...baseListLevel };

      const result = mergeListLevelProgress(local, cloud);
      expect(result.bestScore).toEqual(local.bestScore);
    });
  });

  describe('mergeAchievements', () => {
    const baseAchievement: Achievement = {
      id: 'ach1',
      name: 'First Steps',
      description: 'Complete your first quiz',
      icon: 'star',
      category: 'milestone',
      isUnlocked: false,
    };

    it('unions achievements by id', () => {
      const local: Achievement[] = [{ ...baseAchievement, id: 'ach1' }];
      const cloud: Achievement[] = [{ ...baseAchievement, id: 'ach2', name: 'Second Steps' }];

      const result = mergeAchievements(local, cloud);
      expect(result).toHaveLength(2);
      expect(result.map((a) => a.id)).toContain('ach1');
      expect(result.map((a) => a.id)).toContain('ach2');
    });

    it('prefers unlocked version for same achievement', () => {
      const local: Achievement[] = [{ ...baseAchievement, id: 'ach1', isUnlocked: false }];
      const cloud: Achievement[] = [
        { ...baseAchievement, id: 'ach1', isUnlocked: true, unlockedAt: '2024-01-15T10:00:00Z' },
      ];

      const result = mergeAchievements(local, cloud);
      expect(result).toHaveLength(1);
      expect(result[0].isUnlocked).toBe(true);
      expect(result[0].unlockedAt).toBe('2024-01-15T10:00:00Z');
    });

    it('takes earliest unlockedAt when both are unlocked', () => {
      const local: Achievement[] = [
        { ...baseAchievement, id: 'ach1', isUnlocked: true, unlockedAt: '2024-01-15T10:00:00Z' },
      ];
      const cloud: Achievement[] = [
        { ...baseAchievement, id: 'ach1', isUnlocked: true, unlockedAt: '2024-01-10T10:00:00Z' },
      ];

      const result = mergeAchievements(local, cloud);
      expect(result[0].unlockedAt).toBe('2024-01-10T10:00:00Z');
    });

    it('takes higher progress value', () => {
      const local: Achievement[] = [
        { ...baseAchievement, id: 'ach1', progress: 50, target: 100 },
      ];
      const cloud: Achievement[] = [
        { ...baseAchievement, id: 'ach1', progress: 30, target: 100 },
      ];

      const result = mergeAchievements(local, cloud);
      expect(result[0].progress).toBe(50);
    });

    it('handles empty arrays', () => {
      expect(mergeAchievements([], [])).toEqual([]);
      expect(mergeAchievements([baseAchievement], [])).toEqual([baseAchievement]);
      expect(mergeAchievements([], [baseAchievement])).toEqual([baseAchievement]);
    });
  });

  describe('mergeProgress (full)', () => {
    const emptyProgress: UserProgress = {
      listLevelProgress: {},
      globalStats: {
        allTimeHints: 0,
        allTimeWrong: 0,
        allTimeCorrect: 0,
        totalWordsLearned: 0,
        listsCompleted: [],
      },
    };

    it('merges globalStats with max values', () => {
      const local: UserProgress = {
        ...emptyProgress,
        globalStats: {
          allTimeHints: 10,
          allTimeWrong: 5,
          allTimeCorrect: 50,
          totalWordsLearned: 25,
          listsCompleted: ['list1'],
        },
      };
      const cloud: UserProgress = {
        ...emptyProgress,
        globalStats: {
          allTimeHints: 5,
          allTimeWrong: 10,
          allTimeCorrect: 40,
          totalWordsLearned: 20,
          listsCompleted: ['list2'],
        },
      };

      const result = mergeProgress(local, cloud);
      expect(result.globalStats.allTimeHints).toBe(10);
      expect(result.globalStats.allTimeWrong).toBe(10);
      expect(result.globalStats.allTimeCorrect).toBe(50);
      expect(result.globalStats.totalWordsLearned).toBe(25);
      expect(result.globalStats.listsCompleted).toContain('list1');
      expect(result.globalStats.listsCompleted).toContain('list2');
    });

    it('merges listLevelProgress by key', () => {
      const local: UserProgress = {
        ...emptyProgress,
        listLevelProgress: {
          'list1-level1': {
            listId: 'list1',
            levelId: 'level1',
            wordProgress: {
              word1: {
                state: 2,
                hintsUsed: 1,
                wrongAttempts: 0,
                correctAttempts: 3,
                lastAttemptDate: '2024-01-15T10:00:00Z',
                firstAttemptDate: '2024-01-10T10:00:00Z',
              },
            },
          },
        },
      };
      const cloud: UserProgress = {
        ...emptyProgress,
        listLevelProgress: {
          'list1-level2': {
            listId: 'list1',
            levelId: 'level2',
            wordProgress: {},
          },
        },
      };

      const result = mergeProgress(local, cloud);
      expect(Object.keys(result.listLevelProgress)).toContain('list1-level1');
      expect(Object.keys(result.listLevelProgress)).toContain('list1-level2');
    });

    it('merges dailyProgress by date with max values', () => {
      const local: UserProgress = {
        ...emptyProgress,
        dailyProgress: { '2024-01-15': 5, '2024-01-16': 3 },
      };
      const cloud: UserProgress = {
        ...emptyProgress,
        dailyProgress: { '2024-01-15': 3, '2024-01-17': 7 },
      };

      const result = mergeProgress(local, cloud);
      expect(result.dailyProgress?.['2024-01-15']).toBe(5);
      expect(result.dailyProgress?.['2024-01-16']).toBe(3);
      expect(result.dailyProgress?.['2024-01-17']).toBe(7);
    });

    it('preserves currentListId and currentLevelId from local', () => {
      const local: UserProgress = {
        ...emptyProgress,
        currentListId: 'list1',
        currentLevelId: 'level1',
      };
      const cloud: UserProgress = {
        ...emptyProgress,
        currentListId: 'list2',
        currentLevelId: 'level2',
      };

      const result = mergeProgress(local, cloud);
      // Local takes precedence for current position (user's active state)
      expect(result.currentListId).toBe('list1');
      expect(result.currentLevelId).toBe('level1');
    });

    it('handles undefined/null fields gracefully', () => {
      const local: UserProgress = {
        listLevelProgress: {},
        globalStats: {
          allTimeHints: 5,
          allTimeWrong: 2,
          allTimeCorrect: 10,
          totalWordsLearned: 5,
          listsCompleted: [],
        },
      };
      const cloud: UserProgress = {
        listLevelProgress: {},
        globalStats: {
          allTimeHints: 0,
          allTimeWrong: 0,
          allTimeCorrect: 0,
          totalWordsLearned: 0,
          listsCompleted: [],
        },
        achievements: undefined,
        dailyProgress: undefined,
      };

      expect(() => mergeProgress(local, cloud)).not.toThrow();
      const result = mergeProgress(local, cloud);
      expect(result.globalStats.allTimeHints).toBe(5);
    });

    it('is a pure function (no mutations)', () => {
      const local: UserProgress = {
        ...emptyProgress,
        globalStats: {
          allTimeHints: 10,
          allTimeWrong: 5,
          allTimeCorrect: 50,
          totalWordsLearned: 25,
          listsCompleted: ['list1'],
        },
      };
      const cloud: UserProgress = {
        ...emptyProgress,
        globalStats: {
          allTimeHints: 5,
          allTimeWrong: 10,
          allTimeCorrect: 40,
          totalWordsLearned: 20,
          listsCompleted: ['list2'],
        },
      };

      const localCopy = JSON.parse(JSON.stringify(local));
      const cloudCopy = JSON.parse(JSON.stringify(cloud));

      mergeProgress(local, cloud);

      expect(local).toEqual(localCopy);
      expect(cloud).toEqual(cloudCopy);
    });
  });
});
