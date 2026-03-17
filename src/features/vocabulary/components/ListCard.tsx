import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
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

// Emoji mapping for each themed list
const LIST_EMOJIS: Record<string, string> = {
  phoenix: '🔥',
  zenith: '⭐',
  odyssey: '🚀',
  cascade: '💧',
  horizon: '🌅',
  eclipse: '🌙',
  mosaic: '🎨',
  nexus: '🔗',
  catalyst: '⚡',
  prism: '🌈',
  aurora: '✨',
  pinnacle: '🏔️',
  meridian: '🧭',
  spectrum: '🎭',
  vertex: '💎',
  quantum: '⚛️',
  nebula: '🌌',
  summit: '🏆',
};

export const ListCard = React.memo(function ListCard({
  id,
  name,
  description,
  progress = 0,
  max = 40,
  onPress,
}: ListCardProps) {
  // Get emoji for this list
  const emoji = LIST_EMOJIS[id] || '📚';

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
            <Typography variant="heading1" style={styles.emoji}>
              {emoji}
            </Typography>
          </View>

          <Spacer size="md" />

          <View style={styles.cardInfo}>
            <Typography variant="heading2" style={styles.centeredText}>
              {name}
            </Typography>
            {description && (
              <>
                <Spacer size="xs" />
                <Typography variant="caption" color="secondary" style={styles.centeredText}>
                  {description}
                </Typography>
              </>
            )}
          </View>

          <Spacer size="lg" />

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
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  emoji: {
    fontSize: 56,
    textAlign: 'center',
  },
  cardInfo: {
    alignItems: 'center',
  },
  centeredText: {
    textAlign: 'center',
  },
});
