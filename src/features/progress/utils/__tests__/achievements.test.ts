/**
 * Achievement System Tests
 *
 * Tests for achievement checking and unlocking logic.
 */

import {
  checkAchievement,
  checkAllAchievements,
  getAllAchievements,
  getAchievementCompletionPercentage,
  calculateCurrentStreak,
  ACHIEVEMENT_DEFINITIONS,
  Achievement,
} from '../achievements';
import { UserProgress } from '@/shared/types';

/**
 * Format a date as YYYY-MM-DD in local timezone.
 * Matches the format used by getLocalDateString() in achievements.ts
 */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('Achievement System', () => {
  const createEmptyProgress = (): UserProgress => ({
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
  });

  describe('checkAchievement', () => {
    describe('first-steps', () => {
      it('should unlock after completing first quiz', () => {
        const progress: UserProgress = {
          ...createEmptyProgress(),
          listLevelProgress: {
            'list-a-basic': {
              listId: 'list-a',
              levelId: 'basic',
              wordProgress: {},
              bestScore: { hints: 2, wrong: 1, completedAt: new Date().toISOString() },
            },
          },
        };

        const result = checkAchievement('first-steps', progress);
        expect(result.shouldUnlock).toBe(true);
      });

      it('should not unlock if no quiz completed', () => {
        const progress = createEmptyProgress();
        const result = checkAchievement('first-steps', progress);
        expect(result.shouldUnlock).toBe(false);
      });
    });

    describe('quick-learner', () => {
      it('should unlock when level completed in under 5 minutes', () => {
        const progress = createEmptyProgress();
        const sessionData = {
          listId: 'list-a',
          levelId: 'basic',
          hints: 1,
          wrong: 2,
          durationMinutes: 4.5,
        };

        const result = checkAchievement('quick-learner', progress, sessionData);
        expect(result.shouldUnlock).toBe(true);
      });

      it('should not unlock when level takes 5 minutes or more', () => {
        const progress = createEmptyProgress();
        const sessionData = {
          listId: 'list-a',
          levelId: 'basic',
          hints: 1,
          wrong: 2,
          durationMinutes: 5.5,
        };

        const result = checkAchievement('quick-learner', progress, sessionData);
        expect(result.shouldUnlock).toBe(false);
      });

      it('should not unlock without session data', () => {
        const progress = createEmptyProgress();
        const result = checkAchievement('quick-learner', progress);
        expect(result.shouldUnlock).toBe(false);
      });
    });

    describe('perfect-score', () => {
      it('should unlock with 0 hints and 0 wrong', () => {
        const progress = createEmptyProgress();
        const sessionData = {
          listId: 'list-a',
          levelId: 'basic',
          hints: 0,
          wrong: 0,
          durationMinutes: 10,
        };

        const result = checkAchievement('perfect-score', progress, sessionData);
        expect(result.shouldUnlock).toBe(true);
      });

      it('should not unlock with hints', () => {
        const progress = createEmptyProgress();
        const sessionData = {
          listId: 'list-a',
          levelId: 'basic',
          hints: 1,
          wrong: 0,
          durationMinutes: 10,
        };

        const result = checkAchievement('perfect-score', progress, sessionData);
        expect(result.shouldUnlock).toBe(false);
      });

      it('should not unlock with wrong answers', () => {
        const progress = createEmptyProgress();
        const sessionData = {
          listId: 'list-a',
          levelId: 'basic',
          hints: 0,
          wrong: 1,
          durationMinutes: 10,
        };

        const result = checkAchievement('perfect-score', progress, sessionData);
        expect(result.shouldUnlock).toBe(false);
      });
    });

    describe('word-master achievements', () => {
      it('should unlock word-master-50 at 50 words', () => {
        const progress: UserProgress = {
          ...createEmptyProgress(),
          globalStats: {
            ...createEmptyProgress().globalStats,
            totalWordsLearned: 50,
          },
        };

        const result = checkAchievement('word-master-50', progress);
        expect(result.shouldUnlock).toBe(true);
        expect(result.currentProgress).toBe(100);
      });

      it('should show progress for word-master-50', () => {
        const progress: UserProgress = {
          ...createEmptyProgress(),
          globalStats: {
            ...createEmptyProgress().globalStats,
            totalWordsLearned: 25,
          },
        };

        const result = checkAchievement('word-master-50', progress);
        expect(result.shouldUnlock).toBe(false);
        expect(result.currentProgress).toBe(50);
      });

      it('should unlock word-master-100 at 100 words', () => {
        const progress: UserProgress = {
          ...createEmptyProgress(),
          globalStats: {
            ...createEmptyProgress().globalStats,
            totalWordsLearned: 100,
          },
        };

        const result = checkAchievement('word-master-100', progress);
        expect(result.shouldUnlock).toBe(true);
      });

      it('should unlock word-master-200 at 200 words', () => {
        const progress: UserProgress = {
          ...createEmptyProgress(),
          globalStats: {
            ...createEmptyProgress().globalStats,
            totalWordsLearned: 200,
          },
        };

        const result = checkAchievement('word-master-200', progress);
        expect(result.shouldUnlock).toBe(true);
      });
    });

    describe('list-completionist', () => {
      it('should unlock when a list has 5 levels completed', () => {
        const progress: UserProgress = {
          ...createEmptyProgress(),
          listLevelProgress: {
            'list-a-level1': {
              listId: 'list-a',
              levelId: 'level1',
              wordProgress: {
                'word-1': {
                  state: 3,
                  hintsUsed: 0,
                  wrongAttempts: 0,
                  correctAttempts: 1,
                  lastAttemptDate: '',
                  firstAttemptDate: '',
                },
                'word-2': {
                  state: 3,
                  hintsUsed: 0,
                  wrongAttempts: 0,
                  correctAttempts: 1,
                  lastAttemptDate: '',
                  firstAttemptDate: '',
                },
              },
            },
            'list-a-level2': {
              listId: 'list-a',
              levelId: 'level2',
              wordProgress: {
                'word-3': {
                  state: 3,
                  hintsUsed: 0,
                  wrongAttempts: 0,
                  correctAttempts: 1,
                  lastAttemptDate: '',
                  firstAttemptDate: '',
                },
              },
            },
            'list-a-level3': {
              listId: 'list-a',
              levelId: 'level3',
              wordProgress: {
                'word-4': {
                  state: 3,
                  hintsUsed: 0,
                  wrongAttempts: 0,
                  correctAttempts: 1,
                  lastAttemptDate: '',
                  firstAttemptDate: '',
                },
              },
            },
            'list-a-level4': {
              listId: 'list-a',
              levelId: 'level4',
              wordProgress: {
                'word-5': {
                  state: 3,
                  hintsUsed: 0,
                  wrongAttempts: 0,
                  correctAttempts: 1,
                  lastAttemptDate: '',
                  firstAttemptDate: '',
                },
              },
            },
            'list-a-level5': {
              listId: 'list-a',
              levelId: 'level5',
              wordProgress: {
                'word-6': {
                  state: 3,
                  hintsUsed: 0,
                  wrongAttempts: 0,
                  correctAttempts: 1,
                  lastAttemptDate: '',
                  firstAttemptDate: '',
                },
              },
            },
          },
        };

        const result = checkAchievement('list-completionist', progress);
        expect(result.shouldUnlock).toBe(true);
      });

      it('should not unlock with incomplete levels', () => {
        const progress: UserProgress = {
          ...createEmptyProgress(),
          listLevelProgress: {
            'list-a-level1': {
              listId: 'list-a',
              levelId: 'level1',
              wordProgress: {
                'word-1': {
                  state: 3,
                  hintsUsed: 0,
                  wrongAttempts: 0,
                  correctAttempts: 1,
                  lastAttemptDate: '',
                  firstAttemptDate: '',
                },
                'word-2': {
                  state: 2,
                  hintsUsed: 0,
                  wrongAttempts: 0,
                  correctAttempts: 1,
                  lastAttemptDate: '',
                  firstAttemptDate: '',
                },
              },
            },
          },
        };

        const result = checkAchievement('list-completionist', progress);
        expect(result.shouldUnlock).toBe(false);
      });
    });

    describe('five-star-student', () => {
      it('should unlock when 5 lists are completed', () => {
        const progress: UserProgress = {
          ...createEmptyProgress(),
          globalStats: {
            ...createEmptyProgress().globalStats,
            listsCompleted: ['list-a', 'list-b', 'list-c', 'list-d', 'list-e'],
          },
        };

        const result = checkAchievement('five-star-student', progress);
        expect(result.shouldUnlock).toBe(true);
        expect(result.currentProgress).toBe(100);
      });

      it('should show progress towards 5 lists', () => {
        const progress: UserProgress = {
          ...createEmptyProgress(),
          globalStats: {
            ...createEmptyProgress().globalStats,
            listsCompleted: ['list-a', 'list-b'],
          },
        };

        const result = checkAchievement('five-star-student', progress);
        expect(result.shouldUnlock).toBe(false);
        expect(result.currentProgress).toBe(40); // 2/5 = 40%
      });
    });

    describe('no-hints-master', () => {
      it('should unlock after completing 10 levels without hints', () => {
        const progress: UserProgress = {
          ...createEmptyProgress(),
          listLevelProgress: Object.fromEntries(
            Array.from({ length: 10 }, (_, i) => [
              `list-${i}-level-${i}`,
              {
                listId: `list-${i}`,
                levelId: `level-${i}`,
                wordProgress: {},
                bestScore: { hints: 0, wrong: 1, completedAt: new Date().toISOString() },
              },
            ])
          ),
        };

        const result = checkAchievement('no-hints-master', progress);
        expect(result.shouldUnlock).toBe(true);
        expect(result.currentProgress).toBe(100);
      });

      it('should show progress towards 10 levels', () => {
        const progress: UserProgress = {
          ...createEmptyProgress(),
          listLevelProgress: Object.fromEntries(
            Array.from({ length: 5 }, (_, i) => [
              `list-${i}-level-${i}`,
              {
                listId: `list-${i}`,
                levelId: `level-${i}`,
                wordProgress: {},
                bestScore: { hints: 0, wrong: 1, completedAt: new Date().toISOString() },
              },
            ])
          ),
        };

        const result = checkAchievement('no-hints-master', progress);
        expect(result.shouldUnlock).toBe(false);
        expect(result.currentProgress).toBe(50); // 5/10 = 50%
      });
    });

    describe('consistent-learner', () => {
      it('should unlock after 7-day streak', () => {
        // Create dates for 7 consecutive days ending today
        const today = new Date();
        const dailyProgress: Record<string, number> = {};

        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          dailyProgress[toLocalDateString(date)] = 1;
        }

        const progress: UserProgress = {
          ...createEmptyProgress(),
          dailyProgress,
        };

        const result = checkAchievement('consistent-learner', progress);
        expect(result.shouldUnlock).toBe(true);
        expect(result.currentProgress).toBe(100);
      });

      it('should show progress for partial streak', () => {
        const today = new Date();
        const dailyProgress: Record<string, number> = {};

        // 3 consecutive days
        for (let i = 0; i < 3; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          dailyProgress[toLocalDateString(date)] = 1;
        }

        const progress: UserProgress = {
          ...createEmptyProgress(),
          dailyProgress,
        };

        const result = checkAchievement('consistent-learner', progress);
        expect(result.shouldUnlock).toBe(false);
        expect(result.currentProgress).toBeCloseTo(42.86, 1); // 3/7 = ~42.86%
      });

      it('should not unlock with broken streak', () => {
        const today = new Date();
        const dailyProgress: Record<string, number> = {};

        // Today
        dailyProgress[toLocalDateString(today)] = 1;

        // Skip a day, then add more
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        dailyProgress[toLocalDateString(threeDaysAgo)] = 1;

        const progress: UserProgress = {
          ...createEmptyProgress(),
          dailyProgress,
        };

        const result = checkAchievement('consistent-learner', progress);
        expect(result.shouldUnlock).toBe(false);
      });

      it('should return 0 for no daily progress', () => {
        const progress = createEmptyProgress();
        const result = checkAchievement('consistent-learner', progress);

        expect(result.shouldUnlock).toBe(false);
        expect(result.currentProgress).toBe(0);
      });
    });
  });

  describe('calculateCurrentStreak', () => {
    it('returns 0 for undefined dailyProgress', () => {
      const streak = calculateCurrentStreak(undefined);
      expect(streak).toBe(0);
    });

    it('returns 0 for empty dailyProgress', () => {
      const streak = calculateCurrentStreak({});
      expect(streak).toBe(0);
    });

    it('returns 0 if only days with 0 words learned', () => {
      const today = toLocalDateString(new Date());
      const streak = calculateCurrentStreak({ [today]: 0 });
      expect(streak).toBe(0);
    });

    it('returns 1 for activity today only', () => {
      const today = toLocalDateString(new Date());
      const streak = calculateCurrentStreak({ [today]: 5 });
      expect(streak).toBe(1);
    });

    it('returns 1 for activity yesterday only', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const streak = calculateCurrentStreak({ [toLocalDateString(yesterday)]: 3 });
      expect(streak).toBe(1);
    });

    it('returns 0 if last activity was 2+ days ago', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const streak = calculateCurrentStreak({ [toLocalDateString(twoDaysAgo)]: 3 });
      expect(streak).toBe(0);
    });

    it('counts consecutive days correctly', () => {
      const today = new Date();
      const dailyProgress: Record<string, number> = {};

      // 5 consecutive days
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dailyProgress[toLocalDateString(date)] = i + 1;
      }

      const streak = calculateCurrentStreak(dailyProgress);
      expect(streak).toBe(5);
    });

    it('stops counting at gap in streak', () => {
      const today = new Date();
      const dailyProgress: Record<string, number> = {};

      // Today and yesterday
      dailyProgress[toLocalDateString(today)] = 1;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      dailyProgress[toLocalDateString(yesterday)] = 1;

      // Skip a day, then 3 more days
      for (let i = 3; i <= 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dailyProgress[toLocalDateString(date)] = 1;
      }

      const streak = calculateCurrentStreak(dailyProgress);
      expect(streak).toBe(2); // Only today and yesterday count
    });

    it('handles unsorted dates correctly', () => {
      const today = new Date();
      const dailyProgress: Record<string, number> = {};

      // Add dates in random order
      [0, 2, 1, 3].forEach(i => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dailyProgress[toLocalDateString(date)] = 1;
      });

      const streak = calculateCurrentStreak(dailyProgress);
      expect(streak).toBe(4);
    });
  });

  describe('checkAllAchievements', () => {
    it('should return newly unlocked achievements', () => {
      const progress: UserProgress = {
        ...createEmptyProgress(),
        listLevelProgress: {
          'list-a-basic': {
            listId: 'list-a',
            levelId: 'basic',
            wordProgress: {},
            bestScore: { hints: 0, wrong: 0, completedAt: new Date().toISOString() },
          },
        },
      };

      const currentAchievements: Achievement[] = [];
      const sessionData = {
        listId: 'list-a',
        levelId: 'basic',
        hints: 0,
        wrong: 0,
        durationMinutes: 4,
      };

      const newlyUnlocked = checkAllAchievements(progress, currentAchievements, sessionData);

      // Should unlock: first-steps, quick-learner, perfect-score
      expect(newlyUnlocked.length).toBeGreaterThanOrEqual(3);
      expect(newlyUnlocked.find((a) => a.id === 'first-steps')).toBeDefined();
      expect(newlyUnlocked.find((a) => a.id === 'quick-learner')).toBeDefined();
      expect(newlyUnlocked.find((a) => a.id === 'perfect-score')).toBeDefined();
    });

    it('should not return already unlocked achievements', () => {
      const progress: UserProgress = {
        ...createEmptyProgress(),
        listLevelProgress: {
          'list-a-basic': {
            listId: 'list-a',
            levelId: 'basic',
            wordProgress: {},
            bestScore: { hints: 0, wrong: 0, completedAt: new Date().toISOString() },
          },
        },
      };

      const currentAchievements: Achievement[] = [
        {
          ...ACHIEVEMENT_DEFINITIONS['first-steps'],
          isUnlocked: true,
          unlockedAt: new Date().toISOString(),
        },
      ];

      const sessionData = {
        listId: 'list-a',
        levelId: 'basic',
        hints: 0,
        wrong: 0,
        durationMinutes: 4,
      };

      const newlyUnlocked = checkAllAchievements(progress, currentAchievements, sessionData);

      // Should not include first-steps again
      expect(newlyUnlocked.find((a) => a.id === 'first-steps')).toBeUndefined();
    });

    it('should unlock achievement-hunter when all others are unlocked', () => {
      const allIds = Object.keys(ACHIEVEMENT_DEFINITIONS).filter(
        (id) => id !== 'achievement-hunter'
      );
      const currentAchievements: Achievement[] = allIds.map((id) => ({
        ...ACHIEVEMENT_DEFINITIONS[id as keyof typeof ACHIEVEMENT_DEFINITIONS],
        isUnlocked: true,
        unlockedAt: new Date().toISOString(),
      }));

      const progress = createEmptyProgress();
      const newlyUnlocked = checkAllAchievements(progress, currentAchievements);

      expect(newlyUnlocked.find((a) => a.id === 'achievement-hunter')).toBeDefined();
    });
  });

  describe('getAllAchievements', () => {
    it('should return all achievements with locked state', () => {
      const progress = createEmptyProgress();
      const unlockedAchievements: Achievement[] = [];

      const allAchievements = getAllAchievements(progress, unlockedAchievements);

      expect(allAchievements.length).toBe(Object.keys(ACHIEVEMENT_DEFINITIONS).length);
      expect(allAchievements.every((a) => !a.isUnlocked)).toBe(true);
    });

    it('should merge unlocked achievements', () => {
      const progress = createEmptyProgress();
      const unlockedAchievements: Achievement[] = [
        {
          ...ACHIEVEMENT_DEFINITIONS['first-steps'],
          isUnlocked: true,
          unlockedAt: new Date().toISOString(),
        },
      ];

      const allAchievements = getAllAchievements(progress, unlockedAchievements);

      const firstSteps = allAchievements.find((a) => a.id === 'first-steps');
      expect(firstSteps?.isUnlocked).toBe(true);
    });

    it('should include progress for progressive achievements', () => {
      const progress: UserProgress = {
        ...createEmptyProgress(),
        globalStats: {
          ...createEmptyProgress().globalStats,
          totalWordsLearned: 25,
        },
      };

      const allAchievements = getAllAchievements(progress, []);

      const wordMaster50 = allAchievements.find((a) => a.id === 'word-master-50');
      expect(wordMaster50?.progress).toBe(50); // 25/50 = 50%
    });
  });

  describe('getAchievementCompletionPercentage', () => {
    it('should calculate correct percentage', () => {
      const achievements: Achievement[] = [
        { ...ACHIEVEMENT_DEFINITIONS['first-steps'], isUnlocked: true },
        { ...ACHIEVEMENT_DEFINITIONS['quick-learner'], isUnlocked: false },
        { ...ACHIEVEMENT_DEFINITIONS['perfect-score'], isUnlocked: false },
        { ...ACHIEVEMENT_DEFINITIONS['word-master-50'], isUnlocked: true },
      ];

      const percentage = getAchievementCompletionPercentage(achievements);
      expect(percentage).toBe(50); // 2 out of 4 = 50%
    });

    it('should return 0 for no achievements', () => {
      const percentage = getAchievementCompletionPercentage([]);
      expect(percentage).toBe(0);
    });

    it('should return 100 for all unlocked', () => {
      const achievements: Achievement[] = [
        { ...ACHIEVEMENT_DEFINITIONS['first-steps'], isUnlocked: true },
        { ...ACHIEVEMENT_DEFINITIONS['quick-learner'], isUnlocked: true },
      ];

      const percentage = getAchievementCompletionPercentage(achievements);
      expect(percentage).toBe(100);
    });
  });
});
