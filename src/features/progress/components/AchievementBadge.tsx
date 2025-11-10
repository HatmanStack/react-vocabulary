/**
 * Achievement Badge Component
 *
 * Displays a single achievement badge with locked/unlocked state.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Achievement } from '@/shared/types';
import { Typography } from '@/shared/ui';

interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: () => void;
}

export const AchievementBadge = React.memo(function AchievementBadge({
  achievement,
  onPress,
}: AchievementBadgeProps) {
  const isLocked = !achievement.isUnlocked;

  return (
    <TouchableOpacity
      style={[styles.container, isLocked && styles.locked]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={
        isLocked
          ? `${achievement.name} - Locked - ${achievement.description}`
          : `${achievement.name} - Unlocked - ${achievement.description}`
      }
      accessibilityHint={isLocked ? 'Tap to view unlock requirements' : 'Tap to view details'}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, isLocked && styles.iconLocked]}>
        <Typography variant="heading1" style={styles.icon}>
          {achievement.icon}
        </Typography>
      </View>

      {/* Name */}
      <Typography variant="caption" style={[styles.name, isLocked && styles.textLocked]}>
        {achievement.name}
      </Typography>

      {/* Progress bar for progressive achievements */}
      {achievement.progress !== undefined && !achievement.isUnlocked && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${achievement.progress}%` }]} />
        </View>
      )}

      {/* Unlocked indicator */}
      {achievement.isUnlocked && <View style={styles.unlockedBadge} />}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#6200EE',
    minWidth: 100,
    position: 'relative',
  },
  locked: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconLocked: {
    backgroundColor: '#E0E0E0',
  },
  icon: {
    fontSize: 32,
    opacity: 1,
  },
  name: {
    textAlign: 'center',
    marginTop: 4,
  },
  textLocked: {
    opacity: 0.5,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6200EE',
    borderRadius: 2,
  },
  unlockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
});
