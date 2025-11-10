/**
 * Achievement System
 *
 * Defines all achievements and logic for checking/unlocking them.
 */

import { UserProgress, ListLevelProgress } from '@/shared/types';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon name from Material Icons or emoji
  category: 'milestone' | 'performance' | 'consistency' | 'completion';
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number; // For progressive achievements (0-100)
  target?: number; // Target value for progressive achievements
}

export type AchievementId =
  | 'first-steps'
  | 'quick-learner'
  | 'perfect-score'
  | 'consistent-learner'
  | 'word-master-50'
  | 'word-master-100'
  | 'word-master-200'
  | 'list-completionist'
  | 'five-star-student'
  | 'no-hints-master'
  | 'achievement-hunter';

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS: Record<
  AchievementId,
  Omit<Achievement, 'isUnlocked' | 'unlockedAt' | 'progress'>
> = {
  'first-steps': {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first quiz',
    icon: '🎯',
    category: 'milestone',
  },
  'quick-learner': {
    id: 'quick-learner',
    name: 'Quick Learner',
    description: 'Complete a level in under 5 minutes',
    icon: '⚡',
    category: 'performance',
  },
  'perfect-score': {
    id: 'perfect-score',
    name: 'Perfect Score',
    description: 'Complete a level with 0 hints and 0 wrong answers',
    icon: '⭐',
    category: 'performance',
  },
  'consistent-learner': {
    id: 'consistent-learner',
    name: 'Consistent Learner',
    description: 'Learn for 7 days in a row',
    icon: '🔥',
    category: 'consistency',
  },
  'word-master-50': {
    id: 'word-master-50',
    name: 'Word Master',
    description: 'Learn 50 words',
    icon: '📚',
    category: 'milestone',
    target: 50,
  },
  'word-master-100': {
    id: 'word-master-100',
    name: 'Vocabulary Expert',
    description: 'Learn 100 words',
    icon: '🎓',
    category: 'milestone',
    target: 100,
  },
  'word-master-200': {
    id: 'word-master-200',
    name: 'Language Master',
    description: 'Learn 200 words',
    icon: '👑',
    category: 'milestone',
    target: 200,
  },
  'list-completionist': {
    id: 'list-completionist',
    name: 'List Completionist',
    description: 'Complete all 5 levels in one list',
    icon: '✅',
    category: 'completion',
  },
  'five-star-student': {
    id: 'five-star-student',
    name: 'Five Star Student',
    description: 'Complete 5 different lists',
    icon: '🌟',
    category: 'completion',
    target: 5,
  },
  'no-hints-master': {
    id: 'no-hints-master',
    name: 'No Hints Master',
    description: 'Complete 10 levels without using any hints',
    icon: '🧠',
    category: 'performance',
    target: 10,
  },
  'achievement-hunter': {
    id: 'achievement-hunter',
    name: 'Achievement Hunter',
    description: 'Unlock all other achievements',
    icon: '🏆',
    category: 'completion',
  },
};

/**
 * Check if a specific achievement should be unlocked
 */
