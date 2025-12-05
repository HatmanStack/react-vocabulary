/**
 * LoginPrompt Component
 *
 * A reusable login/username entry component with claim-based flow.
 * Allows users to enter a username for cloud sync.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Dialog, Portal, useTheme } from 'react-native-paper';
import { Button, Typography, Spacer, Card } from '@/shared/ui';
import { useProgressStore } from '@/shared/store/progressStore';

export interface LoginPromptProps {
  onComplete: () => void;
  onSkip?: () => void;
}

// Username validation: 3-30 chars, alphanumeric and underscores only
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

function validateUsername(username: string): string | null {
  if (!username) {
    return 'Username is required';
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (username.length > 30) {
    return 'Username must be at most 30 characters';
  }
  if (!USERNAME_REGEX.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return null;
}

export function LoginPrompt({ onComplete, onSkip }: LoginPromptProps) {
  const theme = useTheme();
  const { setUsername, checkUsernameExists, fullSync, syncToCloud } = useProgressStore();

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleInputChange = useCallback((text: string) => {
    setInputValue(text.toLowerCase().trim());
    setValidationError(null);
    setApiError(null);
  }, []);

  const handleContinue = useCallback(async () => {
    // Validate username
    const error = validateUsername(inputValue);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      // Check if username exists
      const exists = await checkUsernameExists(inputValue);

      if (exists) {
        // Show confirmation dialog for existing username
        setConfirmDialogVisible(true);
      } else {
        // New username - set it and create user
        await setUsername(inputValue);
        await syncToCloud();
        onComplete();
      }
    } catch (error) {
      console.error('Login error:', error);
      setApiError('Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, checkUsernameExists, setUsername, syncToCloud, onComplete]);

  const handleConfirmYes = useCallback(async () => {
    setConfirmDialogVisible(false);
    setIsLoading(true);

    try {
      // Existing user - set username and sync
      await setUsername(inputValue);
      await fullSync();
      onComplete();
    } catch (error) {
      console.error('Sync error:', error);
      setApiError('Failed to sync. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, setUsername, fullSync, onComplete]);

  const handleConfirmNo = useCallback(() => {
    setConfirmDialogVisible(false);
    setInputValue('');
    setApiError('Please try a different username');
  }, []);

  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip();
    }
  }, [onSkip]);

  const isValid = !validateUsername(inputValue);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Typography variant="heading2" align="center">
          Cloud Sync
        </Typography>
        <Spacer size="sm" />
        <Typography variant="body" color="secondary" align="center">
          Enter a username to sync your progress across devices. Choose wisely - usernames cannot be
          changed!
        </Typography>

        <Spacer size="lg" />

        <Card elevation="low" style={styles.card}>
          <View style={styles.inputContainer}>
            <Typography variant="caption" color="secondary">
              Username
            </Typography>
            <Spacer size="xs" />
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: validationError || apiError ? theme.colors.error : theme.colors.outline,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.onSurface,
                },
              ]}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              placeholder="Enter username"
              value={inputValue}
              onChangeText={handleInputChange}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              editable={!isLoading}
            />
            {(validationError || apiError) && (
              <>
                <Spacer size="xs" />
                <Typography variant="caption" style={{ color: theme.colors.error }}>
                  {validationError || apiError}
                </Typography>
              </>
            )}
          </View>
        </Card>

        <Spacer size="lg" />

        <Button
          variant="primary"
          fullWidth
          onPress={handleContinue}
          disabled={!isValid || isLoading}
          loading={isLoading}
        >
          Continue
        </Button>

        {onSkip && (
          <>
            <Spacer size="sm" />
            <Button variant="text" fullWidth onPress={handleSkip} disabled={isLoading}>
              Skip for now
            </Button>
          </>
        )}

        <Spacer size="md" />

        <Typography variant="caption" color="secondary" align="center">
          Progress is always saved locally. Cloud sync lets you restore progress if you switch
          devices.
        </Typography>
      </View>

      {/* Username Exists Confirmation Dialog */}
      <Portal>
        <Dialog visible={confirmDialogVisible} onDismiss={handleConfirmNo}>
          <Dialog.Title>Username Taken</Dialog.Title>
          <Dialog.Content>
            <Typography variant="body">
              The username "{inputValue}" is already in use.
            </Typography>
            <Spacer size="sm" />
            <Typography variant="body">
              If this is your account, we'll sync your existing progress. Is this you?
            </Typography>
          </Dialog.Content>
          <Dialog.Actions>
            <Button variant="text" onPress={handleConfirmNo}>
              No, try different name
            </Button>
            <Button variant="text" onPress={handleConfirmYes}>
              Yes, that's me
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    padding: 16,
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});
