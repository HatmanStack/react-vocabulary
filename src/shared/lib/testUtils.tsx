/**
 * Test Utilities
 *
 * Helper functions and utilities for testing React Native components
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';

// Mock navigation object
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  reset: jest.fn(),
  dispatch: jest.fn(),
};

// Mock route object
export const mockRoute = (params: any = {}) => ({
  key: 'test-route',
  name: 'Test' as const,
  params,
});

// Custom render function with providers
export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <PaperProvider>
      <NavigationContainer>{children}</NavigationContainer>
    </PaperProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock vocabulary data generator
export const mockVocabularyList = (id: string) => ({
  id,
  name: `List ${id.toUpperCase()}`,
  description: `Mock description for ${id}`,
  levels: [
    {
      id: 'basic',
      name: 'Basic',
      words: [
        {
          word: 'test',
          definition: 'A test word',
          fillInBlank: 'This is a _____ sentence',
        },
      ],
    },
  ],
});

// Re-export everything from testing library
export * from '@testing-library/react-native';
