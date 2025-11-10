import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '@/shared/ui';

/**
 * MultipleChoiceQuestion Component
 *
 * Displays 4 answer options in a 2x2 grid layout.
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
}

export function MultipleChoiceQuestion({
  options,
  onSelectAnswer,
  selectedAnswer = null,
}: MultipleChoiceQuestionProps) {
  const [isDisabled, setIsDisabled] = useState(false);

  const handleSelect = (answer: string) => {
    if (isDisabled) return;

    // Disable buttons temporarily to prevent double-tap
    setIsDisabled(true);
    onSelectAnswer(answer);

    // Re-enable after feedback animation (1.5s)
    setTimeout(() => {
      setIsDisabled(false);
    }, 1800);
  };

  // Ensure we have exactly 4 options
  const normalizedOptions = [...options].slice(0, 4);
  while (normalizedOptions.length < 4) {
    normalizedOptions.push('');
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {normalizedOptions.map((option, index) => (
          <View key={index} style={styles.gridItem}>
            <Button
              variant="secondary"
              onPress={() => handleSelect(option)}
              disabled={isDisabled || !option}
              style={[styles.optionButton, selectedAnswer === option && styles.selectedButton]}
              accessibilityLabel={`Option ${index + 1}: ${option}`}
            >
              {option}
            </Button>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    aspectRatio: 2,
  },
  optionButton: {
    height: '100%',
    justifyContent: 'center',
  },
  selectedButton: {
    opacity: 0.6,
  },
});
