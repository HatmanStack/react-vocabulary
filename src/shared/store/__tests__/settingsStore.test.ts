/**
 * Settings Store Tests
 *
 * Tests for theme and settings persistence.
 */

import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore } from '../settingsStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('SettingsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to initial state
    const { result } = renderHook(() => useSettingsStore());
    act(() => {
      result.current.resetSettings();
    });
  });

  describe('Theme Settings', () => {
    it('initializes with light theme by default', () => {
      const { result } = renderHook(() => useSettingsStore());
      expect(result.current.theme).toBe('light');
    });

    it('allows changing to dark theme', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('allows changing to auto theme', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setTheme('auto');
      });

      expect(result.current.theme).toBe('auto');
    });
  });

  describe('Sound Settings', () => {
    it('initializes with sound enabled by default', () => {
      const { result } = renderHook(() => useSettingsStore());
      expect(result.current.soundEnabled).toBe(true);
    });

    it('allows toggling sound', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setSoundEnabled(false);
      });

      expect(result.current.soundEnabled).toBe(false);

      act(() => {
        result.current.setSoundEnabled(true);
      });

      expect(result.current.soundEnabled).toBe(true);
    });
  });

  describe('Haptics Settings', () => {
    it('initializes with haptics enabled by default', () => {
      const { result } = renderHook(() => useSettingsStore());
      expect(result.current.hapticsEnabled).toBe(true);
    });

    it('allows toggling haptics', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setHapticsEnabled(false);
      });

      expect(result.current.hapticsEnabled).toBe(false);

      act(() => {
        result.current.setHapticsEnabled(true);
      });

      expect(result.current.hapticsEnabled).toBe(true);
    });
  });

  describe('Onboarding Settings', () => {
    it('initializes with onboarding not completed', () => {
      const { result } = renderHook(() => useSettingsStore());
      expect(result.current.onboardingCompleted).toBe(false);
    });

    it('allows marking onboarding as completed', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setOnboardingCompleted(true);
      });

      expect(result.current.onboardingCompleted).toBe(true);
    });
  });

  describe('Reset Settings', () => {
    it('resets all settings to defaults', () => {
      const { result } = renderHook(() => useSettingsStore());

      // Change all settings
      act(() => {
        result.current.setTheme('dark');
        result.current.setSoundEnabled(false);
        result.current.setHapticsEnabled(false);
        result.current.setOnboardingCompleted(true);
      });

      // Reset
      act(() => {
        result.current.resetSettings();
      });

      expect(result.current.theme).toBe('light');
      expect(result.current.soundEnabled).toBe(true);
      expect(result.current.hapticsEnabled).toBe(true);
      expect(result.current.onboardingCompleted).toBe(false);
    });
  });
});
