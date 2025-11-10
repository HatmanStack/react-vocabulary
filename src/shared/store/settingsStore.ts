/**
 * Settings Store
 *
 * Manages app settings including theme, sound, haptics with persistence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/shared/lib/storage';

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
  setHydrated: () => void;
}

const initialState = {
  theme: 'light' as ThemeMode,
  soundEnabled: true,
  hapticsEnabled: true,
  onboardingCompleted: false,
  _hydrated: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,

      setHydrated: () => set({ _hydrated: true }),

      setTheme: (theme) => set({ theme }),

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),

      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),

      resetSettings: () => set({ ...initialState, _hydrated: true }),
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
      partialize: (state) => ({
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        hapticsEnabled: state.hapticsEnabled,
        onboardingCompleted: state.onboardingCompleted,
      }),
    }
  )
);
