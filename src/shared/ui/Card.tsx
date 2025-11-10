import React from 'react';
import { Card as PaperCard, CardProps as PaperCardProps } from 'react-native-paper';
import { StyleProp, ViewStyle } from 'react-native';

/**
 * Card Component
 *
 * A wrapper around React Native Paper's Card that provides
 * elevation presets and consistent card styling.
 *
 * @example
 * ```tsx
 * <Card elevation="medium">
 *   <Card.Title title="Vocabulary List A" subtitle="40 words" />
 *   <Card.Content>
 *     <Text>Card content goes here</Text>
 *   </Card.Content>
 *   <Card.Actions>
 *     <Button>Cancel</Button>
 *     <Button>OK</Button>
 *   </Card.Actions>
 * </Card>
 * ```
 */

type CardElevation = 'low' | 'medium' | 'high';

interface CardComponentProps extends Omit<PaperCardProps, 'elevation' | 'mode'> {
  /** Elevation preset for shadow depth */
  elevation?: CardElevation;
  /** Custom styles */
  style?: StyleProp<ViewStyle>;
  /** Children components */
  children: React.ReactNode;
}

const ELEVATION_MAP: Record<CardElevation, number> = {
  low: 1,
  medium: 3,
  high: 5,
};

/**
 * Main Card component
 */
export function Card({ elevation = 'medium', style, children, ...rest }: CardComponentProps) {
  const elevationValue = ELEVATION_MAP[elevation] as 0 | 1 | 2 | 3 | 4 | 5;

  return (
    <PaperCard elevation={elevationValue} style={style} {...rest}>
      {children}
    </PaperCard>
  );
}

// Re-export Card subcomponents from Paper
Card.Title = PaperCard.Title;
Card.Content = PaperCard.Content;
Card.Actions = PaperCard.Actions;
Card.Cover = PaperCard.Cover;
