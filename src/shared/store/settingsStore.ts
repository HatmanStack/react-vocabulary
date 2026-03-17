/**
 * Settings Store
 *
 * Manages app settings including theme, sound, haptics.
 * Settings are persisted to AsyncStorage.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isValidSettingsData } from '@/shared/utils/validateState';

const SETTINGS_STORAGE_KEY = 'vocabulary-settings';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface SettingsState {
  // Theme settings
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // Audio settings
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // Haptic settings
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;

  // Onboarding
  onboardingCompleted: boolean;
  setOnboardingCompleted: (completed: boolean) => void;

  // Reset
  resetSettings: () => void;

  // Utility
  _hydrated: boolean;
  loadFromStorage: () => Promise<void>;
}

const initialState = {
  theme: 'light' as ThemeMode,
  soundEnabled: true,
  hapticsEnabled: true,
  onboardingCompleted: false,
  _hydrated: false,
};

// Helper to save settings to AsyncStorage
const saveSettingsToStorage = async (state: Partial<SettingsState>) => {
  try {
    const dataToSave = {
      theme: state.theme,
      soundEnabled: state.soundEnabled,
      hapticsEnabled: state.hapticsEnabled,
      onboardingCompleted: state.onboardingCompleted,
    };
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Failed to save settings to storage:', error);
  }
};

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...initialState,

  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (isValidSettingsData(data)) {
          set({
            theme: data.theme ?? initialState.theme,
            soundEnabled: data.soundEnabled ?? initialState.soundEnabled,
            hapticsEnabled: data.hapticsEnabled ?? initialState.hapticsEnabled,
            onboardingCompleted: data.onboardingCompleted ?? initialState.onboardingCompleted,
            _hydrated: true,
          });
        } else {
          console.warn('Invalid settings data in storage, using defaults');
          set({ _hydrated: true });
        }
      } else {
        set({ _hydrated: true });
      }
    } catch (error) {
      console.error('Failed to load settings from storage:', error);
      set({ _hydrated: true });
    }
  },

  setTheme: (theme) => {
    set({ theme });
    saveSettingsToStorage(get());
  },

  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled });
    saveSettingsToStorage(get());
  },

  setHapticsEnabled: (enabled) => {
    set({ hapticsEnabled: enabled });
    saveSettingsToStorage(get());
  },

  setOnboardingCompleted: (completed) => {
    set({ onboardingCompleted: completed });
    saveSettingsToStorage(get());
  },

  resetSettings: async () => {
    set({ ...initialState, _hydrated: true });
    try {
      await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear settings storage:', error);
    }
  },
}));
