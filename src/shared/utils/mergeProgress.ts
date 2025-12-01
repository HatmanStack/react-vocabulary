/**
 * Merge Progress Utilities
 *
 * Pure functions for merging local and cloud progress data using "higher wins" strategy.
 * These functions never mutate their inputs.
 */

import type {
  UserProgress,
  WordProgress,
  ListLevelProgress,
  Achievement,
  WordState,
} from '@/shared/types';

/**
 * Merge two WordProgress objects using "higher wins" strategy
 */
export function mergeWordProgress(
  local: WordProgress,
  cloud: WordProgress
): WordProgress {
  return {
    state: Math.max(local.state, cloud.state) as WordState,
    hintsUsed: Math.max(local.hintsUsed, cloud.hintsUsed),
    wrongAttempts: Math.max(local.wrongAttempts, cloud.wrongAttempts),
    correctAttempts: Math.max(local.correctAttempts, cloud.correctAttempts),
    lastAttemptDate:
      local.lastAttemptDate > cloud.lastAttemptDate
        ? local.lastAttemptDate
        : cloud.lastAttemptDate,
    firstAttemptDate:
      local.firstAttemptDate < cloud.firstAttemptDate
        ? local.firstAttemptDate
        : cloud.firstAttemptDate,
    masteredDate: mergeMasteredDate(local.masteredDate, cloud.masteredDate),
  };
}

/**
 * Merge masteredDate - take earliest if both exist, otherwise take the one that exists
 */
function mergeMasteredDate(
  local?: string,
  cloud?: string
): string | undefined {
  if (!local && !cloud) return undefined;
  if (!local) return cloud;
  if (!cloud) return local;
  return local < cloud ? local : cloud;
}

/**
 * Merge two ListLevelProgress objects
 */
export function mergeListLevelProgress(
  local: ListLevelProgress,
  cloud: ListLevelProgress
): ListLevelProgress {
  // Merge wordProgress
  const mergedWordProgress: Record<string, WordProgress> = {};

  // Get all unique word IDs from both
  const allWordIds = new Set([
    ...Object.keys(local.wordProgress),
    ...Object.keys(cloud.wordProgress),
  ]);

  for (const wordId of allWordIds) {
    const localWord = local.wordProgress[wordId];
    const cloudWord = cloud.wordProgress[wordId];

    if (localWord && cloudWord) {
      mergedWordProgress[wordId] = mergeWordProgress(localWord, cloudWord);
    } else {
      mergedWordProgress[wordId] = localWord || cloudWord;
    }
  }

  // Merge bestScore - take the better one
  const mergedBestScore = mergeBestScore(local.bestScore, cloud.bestScore);

  return {
    listId: local.listId,
    levelId: local.levelId,
    wordProgress: mergedWordProgress,
    bestScore: mergedBestScore,
  };
}

/**
 * Merge bestScore - better = fewer hints, or equal hints and fewer wrong
 */
function mergeBestScore(
  local?: { hints: number; wrong: number; completedAt: string },
  cloud?: { hints: number; wrong: number; completedAt: string }
): { hints: number; wrong: number; completedAt: string } | undefined {
  if (!local && !cloud) return undefined;
  if (!local) return cloud;
  if (!cloud) return local;

  // Better = fewer hints, or equal hints and fewer wrong
  if (local.hints < cloud.hints) return local;
  if (cloud.hints < local.hints) return cloud;
  // Equal hints, compare wrong
  if (local.wrong < cloud.wrong) return local;
  if (cloud.wrong < local.wrong) return cloud;
  // Equal, take most recent
  return local.completedAt > cloud.completedAt ? local : cloud;
}

/**
 * Merge achievements arrays using union by id, preferring unlocked versions
 */
