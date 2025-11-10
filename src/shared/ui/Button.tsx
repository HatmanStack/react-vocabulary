import React, { useCallback } from 'react';
import { Button as PaperButton } from 'react-native-paper';
import { StyleProp, ViewStyle, StyleSheet } from 'react-native';

/**
 * Button Component
 *
 * A customized button component with variants, sizes, and loading states.
 * Wraps React Native Paper's Button with additional functionality.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onPress={handleSubmit}>
 *   Submit
 * </Button>
 *
 * <Button variant="secondary" size="small" loading>
 *   Loading...
 * </Button>
 *
 * <Button variant="text" fullWidth disabled>
 *   Disabled Button
 * </Button>
 * ```
 */

type ButtonVariant = 'primary' | 'secondary' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  /** Button variant for different visual styles */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Display as full-width button */
  fullWidth?: boolean;
  /** Show loading indicator */
  loading?: boolean;
  /** Disable button interaction */
  disabled?: boolean;
  /** Button icon */
  icon?: string;
  /** Press handler */
  onPress?: () => void;
  /** Button label */
  children: React.ReactNode;
  /** Custom styles */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint describing what happens when the button is pressed */
  accessibilityHint?: string;
}

const SIZE_CONTENT_STYLE: Record<ButtonSize, ViewStyle> = {
  small: { paddingVertical: 4, paddingHorizontal: 12 },
  medium: { paddingVertical: 8, paddingHorizontal: 16 },
  large: { paddingVertical: 12, paddingHorizontal: 24 },
};

export function Button({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  onPress,
  children,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const handlePress = useCallback(() => {
    if (!loading && !disabled && onPress) {
      onPress();
    }
  }, [loading, disabled, onPress]);

  const getMode = (): 'contained' | 'outlined' | 'text' => {
    switch (variant) {
      case 'primary':
        return 'contained';
      case 'secondary':
        return 'outlined';
      case 'text':
        return 'text';
      default:
        return 'contained';
    }
  };

  const buttonStyles = [fullWidth && styles.fullWidth, style];

  // Use children as accessibilityLabel if not provided
  const a11yLabel = accessibilityLabel || (typeof children === 'string' ? children : undefined);

  return (
    <PaperButton
      mode={getMode()}
      onPress={handlePress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      contentStyle={SIZE_CONTENT_STYLE[size]}
      style={buttonStyles}
      accessibilityLabel={a11yLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
    >
      {children}
    </PaperButton>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
});
