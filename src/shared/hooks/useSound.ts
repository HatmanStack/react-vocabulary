/**
 * useSound Hook
 *
 * Provides sound playback functionality with settings integration.
 * Uses expo-av for cross-platform audio playback.
 */

import { useEffect, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useSettingsStore } from '@/shared/store/settingsStore';

// Sound file paths - these files should be added to src/assets/sounds/
// See src/assets/sounds/README.md for requirements
const SOUND_FILES = {
  correct: null, // Will be: require('@/assets/sounds/correct.mp3')
  wrong: null, // Will be: require('@/assets/sounds/wrong.mp3')
  complete: null, // Will be: require('@/assets/sounds/complete.mp3')
} as const;

export function useSound() {
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const soundsRef = useRef<{
    correct?: Audio.Sound;
    wrong?: Audio.Sound;
    complete?: Audio.Sound;
  }>({});

  // Load sounds on mount
  useEffect(() => {
    let isMounted = true;

    async function loadSounds() {
      try {
        // Check if sound files are available
        if (!SOUND_FILES.correct || !SOUND_FILES.wrong || !SOUND_FILES.complete) {
          console.log('Sound files not available. Add MP3 files to src/assets/sounds/');
          return;
        }

        // Set audio mode for playback
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        // Load all sound files
        const [correctSound, wrongSound, completeSound] = await Promise.all([
          Audio.Sound.createAsync(SOUND_FILES.correct, { shouldPlay: false }),
          Audio.Sound.createAsync(SOUND_FILES.wrong, { shouldPlay: false }),
          Audio.Sound.createAsync(SOUND_FILES.complete, { shouldPlay: false }),
        ]);

        if (isMounted) {
          soundsRef.current = {
            correct: correctSound.sound,
            wrong: wrongSound.sound,
            complete: completeSound.sound,
          };
        }
      } catch (error) {
        console.warn('Failed to load sound files:', error);
        // Sounds are optional, continue without them
      }
    }

    loadSounds();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      Object.values(soundsRef.current).forEach((sound) => {
        sound?.unloadAsync().catch(console.error);
      });
      soundsRef.current = {};
    };
  }, []);

  // Helper function to play a sound
  const playSound = async (soundType: keyof typeof SOUND_FILES) => {
    if (!soundEnabled) return;

    const sound = soundsRef.current[soundType];
    if (!sound) {
      console.warn(`Sound ${soundType} not loaded`);
      return;
    }

    try {
      // Stop and rewind if already playing
      const status: AVPlaybackStatus = await sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await sound.stopAsync();
      }

      // Rewind to beginning
      await sound.setPositionAsync(0);

      // Play sound
      await sound.playAsync();
    } catch (error) {
      console.error(`Error playing ${soundType} sound:`, error);
    }
  };

  return {
    playCorrect: () => playSound('correct'),
    playWrong: () => playSound('wrong'),
    playComplete: () => playSound('complete'),
  };
}
