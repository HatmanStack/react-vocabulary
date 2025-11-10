import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Card, Typography, ProgressBar, Spacer } from '@/shared/ui';

/**
 * ListCard Component
 *
 * Displays a vocabulary list as a card with name, description, and progress.
 * Shows visual indicator (letter badge) and handles press events.
 *
 * @example
 * ```tsx
 * <ListCard
 *   id="list-a"
 *   name="List A"
 *   description="Basic vocabulary words"
 *   progress={0}
 *   max={40}
 *   onPress={() => navigation.navigate('Difficulty', { listId: 'list-a' })}
 * />
 * ```
 */

interface ListCardProps {
  /** Unique list identifier */
  id: string;
  /** Display name of the list */
  name: string;
  /** Optional description */
  description?: string;
  /** Current progress (words mastered) */
  progress?: number;
  /** Total words in list */
  max?: number;
  /** Press handler */
  onPress: () => void;
}

export const ListCard = React.memo(function ListCard({
  id: _id,
  name,
  description,
  progress = 0,
  max = 40,
  onPress,
}: ListCardProps) {
  const theme = useTheme();

  // Extract letter from name (e.g., "List A" → "A")
  const letter = name.match(/[A-H]/i)?.[0]?.toUpperCase() || '?';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.7 : 1 }]}
      accessibilityLabel={`${name}, ${progress} of ${max} words mastered`}
      accessibilityRole="button"
    >
      <Card elevation="medium" style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={[styles.letterBadge, { backgroundColor: theme.colors.primaryContainer }]}>
              <Typography variant="heading2" style={{ color: theme.colors.onPrimaryContainer }}>
                {letter}
              </Typography>
            </View>

            <View style={styles.cardInfo}>
              <Typography variant="heading3">{name}</Typography>
              {description && (
                <>
                  <Spacer size="xs" />
                  <Typography variant="caption" color="secondary">
                    {description}
                  </Typography>
                </>
              )}
            </View>
          </View>

          <Spacer size="md" />

          <ProgressBar
            progress={progress}
            max={max}
            label={`${progress} / ${max} words mastered`}
          />
        </Card.Content>
      </Card>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  card: {
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  letterBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
});
