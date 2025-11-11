/**
 * Settings Store
 *
 * Manages app settings including theme, sound, haptics.
 * NOTE: Persistence temporarily disabled for web compatibility.
 */

import { create } from 'zustand';

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
  onboardingCompleted: true, // Skip onboarding (no persistence on web)
  _hydrated: true, // Always hydrated since no persistence
};

export const useSettingsStore = create<SettingsState>()((set) => ({
  ...initialState,

  setHydrated: () => set({ _hydrated: true }),

  setTheme: (theme) => set({ theme }),

  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

  setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),

  setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),

  resetSettings: () => set({ ...initialState, _hydrated: true }),
}));