export function checkAchievement(
  achievementId: AchievementId,
  progress: UserProgress,
  sessionData?: {
    listId: string;
    levelId: string;
    hints: number;
    wrong: number;
    durationMinutes: number;
  }
): { shouldUnlock: boolean; currentProgress?: number } {
  switch (achievementId) {
    case 'first-steps': {
      // Check if user has completed any level
      const hasCompletedAnyLevel = Object.values(progress.listLevelProgress).some(
        (llp) => llp.bestScore !== undefined
      );
      return { shouldUnlock: hasCompletedAnyLevel };
    }

    case 'quick-learner': {
      // Check if session completed in under 5 minutes
      if (!sessionData) return { shouldUnlock: false };
      return { shouldUnlock: sessionData.durationMinutes < 5 };
    }

    case 'perfect-score': {
      // Check if session had 0 hints and 0 wrong
      if (!sessionData) return { shouldUnlock: false };
      return { shouldUnlock: sessionData.hints === 0 && sessionData.wrong === 0 };
    }

    case 'consistent-learner': {
      // Check 7-day streak (simplified - would need daily activity tracking)
      // For now, return false - will be implemented with activity tracking
      return { shouldUnlock: false, currentProgress: 0 };
    }

    case 'word-master-50': {
      const totalLearned = progress.globalStats.totalWordsLearned;
      return {
        shouldUnlock: totalLearned >= 50,
        currentProgress: Math.min((totalLearned / 50) * 100, 100),
      };
    }

    case 'word-master-100': {
      const totalLearned = progress.globalStats.totalWordsLearned;
      return {
        shouldUnlock: totalLearned >= 100,
        currentProgress: Math.min((totalLearned / 100) * 100, 100),
      };
    }

    case 'word-master-200': {
      const totalLearned = progress.globalStats.totalWordsLearned;
      return {
        shouldUnlock: totalLearned >= 200,
        currentProgress: Math.min((totalLearned / 200) * 100, 100),
      };
    }

    case 'list-completionist': {
      // Check if any list has all 5 levels completed
      const listCompletionMap: Record<string, number> = {};

      Object.values(progress.listLevelProgress).forEach((llp) => {
        // Check if level is 100% complete (all words mastered)
        const totalWords = Object.keys(llp.wordProgress).length;
        const masteredWords = Object.values(llp.wordProgress).filter((wp) => wp.state === 3).length;

        if (totalWords > 0 && masteredWords === totalWords) {
          listCompletionMap[llp.listId] = (listCompletionMap[llp.listId] || 0) + 1;
        }
      });

      const hasCompletedList = Object.values(listCompletionMap).some((count) => count >= 5);
      return { shouldUnlock: hasCompletedList };
    }

    case 'five-star-student': {
      const completedLists = progress.globalStats.listsCompleted.length;
      return {
        shouldUnlock: completedLists >= 5,
        currentProgress: Math.min((completedLists / 5) * 100, 100),
      };
    }

    case 'no-hints-master': {
      // Count levels completed with 0 hints
      const levelsWithoutHints = Object.values(progress.listLevelProgress).filter(
        (llp) => llp.bestScore && llp.bestScore.hints === 0
      ).length;

      return {
        shouldUnlock: levelsWithoutHints >= 10,
        currentProgress: Math.min((levelsWithoutHints / 10) * 100, 100),
      };
    }

    case 'achievement-hunter': {
      // This will be checked separately after all other achievements
      return { shouldUnlock: false };
    }

    default:
      return { shouldUnlock: false };
  }
}

/**
 * Check all achievements and return newly unlocked ones
 */
export function checkAllAchievements(
  progress: UserProgress,
  currentAchievements: Achievement[],
  sessionData?: {
    listId: string;
    levelId: string;
    hints: number;
    wrong: number;
    durationMinutes: number;
  }
): Achievement[] {
  const newlyUnlocked: Achievement[] = [];
  const now = new Date().toISOString();

  // Get all achievement IDs
  const achievementIds = Object.keys(ACHIEVEMENT_DEFINITIONS) as AchievementId[];

  // Check each achievement (except achievement-hunter)
  achievementIds.forEach((id) => {
    if (id === 'achievement-hunter') return; // Will check this last

    // Check if already unlocked
    const existing = currentAchievements.find((a) => a.id === id);
    if (existing?.isUnlocked) return;

    // Check if should unlock
    const { shouldUnlock, currentProgress } = checkAchievement(id, progress, sessionData);

    if (shouldUnlock) {
      newlyUnlocked.push({
        ...ACHIEVEMENT_DEFINITIONS[id],
        isUnlocked: true,
        unlockedAt: now,
        progress: 100,
      });
    }
  });

  // Check achievement-hunter (unlock if all others are unlocked)
  const totalAchievements = achievementIds.length - 1; // Exclude achievement-hunter itself
  const unlockedCount =
    currentAchievements.filter((a) => a.isUnlocked && a.id !== 'achievement-hunter').length +
    newlyUnlocked.filter((a) => a.id !== 'achievement-hunter').length;

  const achievementHunter = currentAchievements.find((a) => a.id === 'achievement-hunter');
  if (unlockedCount === totalAchievements && !achievementHunter?.isUnlocked) {
    newlyUnlocked.push({
      ...ACHIEVEMENT_DEFINITIONS['achievement-hunter'],
      isUnlocked: true,
      unlockedAt: now,
      progress: 100,
    });
  }

  return newlyUnlocked;
}

/**
 * Get all achievements with their current state
 */
export function getAllAchievements(
  progress: UserProgress,
  unlockedAchievements: Achievement[]
): Achievement[] {
  const achievementIds = Object.keys(ACHIEVEMENT_DEFINITIONS) as AchievementId[];

  return achievementIds.map((id) => {
    // Check if already unlocked
    const unlocked = unlockedAchievements.find((a) => a.id === id);
    if (unlocked) return unlocked;

    // Get current progress for locked achievements
    const { currentProgress } = checkAchievement(id, progress);

    return {
      ...ACHIEVEMENT_DEFINITIONS[id],
      isUnlocked: false,
      progress: currentProgress,
    };
  });
}

/**
 * Calculate overall achievement completion percentage
 */
export function getAchievementCompletionPercentage(achievements: Achievement[]): number {
  const total = achievements.length;
  const unlocked = achievements.filter((a) => a.isUnlocked).length;
  return total > 0 ? (unlocked / total) * 100 : 0;
}
