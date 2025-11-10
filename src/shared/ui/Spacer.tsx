import React from 'react';
import { View } from 'react-native';

/**
 * Spacer Component
 *
 * A utility component for adding consistent spacing between elements.
 * Helps maintain visual rhythm and spacing standards throughout the app.
 *
 * @example
 * ```tsx
 * <Text>First element</Text>
 * <Spacer size="md" />
 * <Text>Second element</Text>
 *
 * // Horizontal spacing
 * <View style={{ flexDirection: 'row' }}>
 *   <Button>First</Button>
 *   <Spacer size={16} direction="horizontal" />
 *   <Button>Second</Button>
 * </View>
 * ```
 */

type SpacerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
type SpacerDirection = 'vertical' | 'horizontal';

interface SpacerProps {
  /** Size of the space. Can be a preset or custom number */
  size?: SpacerSize;
  /** Direction of spacing */
  direction?: SpacerDirection;
}

const SPACING_PRESETS: Record<string, number> = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export function Spacer({ size = 'md', direction = 'vertical' }: SpacerProps) {
  const spacing = typeof size === 'number' ? size : SPACING_PRESETS[size];

  const style =
    direction === 'horizontal' ? { width: spacing, height: 1 } : { height: spacing, width: 1 };

  return <View style={style} />;
}
