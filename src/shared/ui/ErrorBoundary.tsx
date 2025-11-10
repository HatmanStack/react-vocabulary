import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button as PaperButton, Surface } from 'react-native-paper';

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs them, and displays a fallback UI instead of crashing the app.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponentThatMightCrash />
 * </ErrorBoundary>
 *
 * <ErrorBoundary fallback={<CustomErrorScreen />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */

interface ErrorBoundaryProps {
  /** Children to wrap with error boundary */
  children: ReactNode;
  /** Custom fallback component to show on error */
  fallback?: ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <Surface style={styles.surface} elevation={2}>
            <Text variant="headlineMedium" style={styles.title}>
              Oops! Something went wrong
            </Text>
            <Text variant="bodyMedium" style={styles.message}>
              We're sorry for the inconvenience. Please try again.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text variant="bodySmall" style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}
            <PaperButton mode="contained" onPress={this.handleReset} style={styles.button}>
              Try Again
            </PaperButton>
          </Surface>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  surface: {
    padding: 24,
    borderRadius: 8,
    maxWidth: 400,
    width: '100%',
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  errorDetails: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'monospace',
    color: '#c00',
  },
  button: {
    marginTop: 8,
  },
});
