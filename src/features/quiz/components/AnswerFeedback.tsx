import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { Typography } from '@/shared/ui';
import { Icon } from 'react-native-paper';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

/**
 * AnswerFeedback Component
 *
 * Displays animated feedback for correct or wrong answers.
 * Automatically fades in, holds briefly, then fades out.
 *
 * @example
 * ```tsx
 * <AnswerFeedback
 *   isCorrect={true}
 *   isVisible={showFeedback}
 *   onAnimationEnd={() => setShowFeedback(false)}
 * />
 * ```
 */

interface AnswerFeedbackProps {
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Controls visibility */
  isVisible: boolean;
  /** Callback when animation completes */
  onAnimationEnd: () => void;
}

export function AnswerFeedback({ isCorrect, isVisible, onAnimationEnd }: AnswerFeedbackProps) {
  const reducedMotion = useReducedMotion();
  const fadeAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0.8)).current;

  useEffect(() => {
    if (isVisible) {
      // Skip animations if reduced motion is enabled
      if (reducedMotion) {
        fadeAnim.setValue(1);
        scaleAnim.setValue(1);

        // Still auto-hide after delay, but no animation
        const timer = setTimeout(() => {
          onAnimationEnd();
        }, 1500);

        return () => clearTimeout(timer);
      }

      // Fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 1.5 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onAnimationEnd();
        });
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      // Reset animations when not visible
      fadeAnim.setValue(reducedMotion ? 1 : 0);
      scaleAnim.setValue(reducedMotion ? 1 : 0.8);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, reducedMotion]);

  if (!isVisible) {
    return null;
  }

  const backgroundColor = isCorrect ? '#4CAF50' : '#F44336';
  const iconName = isCorrect ? 'check-circle' : 'close-circle';
  const message = isCorrect ? 'Correct!' : 'Wrong!';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Icon source={iconName} size={40} color="#FFFFFF" />
      <Typography variant="heading2" style={styles.text}>
        {message}
      </Typography>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    width: 200,
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  text: {
    color: '#FFFFFF',
    marginTop: 8,
  },
});
