import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography, ProgressBar, Spacer } from '@/shared/ui';
import { IconButton } from 'react-native-paper';

/**
 * QuizHeader Component
 *
 * Displays quiz progress, current question number, and session statistics
 * at the top of the quiz screen.
 *
 * @example
 * ```tsx
 * <QuizHeader
 *   listName="List A"
 *   levelName="Basic"
 *   currentIndex={2}
 *   totalWords={8}
 *   hintsUsed={1}
 *   wrongAnswers={0}
 *   onExit={() => setShowExitDialog(true)}
 * />
 * ```
 */

interface QuizHeaderProps {
  /** Name of the vocabulary list */
  listName: string;
  /** Name of the difficulty level */
  levelName: string;
  /** Current question index (0-based) */
  currentIndex: number;
  /** Total number of words in quiz */
  totalWords: number;
  /** Number of hints used in session */
  hintsUsed: number;
  /** Number of wrong answers in session */
  wrongAnswers: number;
  /** Exit/close button handler */
  onExit: () => void;
}

export function QuizHeader({
  listName,
  levelName,
  currentIndex,
  totalWords,
  hintsUsed,
  wrongAnswers,
  onExit,
}: QuizHeaderProps) {
  // Display as 1-based for user (currentIndex + 1)
  const currentQuestion = currentIndex + 1;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleSection}>
          <Typography variant="heading3">
            {listName} - {levelName}
          </Typography>
        </View>
        <IconButton icon="close" size={24} onPress={onExit} accessibilityLabel="Exit quiz" />
      </View>

      <Spacer size="sm" />

      <ProgressBar
        progress={currentQuestion}
        max={totalWords}
        label={`Question ${currentQuestion} of ${totalWords}`}
      />

      <Spacer size="sm" />

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Typography variant="caption" color="secondary">
            Hints: {hintsUsed}
          </Typography>
        </View>
        <View style={styles.stat}>
          <Typography variant="caption" color="secondary">
            Wrong: {wrongAnswers}
          </Typography>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSection: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 24,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
