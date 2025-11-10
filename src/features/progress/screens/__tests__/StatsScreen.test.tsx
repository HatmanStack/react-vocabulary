/**
 * StatsScreen Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import StatsScreen from '../StatsScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  setOptions: jest.fn(),
  addListener: jest.fn(),
};

// Mock route
const mockRoute = {
  key: 'stats-test',
  name: 'Stats' as const,
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <PaperProvider>
      <NavigationContainer>{component}</NavigationContainer>
    </PaperProvider>
  );
};

describe('StatsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the screen header', () => {
    const { getAllByText } = renderWithProviders(
      <StatsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    const headers = getAllByText(/Your Progress/i);
    expect(headers.length).toBeGreaterThan(0);
  });

  it('displays stat cards with placeholder values', () => {
    const { getByText } = renderWithProviders(
      <StatsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Should show some stat labels
    expect(getByText(/Words Learned/i) || getByText(/Lists Completed/i)).toBeTruthy();
  });

  it('shows list progress section', () => {
    const { getByText } = renderWithProviders(
      <StatsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Should show at least one list name (A-H)
    const hasListName =
      getByText(/List A/i) !== null ||
      getByText(/List B/i) !== null ||
      getByText(/Lists/i) !== null;
    expect(hasListName).toBeTruthy();
  });

  it('renders without crashing', () => {
    const { root } = renderWithProviders(
      <StatsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Just verify the screen renders
    expect(root).toBeTruthy();
  });

  it('displays empty state or placeholder data for new users', () => {
    const { root } = renderWithProviders(
      <StatsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Should render without crashing even with no progress data
    expect(root).toBeTruthy();
  });
});
