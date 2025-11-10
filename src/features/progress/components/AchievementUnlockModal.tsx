/**
 * Achievement Unlock Modal
 *
 * Celebration modal displayed when user unlocks an achievement.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Modal, TouchableWithoutFeedback } from 'react-native';
import { Achievement } from '@/shared/types';
import { Typography, Button, Spacer } from '@/shared/ui';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

interface AchievementUnlockModalProps {
  achievement: Achievement | null;
  visible: boolean;
  onDismiss: () => void;
}

export function AchievementUnlockModal({
  achievement,
  visible,
  onDismiss,
}: AchievementUnlockModalProps) {
  const reducedMotion = useReducedMotion();
  const fadeAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0.5)).current;

  useEffect(() => {
    if (visible && achievement) {
      // Skip animations if reduced motion is enabled
      if (reducedMotion) {
        fadeAnim.setValue(1);
        scaleAnim.setValue(1);
        return;
      }

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      fadeAnim.setValue(reducedMotion ? 1 : 0);
      scaleAnim.setValue(reducedMotion ? 1 : 0.5);
    }
  }, [visible, achievement, reducedMotion]);

  if (!achievement) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      accessibilityLabel="Achievement unlocked"
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modal,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Celebration Header */}
              <View style={styles.header}>
                <Typography variant="heading1" style={styles.celebrationIcon}>
                  🎉
                </Typography>
                <Typography variant="heading2" style={styles.title}>
                  Achievement Unlocked!
                </Typography>
              </View>

              <Spacer size="md" />

              {/* Achievement Display */}
              <View style={styles.achievementContainer}>
                <View style={styles.iconContainer}>
                  <Typography variant="heading1" style={styles.icon}>
                    {achievement.icon}
                  </Typography>
                </View>

                <Spacer size="md" />

                <Typography variant="heading2" style={styles.achievementName}>
                  {achievement.name}
                </Typography>

                <Spacer size="sm" />

                <Typography variant="body" style={styles.description} color="secondary">
                  {achievement.description}
                </Typography>
              </View>

              <Spacer size="lg" />

              {/* Dismiss Button */}
              <Button variant="primary" onPress={onDismiss} style={styles.button}>
                Awesome!
              </Button>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
  },
  celebrationIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    textAlign: 'center',
    color: '#6200EE',
  },
  achievementContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#6200EE',
  },
  icon: {
    fontSize: 48,
  },
  achievementName: {
    textAlign: 'center',
    fontWeight: 'bold' as const,
  },
  description: {
    textAlign: 'center',
  },
  button: {
    minWidth: 150,
  },
});