export function mergeAchievements(
  local: Achievement[],
  cloud: Achievement[]
): Achievement[] {
  if (local.length === 0 && cloud.length === 0) return [];

  const achievementMap = new Map<string, Achievement>();

  // Add all local achievements
  for (const ach of local) {
    achievementMap.set(ach.id, { ...ach });
  }

  // Merge cloud achievements
  for (const cloudAch of cloud) {
    const existing = achievementMap.get(cloudAch.id);

    if (!existing) {
      achievementMap.set(cloudAch.id, { ...cloudAch });
    } else {
      // Merge the two versions
      achievementMap.set(cloudAch.id, mergeAchievement(existing, cloudAch));
    }
  }

  return Array.from(achievementMap.values());
}

/**
 * Merge two achievements with the same ID
 */
function mergeAchievement(local: Achievement, cloud: Achievement): Achievement {
  // If one is unlocked and the other isn't, prefer the unlocked one
  if (local.isUnlocked && !cloud.isUnlocked) return { ...local };
  if (cloud.isUnlocked && !local.isUnlocked) return { ...cloud };

  // Both unlocked - take earliest unlockedAt
  if (local.isUnlocked && cloud.isUnlocked) {
    const localDate = local.unlockedAt || '';
    const cloudDate = cloud.unlockedAt || '';
    const earliestUnlockedAt = localDate < cloudDate ? localDate : cloudDate;

    return {
      ...local,
      unlockedAt: earliestUnlockedAt || local.unlockedAt || cloud.unlockedAt,
      progress: Math.max(local.progress ?? 0, cloud.progress ?? 0),
    };
  }

  // Neither unlocked - take higher progress
  return {
    ...local,
    progress: Math.max(local.progress ?? 0, cloud.progress ?? 0),
  };
}

/**
 * Merge two complete UserProgress objects
 */
export function mergeProgress(
  local: UserProgress,
  cloud: UserProgress
): UserProgress {
  // Merge listLevelProgress
  const mergedListLevelProgress: Record<string, ListLevelProgress> = {};

  const allKeys = new Set([
    ...Object.keys(local.listLevelProgress),
    ...Object.keys(cloud.listLevelProgress),
  ]);

  for (const key of allKeys) {
    const localLevel = local.listLevelProgress[key];
    const cloudLevel = cloud.listLevelProgress[key];

    if (localLevel && cloudLevel) {
      mergedListLevelProgress[key] = mergeListLevelProgress(localLevel, cloudLevel);
    } else {
      mergedListLevelProgress[key] = localLevel || cloudLevel;
    }
  }

  // Merge globalStats
  const mergedGlobalStats = {
    allTimeHints: Math.max(
      local.globalStats.allTimeHints,
      cloud.globalStats.allTimeHints
    ),
    allTimeWrong: Math.max(
      local.globalStats.allTimeWrong,
      cloud.globalStats.allTimeWrong
    ),
    allTimeCorrect: Math.max(
      local.globalStats.allTimeCorrect,
      cloud.globalStats.allTimeCorrect
    ),
    totalWordsLearned: Math.max(
      local.globalStats.totalWordsLearned,
      cloud.globalStats.totalWordsLearned
    ),
    listsCompleted: [
      ...new Set([
        ...local.globalStats.listsCompleted,
        ...cloud.globalStats.listsCompleted,
      ]),
    ],
  };

  // Merge achievements
  const mergedAchievements = mergeAchievements(
    local.achievements ?? [],
    cloud.achievements ?? []
  );

  // Merge dailyProgress
  const mergedDailyProgress: Record<string, number> = {};
  const allDates = new Set([
    ...Object.keys(local.dailyProgress ?? {}),
    ...Object.keys(cloud.dailyProgress ?? {}),
  ]);

  for (const date of allDates) {
    const localCount = local.dailyProgress?.[date] ?? 0;
    const cloudCount = cloud.dailyProgress?.[date] ?? 0;
    mergedDailyProgress[date] = Math.max(localCount, cloudCount);
  }

  return {
    // Keep local's current position (user's active state)
    currentListId: local.currentListId,
    currentLevelId: local.currentLevelId,
    listLevelProgress: mergedListLevelProgress,
    globalStats: mergedGlobalStats,
    achievements: mergedAchievements.length > 0 ? mergedAchievements : undefined,
    dailyProgress:
      Object.keys(mergedDailyProgress).length > 0 ? mergedDailyProgress : undefined,
  };
}
