import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { Button, Typography, Spacer } from '@/shared/ui';

/**
 * LevelButton Component
 *
 * Displays a difficulty level button with visual indicators,
 * word count, and completion status.
 *
 * @example
 * ```tsx
 * <LevelButton
 *   levelId="basic"
 *   name="Basic"
 *   wordCount={8}
 *   difficulty={1}
 *   completionStatus="0 / 8 mastered"
 *   onPress={() => navigation.navigate('Quiz', { listId, levelId: 'basic' })}
 * />
 * ```
 */

interface LevelButtonProps {
  /** Level identifier */
  levelId: string;
  /** Display name of the level */
  name: string;
  /** Number of words in this level */
  wordCount: number;
  /** Difficulty rating (1-5) */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Completion status text (e.g., "0 / 8 mastered") */
  completionStatus?: string;
  /** Whether the level is locked */
  disabled?: boolean;
  /** Press handler */
  onPress: () => void;
}

const DIFFICULTY_COLORS: Record<number, string> = {
  1: '#4CAF50', // Green - Basic
  2: '#2196F3', // Blue - Intermediate
  3: '#FF9800', // Orange - Advanced
  4: '#F44336', // Red - Expert
  5: '#9C27B0', // Purple - Professional
};

const DIFFICULTY_ICONS: Record<number, string> = {
  1: 'leaf',
  2: 'star',
  3: 'fire',
  4: 'sword',
  5: 'crown',
};

export function LevelButton({
  levelId: _levelId,
  name,
  wordCount,
  difficulty,
  completionStatus = '0 mastered',
  disabled = false,
  onPress,
}: LevelButtonProps) {
  const difficultyColor = DIFFICULTY_COLORS[difficulty];
  const iconName = DIFFICULTY_ICONS[difficulty];

  return (
    <Button
      variant="secondary"
      onPress={onPress}
      disabled={disabled}
      fullWidth
      style={[styles.button, { borderLeftWidth: 4, borderLeftColor: difficultyColor }]}
      accessibilityLabel={`${name} level, ${wordCount} words, ${completionStatus}`}
    >
      <View style={styles.buttonContent}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: difficultyColor }]}>
            <Icon source={iconName} size={24} color="#FFFFFF" />
          </View>
          <Spacer size="sm" direction="horizontal" />
          <View style={styles.textContainer}>
            <Typography variant="heading3">{name}</Typography>
            <Spacer size="xs" />
            <Typography variant="caption" color="secondary">
              {wordCount} words
            </Typography>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Typography variant="caption" color="secondary" align="right">
            {completionStatus}
          </Typography>
        </View>
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    marginBottom: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  rightSection: {
    marginLeft: 8,
  },
});
