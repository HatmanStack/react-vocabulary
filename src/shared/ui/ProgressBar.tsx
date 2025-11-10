import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ProgressBar as PaperProgressBar, Text, useTheme } from 'react-native-paper';

/**
 * ProgressBar Component
 *
 * An animated progress bar with optional label showing progress as a fraction or percentage.
 * Color changes based on progress (warning at 50%, success at 100%).
 *
 * @example
 * ```tsx
 * <ProgressBar progress={7} max={10} label="7 / 10 words" />
 * <ProgressBar progress={0.75} max={1} showPercentage />
 * <ProgressBar progress={0.5} max={1} indeterminate />
 * ```
 */

interface ProgressBarProps {
  /** Current progress value */
  progress: number;
  /** Maximum progress value (defaults to 1 for percentage) */
  max?: number;
  /** Show label with progress info */
  label?: string;
  /** Show percentage instead of custom label */
  showPercentage?: boolean;
  /** Indeterminate mode (loading animation) */
  indeterminate?: boolean;
  /** Custom color */
  color?: string;
}

export function ProgressBar({
  progress,
  max = 1,
  label,
  showPercentage = false,
  indeterminate = false,
  color,
}: ProgressBarProps) {
  const theme = useTheme();
  const animatedProgress = useRef(new Animated.Value(0)).current;

  // Calculate normalized progress (0-1)
  const normalizedProgress = Math.min(Math.max(progress / max, 0), 1);

  // Animate progress changes
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: normalizedProgress,
      duration: 300,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedProgress]);

  // Determine color based on progress
  const getProgressColor = () => {
    if (color) return color;
    if (normalizedProgress >= 1) return theme.colors.primary;
    if (normalizedProgress >= 0.5) return theme.colors.tertiary;
    return theme.colors.secondary;
  };

  // Generate label text
  const getLabelText = () => {
    if (label) return label;
    if (showPercentage) return `${Math.round(normalizedProgress * 100)}%`;
    return `${progress} / ${max}`;
  };

  return (
    <View style={styles.container}>
      <PaperProgressBar
        progress={indeterminate ? undefined : normalizedProgress}
        indeterminate={indeterminate}
        color={getProgressColor()}
        style={styles.progressBar}
      />
      {(label || showPercentage) && (
        <Text variant="bodySmall" style={styles.label}>
          {getLabelText()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  label: {
    marginTop: 4,
    textAlign: 'center',
  },
});
