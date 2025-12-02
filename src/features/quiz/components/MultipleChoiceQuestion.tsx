import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { Button, Spacer } from '@/shared/ui';

/**
 * MultipleChoiceQuestion Component
 *
 * Displays 4 answer options. On small screens: 2x2 grid. On large screens: 1x4 vertical layout.
 * Handles answer selection and shows visual feedback.
 *
 * @example
 * ```tsx
 * <MultipleChoiceQuestion
 *   options={["abject", "aberration", "abjure", "abnegate"]}
 *   onSelectAnswer={(answer) => validateAnswer(answer)}
 * />
 * ```
 */

interface MultipleChoiceQuestionProps {
  /** Array of 4 answer options */
  options: string[];
  /** Callback when an option is selected */
  onSelectAnswer: (answer: string) => void;
  /** Currently selected answer (controlled) */
  selectedAnswer?: string | null;
  /** Number of times this question has been presented */
  presentationCount?: number;
  /** The correct answer to highlight when Help Me Out is used */
  correctAnswer?: string;
}

export function MultipleChoiceQuestion({
  options,
  onSelectAnswer,
  selectedAnswer = null,
  presentationCount = 0,
  correctAnswer,
}: MultipleChoiceQuestionProps) {
  const [isDisabled, setIsDisabled] = useState(false);
  const [highlightedAnswer, setHighlightedAnswer] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  // Use vertical layout on screens wider than 768px (tablet/desktop)
  const isLargeScreen = width > 768;

  // Show Help Me Out button if question has been presented 3+ times
  const showHelpMeOut = presentationCount >= 3 && correctAnswer;

  const handleSelect = (answer: string) => {
    if (isDisabled) return;

    // Disable buttons temporarily to prevent double-tap
    setIsDisabled(true);
    onSelectAnswer(answer);

    // Re-enable after feedback animation (1.5s)
    setTimeout(() => {
      setIsDisabled(false);
      setHighlightedAnswer(null); // Clear highlight after submission
    }, 1800);
  };

  const handleHelpMeOut = () => {
    // Highlight the correct answer button
    if (correctAnswer) {
      setHighlightedAnswer(correctAnswer);
    }
  };

  // Ensure we have exactly 4 options
  const normalizedOptions = [...options].slice(0, 4);
  while (normalizedOptions.length < 4) {
    normalizedOptions.push('');
  }

  return (
    <View style={styles.container}>
      {showHelpMeOut && (
        <>
          <View style={styles.helpMeOutContainer}>
            <Button
              variant="secondary"
              icon="hand-heart"
              onPress={handleHelpMeOut}
              style={styles.helpMeOutButton}
              accessibilityLabel="Help me out - highlight the correct answer"
            >
              Help Me Out
            </Button>
          </View>
          <Spacer size="md" />
        </>
      )}

      <View style={[styles.grid, isLargeScreen && styles.gridVertical]}>
        {normalizedOptions.map((option, index) => {
          const isHighlighted = highlightedAnswer === option;
          return (
            <View
              key={index}
              style={[
                styles.gridItem,
                isLargeScreen && styles.gridItemVertical
              ]}
            >
              <PaperButton
                mode={isHighlighted ? "contained" : "outlined"}
                onPress={() => handleSelect(option)}
                disabled={isDisabled || !option}
                style={[
                  styles.optionButton,
                  isHighlighted && styles.highlightedButton
                ]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                accessibilityLabel={`Option ${index + 1}: ${option}${isHighlighted ? ' (Correct answer)' : ''}`}
              >
                {option}
              </PaperButton>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridVertical: {
    flexDirection: 'column',
  },
  gridItem: {
    width: '48%',
  },
  gridItemVertical: {
    width: '100%',
  },
  optionButton: {
    minHeight: 56,
  },
  highlightedButton: {
    borderWidth: 2,
  },
  buttonContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  buttonLabel: {
    fontSize: 18,
    lineHeight: 24,
  },
  helpMeOutContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  helpMeOutText: {
    textAlign: 'center',
  },
  helpMeOutButton: {
    width: '100%',
  },
});
