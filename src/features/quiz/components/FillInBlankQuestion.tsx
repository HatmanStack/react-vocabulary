import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, Keyboard, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Button, Typography, Spacer } from '@/shared/ui';

/**
 * FillInBlankQuestion Component
 *
 * Displays a sentence with a blank and a text input for the user to fill in.
 * Includes submit and hint buttons.
 *
 * @example
 * ```tsx
 * <FillInBlankQuestion
 *   sentence="Timmy was _____ after falling off the jungle gym"
 *   onSubmitAnswer={(answer) => validateAnswer(answer)}
 *   onUseHint={() => showHint()}
 * />
 * ```
 */

interface FillInBlankQuestionProps {
  /** Sentence with blank placeholder (use _____) */
  sentence: string;
  /** Callback when answer is submitted */
  onSubmitAnswer: (answer: string) => void;
  /** Callback when hint button is pressed */
  onUseHint: () => void;
}

export function FillInBlankQuestion({
  sentence,
  onSubmitAnswer,
  onUseHint,
}: FillInBlankQuestionProps) {
  const theme = useTheme();
  const [answer, setAnswer] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Auto-focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) return;

    // Dismiss keyboard on mobile
    Keyboard.dismiss();

    // Submit answer
    onSubmitAnswer(trimmedAnswer);

    // Clear input after submission
    setTimeout(() => {
      setAnswer('');
    }, 1800);
  };

  const handleHint = () => {
    setHintUsed(true);
    onUseHint();
  };

  const isSubmitDisabled = !answer.trim();

  return (
    <View style={styles.container}>
      <View style={styles.sentenceContainer}>
        <Typography variant="body" align="center">
          {sentence}
        </Typography>
      </View>

      <Spacer size="lg" />

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              borderColor: theme.colors.outline,
              color: theme.colors.onSurface,
              backgroundColor: theme.colors.surface,
            },
          ]}
          value={answer}
          onChangeText={setAnswer}
          placeholder="Type your answer..."
          placeholderTextColor={theme.colors.onSurfaceDisabled}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Answer input"
        />
      </View>

      <Spacer size="md" />

      <View style={styles.buttonsContainer}>
        <View style={styles.buttonRow}>
          <View style={styles.hintButtonContainer}>
            <Button
              variant="text"
              icon="lightbulb-outline"
              onPress={handleHint}
              style={[styles.hintButton, hintUsed && styles.hintButtonUsed]}
              accessibilityLabel="Use hint"
            >
              Hint
            </Button>
          </View>

          <View style={styles.submitButtonContainer}>
            <Button
              variant="primary"
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
              accessibilityLabel="Submit answer"
            >
              Submit
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sentenceContainer: {
    paddingVertical: 8,
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  buttonsContainer: {
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  hintButtonContainer: {
    flex: 1,
  },
  submitButtonContainer: {
    flex: 2,
  },
  hintButton: {
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  hintButtonUsed: {
    opacity: 0.5,
  },
});
