/**
 * useHaptics Hook
 *
 * Provides haptic feedback functionality for mobile devices.
 * Respects user preferences and platform compatibility.
 */

import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/shared/store/settingsStore';

export function useHaptics() {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  // Only enable on mobile platforms (iOS, Android)
  const isHapticsSupported = Platform.OS === 'ios' || Platform.OS === 'android';

  const triggerHaptic = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'success') => {
      if (!hapticsEnabled || !isHapticsSupported) {
        return;
      }

      try {
        switch (type) {
          case 'light':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'success':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
        }
      } catch (error) {
        console.warn('Haptic feedback error:', error);
      }
    },
    [hapticsEnabled, isHapticsSupported]
  );

  return {
    triggerLight: useCallback(() => triggerHaptic('light'), [triggerHaptic]),
    triggerMedium: useCallback(() => triggerHaptic('medium'), [triggerHaptic]),
    triggerHeavy: useCallback(() => triggerHaptic('heavy'), [triggerHaptic]),
    triggerSuccess: useCallback(() => triggerHaptic('success'), [triggerHaptic]),
    isSupported: isHapticsSupported,
  };
}
