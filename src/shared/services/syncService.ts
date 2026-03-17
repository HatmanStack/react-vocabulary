/**
 * Sync Service
 *
 * API client for communicating with the backend sync endpoint.
 * Handles progress synchronization between local storage and cloud.
 */

import type { UserProgress } from '@/shared/types';
import NetInfo from '@react-native-community/netinfo';

// API URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_SYNC_API_URL;

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Custom error class for sync-related errors
 */
export class SyncError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'SyncError';
    this.code = code;
  }
}

/**
 * Check if the API is configured
 */
export function isApiConfigured(): boolean {
  return Boolean(API_URL);
}

/**
 * Check if the device is online
 */
async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  } catch {
    // Assume online if we can't check
    return true;
  }
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make a single request to the sync API with timeout handling.
 *
 * ARCHITECTURAL DECISION: Requests are identified by username only — no auth
 * tokens or sessions. This is intentional to keep sync frictionless for a
 * vocabulary learning app. Privacy relies on username uniqueness, not authentication.
 */
async function makeSingleRequest<T>(body: Record<string, unknown>): Promise<T> {
  if (!API_URL) {
    throw new SyncError('Sync API not configured', 'NOT_CONFIGURED');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      // 404 is handled specially by callers
      if (response.status === 404) {
        throw new SyncError(data.error || 'Not found', 'USER_NOT_FOUND');
      }
      throw new SyncError(
        data.error || 'Request failed',
        data.code || `HTTP_${response.status}`
      );
    }

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof SyncError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new SyncError('Request timeout', 'TIMEOUT');
      }
      throw new SyncError(
        error.message || 'Network request failed',
        'NETWORK_ERROR'
      );
    }

    throw new SyncError('Unknown error occurred', 'UNKNOWN');
  }
}

/**
 * Make a request with retry logic for transient failures
 */
async function makeRequest<T>(body: Record<string, unknown>): Promise<T> {
  // Check if online before attempting request
  const online = await isOnline();
  if (!online) {
    throw new SyncError('No internet connection', 'OFFLINE');
  }

  let lastError: SyncError | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await makeSingleRequest<T>(body);
    } catch (error) {
      if (error instanceof SyncError) {
        lastError = error;

        // Don't retry for non-transient errors
        if (
          error.code === 'NOT_CONFIGURED' ||
          error.code === 'USER_NOT_FOUND' ||
          error.code.startsWith('HTTP_4') // 4xx client errors
        ) {
          throw error;
        }

        // Retry for transient errors (network, timeout, 5xx)
        if (attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAY_MS * (attempt + 1)); // Exponential backoff
          continue;
        }
      }
      throw error;
    }
  }

  throw lastError || new SyncError('Max retries exceeded', 'MAX_RETRIES');
}

/**
 * Check if a username exists in the system
 */
export async function checkUsername(
  username: string
): Promise<{ exists: boolean }> {
  if (!API_URL) {
    console.warn('Sync API not configured, returning exists: false');
    return { exists: false };
  }

  return makeRequest<{ exists: boolean }>({
    action: 'check-username',
    username,
  });
}

/**
 * Validate that progress data has the expected structure
 */
function validateProgressData(data: unknown): data is UserProgress {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const progress = data as Record<string, unknown>;

  // Check required fields
  if (typeof progress.listLevelProgress !== 'object' || progress.listLevelProgress === null) {
    return false;
  }

  if (typeof progress.globalStats !== 'object' || progress.globalStats === null) {
    return false;
  }

  const stats = progress.globalStats as Record<string, unknown>;
  if (
    typeof stats.allTimeHints !== 'number' ||
    typeof stats.allTimeWrong !== 'number' ||
    typeof stats.allTimeCorrect !== 'number' ||
    typeof stats.totalWordsLearned !== 'number'
  ) {
    return false;
  }

  return true;
}

/**
 * Get progress data for a user
 * Returns null if user doesn't exist (404)
 */
export async function getProgress(
  username: string
): Promise<{ progressData: UserProgress; lastSyncedAt: string } | null> {
  if (!API_URL) {
    console.warn('Sync API not configured, returning null');
    return null;
  }

  try {
    const result = await makeRequest<{
      progressData: UserProgress;
      lastSyncedAt: string;
    }>({
      action: 'get',
      username,
    });

    // Validate the response data
    if (!validateProgressData(result.progressData)) {
      throw new SyncError('Invalid progress data received from server', 'INVALID_DATA');
    }

    return result;
  } catch (error) {
    if (error instanceof SyncError && error.code === 'USER_NOT_FOUND') {
      return null;
    }
    throw error;
  }
}

/**
 * Save progress data for a user
 */
export async function saveProgress(
  username: string,
  progressData: UserProgress
): Promise<{ success: boolean; lastSyncedAt: string }> {
  if (!API_URL) {
    console.warn('Sync API not configured, save skipped');
    return { success: false, lastSyncedAt: '' };
  }

  return makeRequest<{ success: boolean; lastSyncedAt: string }>({
    action: 'save',
    username,
    progressData,
  });
}
