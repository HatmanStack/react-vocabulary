/**
 * Sync Service
 *
 * API client for communicating with the backend sync endpoint.
 * Handles progress synchronization between local storage and cloud.
 */

import type { UserProgress } from '@/shared/types';

// API URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_SYNC_API_URL;

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

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
 * Make a request to the sync API with timeout handling
 */
async function makeRequest<T>(body: Record<string, unknown>): Promise<T> {
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
    return await makeRequest<{
      progressData: UserProgress;
      lastSyncedAt: string;
    }>({
      action: 'get',
      username,
    });
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
