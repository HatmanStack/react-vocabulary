import React from 'react';
import { Text as PaperText, useTheme } from 'react-native-paper';
import { StyleProp, TextStyle } from 'react-native';

/**
 * Typography Component
 *
 * A wrapper around React Native Paper's Text component that provides
 * semantic typography variants and consistent text styling.
 *
 * @example
 * ```tsx
 * <Typography variant="heading1">Main Title</Typography>
 * <Typography variant="body" color="secondary">Body text</Typography>
 * <Typography variant="caption" align="center">Centered caption</Typography>
 * ```
 */

type TypographyVariant = 'heading1' | 'heading2' | 'heading3' | 'body' | 'caption' | 'label';

type TypographyColor = 'primary' | 'secondary' | 'error' | 'disabled';

type TypographyAlign = 'left' | 'center' | 'right';

interface TypographyProps {
  /** Typography variant for semantic meaning */
  variant?: TypographyVariant;
  /** Text color variant */
  color?: TypographyColor;
  /** Text alignment */
  align?: TypographyAlign;
  /** Children text content */
  children: React.ReactNode;
  /** Custom styles */
  style?: StyleProp<TextStyle>;
  /** Enable font scaling for accessibility (default: true) */
  allowFontScaling?: boolean;
}

const VARIANT_MAP: Record<TypographyVariant, string> = {
  heading1: 'displayLarge',
  heading2: 'headlineLarge',
  heading3: 'headlineMedium',
  body: 'bodyLarge',
  caption: 'bodySmall',
  label: 'labelLarge',
};

export function Typography({
  variant = 'body',
  color = 'primary',
  align = 'left',
  children,
  style,
  allowFontScaling = true,
}: TypographyProps) {
  const theme = useTheme();

  const getColor = () => {
    switch (color) {
      case 'primary':
        return theme.colors.onSurface;
      case 'secondary':
        return theme.colors.onSurfaceVariant;
      case 'error':
        return theme.colors.error;
      case 'disabled':
        return theme.colors.onSurfaceDisabled;
      default:
        return theme.colors.onSurface;
    }
  };

  // Set accessibility role for headings
  const getAccessibilityRole = (): 'header' | 'text' => {
    return variant.startsWith('heading') ? 'header' : 'text';
  };

  return (
    <PaperText
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      variant={VARIANT_MAP[variant] as any}
      style={[{ color: getColor(), textAlign: align }, style]}
      allowFontScaling={allowFontScaling}
      accessibilityRole={getAccessibilityRole()}
    >
      {children}
    </PaperText>
  );
}
