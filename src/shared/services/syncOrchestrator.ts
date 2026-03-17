/**
 * Sync Orchestrator
 *
 * Extracted from progressStore to reduce god object complexity.
 * Handles cloud sync orchestration: push, pull, merge logic.
 * The progressStore delegates to these functions and applies
 * the resulting state updates via set().
 */

import { UserProgress } from '@/shared/types';
import {
  checkUsername as apiCheckUsername,
  getProgress as apiGetProgress,
  saveProgress as apiSaveProgress,
  isApiConfigured,
  SyncError,
} from '@/shared/services/syncService';
import { mergeProgress } from '@/shared/utils/mergeProgress';
import type { SyncStatus } from '@/shared/store/progressStore';

/** Fields extracted from progressStore state for sync operations */
export interface SyncableState {
  username: string | null;
  syncStatus: SyncStatus;
  currentListId?: string;
  currentLevelId?: string;
  listLevelProgress: UserProgress['listLevelProgress'];
  globalStats: UserProgress['globalStats'];
  achievements?: UserProgress['achievements'];
  dailyProgress?: UserProgress['dailyProgress'];
}

/** State update to be applied by the store after a sync operation */
export type SyncStateUpdate = Partial<{
  syncStatus: SyncStatus;
  lastSyncError: string | null;
  lastCloudSyncAt: string | null;
  currentListId: string | undefined;
  currentLevelId: string | undefined;
  listLevelProgress: UserProgress['listLevelProgress'];
  globalStats: UserProgress['globalStats'];
  achievements: UserProgress['achievements'];
  dailyProgress: UserProgress['dailyProgress'];
}>;

function extractUserProgress(state: SyncableState): UserProgress {
  return {
    currentListId: state.currentListId,
    currentLevelId: state.currentLevelId,
    listLevelProgress: state.listLevelProgress,
    globalStats: state.globalStats,
    achievements: state.achievements,
    dailyProgress: state.dailyProgress,
  };
}

/**
 * Check if a username exists in the cloud.
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
  if (!isApiConfigured()) {
    return false;
  }
  try {
    const result = await apiCheckUsername(username);
    return result.exists;
  } catch (error) {
    console.error('Failed to check username:', error);
    return false;
  }
}

/**
 * Push current progress to cloud.
 * Returns state updates for the store to apply.
 */
export async function syncToCloud(
  state: SyncableState
): Promise<{ updates: SyncStateUpdate; scheduleIdleReset: boolean }> {
  if (!state.username || !isApiConfigured()) {
    return { updates: {}, scheduleIdleReset: false };
  }

  if (state.syncStatus === 'syncing') {
    return { updates: {}, scheduleIdleReset: false };
  }

  try {
    const progressData = extractUserProgress(state);
    const result = await apiSaveProgress(state.username, progressData);

    if (result.success) {
      return {
        updates: {
          syncStatus: 'success',
          lastCloudSyncAt: result.lastSyncedAt,
        },
        scheduleIdleReset: true,
      };
    } else {
      return {
        updates: {
          syncStatus: 'error',
          lastSyncError: 'Failed to save progress',
        },
        scheduleIdleReset: false,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof SyncError ? error.message : 'Failed to sync to cloud';
    return {
      updates: {
        syncStatus: 'error',
        lastSyncError: errorMessage,
      },
      scheduleIdleReset: false,
    };
  }
}

/**
 * Pull progress from cloud and merge with local.
 * Returns state updates for the store to apply.
 */
export async function syncFromCloud(
  state: SyncableState
): Promise<{ updates: SyncStateUpdate; scheduleIdleReset: boolean }> {
  if (!state.username || !isApiConfigured()) {
    return { updates: {}, scheduleIdleReset: false };
  }

  if (state.syncStatus === 'syncing') {
    return { updates: {}, scheduleIdleReset: false };
  }

  try {
    const cloudData = await apiGetProgress(state.username);

    if (cloudData) {
      const localProgress = extractUserProgress(state);
      const mergedProgress = mergeProgress(localProgress, cloudData.progressData);

      return {
        updates: {
          currentListId: mergedProgress.currentListId,
          currentLevelId: mergedProgress.currentLevelId,
          listLevelProgress: mergedProgress.listLevelProgress,
          globalStats: mergedProgress.globalStats,
          achievements: mergedProgress.achievements,
          dailyProgress: mergedProgress.dailyProgress,
          syncStatus: 'success',
          lastCloudSyncAt: cloudData.lastSyncedAt,
        },
        scheduleIdleReset: true,
      };
    } else {
      return {
        updates: { syncStatus: 'success' },
        scheduleIdleReset: true,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof SyncError ? error.message : 'Failed to sync from cloud';
    return {
      updates: {
        syncStatus: 'error',
        lastSyncError: errorMessage,
      },
      scheduleIdleReset: false,
    };
  }
}
