import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Typography, Spacer } from '@/shared/ui';

/**
 * QuestionDisplay Component
 *
 * Displays the current quiz question text with appropriate styling
 * based on the question type (multiple choice or fill-in-blank).
 *
 * @example
 * ```tsx
 * <QuestionDisplay
 *   questionText="What does 'abject' mean?"
 *   type="multiple"
 * />
 * ```
 */

interface QuestionDisplayProps {
  /** The question text to display */
  questionText: string;
  /** Type of question (affects text alignment) */
  type: 'multiple' | 'fillin';
}

export function QuestionDisplay({ questionText, type }: QuestionDisplayProps) {
  const textAlign = type === 'multiple' ? 'center' : 'left';

  return (
    <Card elevation="low" style={styles.card} testID="question-display">
      <Card.Content>
        <View style={styles.questionContainer}>
          <Typography variant="caption" color="secondary" align="center">
            QUESTION
          </Typography>
          <Spacer size="sm" />
          <Typography variant="heading2" align={textAlign as 'left' | 'center' | 'right'}>
            {questionText}
          </Typography>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  questionContainer: {
    paddingVertical: 16,
    minHeight: 120,
    justifyContent: 'center',
  },
});
