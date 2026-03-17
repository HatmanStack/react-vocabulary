/**
 * Schema Validation Tests
 *
 * Tests for runtime validation of JSON.parse deserialization.
 */

import { isValidProgressData, isValidSettingsData, isValidProgressExportData } from '../validateState';

describe('isValidProgressData', () => {
  it('accepts valid progress data', () => {
    expect(
      isValidProgressData({
        listLevelProgress: {},
        globalStats: { allTimeHints: 0 },
      })
    ).toBe(true);
  });

  it('accepts empty object (partial data)', () => {
    expect(isValidProgressData({})).toBe(true);
  });

  it('rejects null', () => {
    expect(isValidProgressData(null)).toBe(false);
  });

  it('rejects non-object', () => {
    expect(isValidProgressData('string')).toBe(false);
    expect(isValidProgressData(42)).toBe(false);
    expect(isValidProgressData(undefined)).toBe(false);
  });

  it('rejects invalid listLevelProgress', () => {
    expect(isValidProgressData({ listLevelProgress: 'invalid' })).toBe(false);
  });

  it('rejects invalid globalStats', () => {
    expect(isValidProgressData({ globalStats: 'invalid' })).toBe(false);
  });

  it('accepts data with extra fields', () => {
    expect(isValidProgressData({ extraField: 'ok', listLevelProgress: {} })).toBe(true);
  });
});

describe('isValidSettingsData', () => {
  it('accepts valid settings data', () => {
    expect(
      isValidSettingsData({
        theme: 'dark',
        soundEnabled: true,
        hapticsEnabled: false,
        onboardingCompleted: true,
      })
    ).toBe(true);
  });

  it('accepts empty object', () => {
    expect(isValidSettingsData({})).toBe(true);
  });

  it('rejects null', () => {
    expect(isValidSettingsData(null)).toBe(false);
  });

  it('rejects invalid theme', () => {
    expect(isValidSettingsData({ theme: 'invalid-theme' })).toBe(false);
  });

  it('rejects non-boolean soundEnabled', () => {
    expect(isValidSettingsData({ soundEnabled: 'yes' })).toBe(false);
  });

  it('rejects non-boolean hapticsEnabled', () => {
    expect(isValidSettingsData({ hapticsEnabled: 1 })).toBe(false);
  });

  it('accepts all valid themes', () => {
    expect(isValidSettingsData({ theme: 'light' })).toBe(true);
    expect(isValidSettingsData({ theme: 'dark' })).toBe(true);
    expect(isValidSettingsData({ theme: 'auto' })).toBe(true);
  });
});

describe('isValidProgressExportData', () => {
  it('accepts valid export data', () => {
    expect(
      isValidProgressExportData({
        version: '1.0.0',
        exportDate: '2024-01-01',
        data: {
          listLevelProgress: {},
          globalStats: {},
        },
      })
    ).toBe(true);
  });

  it('rejects missing version', () => {
    expect(isValidProgressExportData({ data: {} })).toBe(false);
  });

  it('rejects missing data', () => {
    expect(isValidProgressExportData({ version: '1.0.0' })).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidProgressExportData(null)).toBe(false);
  });

  it('rejects non-object data field', () => {
    expect(isValidProgressExportData({ version: '1.0.0', data: 'string' })).toBe(false);
  });

  it('rejects invalid listLevelProgress in data', () => {
    expect(
      isValidProgressExportData({
        version: '1.0.0',
        data: { listLevelProgress: 'invalid' },
      })
    ).toBe(false);
  });
});
