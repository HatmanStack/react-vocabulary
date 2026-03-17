/**
 * Runtime validation helpers for JSON.parse deserialization.
 * Prevents corrupted storage from crashing the app.
 */

import { UserProgress } from '@/shared/types';
import { ThemeMode } from '@/shared/store/settingsStore';

/**
 * Validates that parsed data has the expected shape for progress data.
 * Returns true if the data can safely be spread into progress store state.
 */
export function isValidProgressData(data: unknown): data is Partial<UserProgress> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  const d = data as Record<string, unknown>;
  if (d.listLevelProgress !== undefined &&
      (typeof d.listLevelProgress !== 'object' || d.listLevelProgress === null || Array.isArray(d.listLevelProgress))) return false;
  if (d.globalStats !== undefined &&
      (typeof d.globalStats !== 'object' || d.globalStats === null || Array.isArray(d.globalStats))) return false;
  return true;
}

const VALID_THEMES: ThemeMode[] = ['light', 'dark', 'auto'];

/**
 * Validates that parsed data has the expected shape for settings data.
 */
export function isValidSettingsData(
  data: unknown
): data is { theme?: ThemeMode; soundEnabled?: boolean; hapticsEnabled?: boolean; onboardingCompleted?: boolean } {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  const d = data as Record<string, unknown>;
  if (d.theme !== undefined && !VALID_THEMES.includes(d.theme as ThemeMode)) return false;
  if (d.soundEnabled !== undefined && typeof d.soundEnabled !== 'boolean') return false;
  if (d.hapticsEnabled !== undefined && typeof d.hapticsEnabled !== 'boolean') return false;
  if (d.onboardingCompleted !== undefined && typeof d.onboardingCompleted !== 'boolean') return false;
  return true;
}

/**
 * Validates that imported progress export data has the required structure.
 */
export function isValidProgressExportData(data: unknown): boolean {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  const d = data as Record<string, unknown>;
  if (typeof d.version !== 'string') return false;
  if (typeof d.data !== 'object' || d.data === null || Array.isArray(d.data)) return false;
  const inner = d.data as Record<string, unknown>;
  if (inner.listLevelProgress !== undefined &&
      (typeof inner.listLevelProgress !== 'object' || inner.listLevelProgress === null || Array.isArray(inner.listLevelProgress))) return false;
  if (inner.globalStats !== undefined &&
      (typeof inner.globalStats !== 'object' || inner.globalStats === null || Array.isArray(inner.globalStats))) return false;
  return true;
}
