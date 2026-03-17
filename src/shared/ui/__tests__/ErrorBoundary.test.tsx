/**
 * ErrorBoundary Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { ErrorBoundary } from '../ErrorBoundary';
import { lightTheme } from '@/shared/lib/theme';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<PaperProvider theme={lightTheme}>{ui}</PaperProvider>);
}

describe('ErrorBoundary', () => {
  // Suppress console errors in tests
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    const { getByText } = renderWithTheme(
      <ErrorBoundary>
        <Text>Child component</Text>
      </ErrorBoundary>
    );

    expect(getByText('Child component')).toBeTruthy();
  });

  it('catches errors and displays default error UI', () => {
    const { getByText } = renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Oops! Something went wrong')).toBeTruthy();
    expect(getByText("We're sorry for the inconvenience. Please try again.")).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = (
      <View>
        <Text>Custom error message</Text>
      </View>
    );

    const { getByText, queryByText } = renderWithTheme(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Custom error message')).toBeTruthy();
    expect(queryByText('Oops! Something went wrong')).toBeNull();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();

    renderWithTheme(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('has a Try Again button that can be pressed', () => {
    const { getByText } = renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be shown
    expect(getByText('Oops! Something went wrong')).toBeTruthy();

    // Try Again button should be pressable
    const tryAgainButton = getByText('Try Again');
    expect(tryAgainButton).toBeTruthy();

    // Should not throw when pressed
    expect(() => fireEvent.press(tryAgainButton)).not.toThrow();
  });

  it('displays error details in development mode', () => {
    // Mock __DEV__ to true
    const originalDev = (global as Record<string, unknown>).__DEV__;
    (global as Record<string, unknown>).__DEV__ = true;

    const { getByText } = renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText(/Error: Test error/)).toBeTruthy();

    // Restore __DEV__
    (global as Record<string, unknown>).__DEV__ = originalDev;
  });

  it('handles multiple children', () => {
    const { getByText } = renderWithTheme(
      <ErrorBoundary>
        <Text>Child 1</Text>
        <Text>Child 2</Text>
        <Text>Child 3</Text>
      </ErrorBoundary>
    );

    expect(getByText('Child 1')).toBeTruthy();
    expect(getByText('Child 2')).toBeTruthy();
    expect(getByText('Child 3')).toBeTruthy();
  });

  it('handles nested ErrorBoundaries', () => {
    const { getByText } = renderWithTheme(
      <ErrorBoundary>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </ErrorBoundary>
    );

    // Inner ErrorBoundary should catch the error
    expect(getByText('Oops! Something went wrong')).toBeTruthy();
  });
});
