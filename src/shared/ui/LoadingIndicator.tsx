import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

/**
 * LoadingIndicator Component
 *
 * Displays a loading spinner with optional text message.
 * Can be used inline or as a full-screen overlay.
 *
 * @example
 * ```tsx
 * <LoadingIndicator />
 * <LoadingIndicator text="Loading vocabulary..." />
 * <LoadingIndicator overlay size="large" />
 * ```
 */

interface LoadingIndicatorProps {
  /** Loading message to display */
  text?: string;
  /** Spinner size */
  size?: 'small' | 'large' | number;
  /** Spinner color */
  color?: string;
  /** Display as full-screen overlay */
  overlay?: boolean;
}

export function LoadingIndicator({
  text,
  size = 'large',
  color,
  overlay = false,
}: LoadingIndicatorProps) {
  const theme = useTheme();
  const spinnerColor = color || theme.colors.primary;

  const content = (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text && (
        <Text variant="bodyMedium" style={styles.text}>
          {text}
        </Text>
      )}
    </View>
  );

  if (overlay) {
    return <View style={styles.overlay}>{content}</View>;
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  text: {
    marginTop: 12,
  },
});
