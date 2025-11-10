/**
 * App Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';
import { useProgressStore } from '@/shared/store/progressStore';

// Mock storage
jest.mock('@/shared/lib/storage', () => ({
  initializeStorage: jest.fn(() => Promise.resolve()),
  STORAGE_KEYS: {
    USER_PROGRESS: 'vocabulary-progress',
    SETTINGS: 'vocabulary-settings',
    VERSION: 'vocabulary-version',
    LAST_SYNC: 'vocabulary-last-sync',
  },
}));

// Mock navigation component
jest.mock('../navigation', () => {
  const { View, Text } = require('react-native');
  return function Navigation() {
    return (
      <View testID="navigation">
        <Text>Navigation</Text>
      </View>
    );
  };
});

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure progress store is hydrated for tests
    useProgressStore.setState({ _hydrated: true });
  });

  it('exports App component', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });

  it('renders Providers wrapper', () => {
    const { root } = render(<App />);
    expect(root).toBeTruthy();
  });
});
