/**
 * Achievement Badge Component
 *
 * Displays a single achievement badge with locked/unlocked state.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
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
  const theme = useTheme();
  const isLocked = !achievement.isUnlocked;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isLocked ? theme.colors.surfaceVariant : theme.colors.surface,
          borderColor: isLocked ? theme.colors.outline : theme.colors.primary,
        },
      ]}
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
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isLocked
              ? theme.colors.outlineVariant
              : theme.colors.primaryContainer,
          },
        ]}
      >
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
        <View style={[styles.progressContainer, { backgroundColor: theme.colors.outlineVariant }]}>
          <View
            style={[
              styles.progressBar,
              { width: `${achievement.progress}%`, backgroundColor: theme.colors.primary },
            ]}
          />
        </View>
      )}

      {/* Unlocked indicator */}
      {achievement.isUnlocked && (
        <View style={[styles.unlockedBadge, { backgroundColor: theme.colors.secondary }]} />
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 100,
    position: 'relative',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  unlockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
