/**
 * GraduationScreen Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import GraduationScreen from '../GraduationScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
};

// Mock route with stats
const mockRoute = {
  key: 'graduation-test',
  name: 'Graduation' as const,
  params: {
    listId: 'list-a',
    levelId: 'basic',
    stats: {
      hints: 3,
      wrong: 2,
      bestHints: 1,
      bestWrong: 0,
    },
  },
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <PaperProvider>
      <NavigationContainer>{component}</NavigationContainer>
    </PaperProvider>
  );
};

describe('GraduationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays congratulations message', () => {
    const { getByText } = renderWithProviders(
      <GraduationScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    expect(getByText(/Congratulations/i)).toBeTruthy();
  });

  it('shows current session stats from route params', () => {
    const { getByText } = renderWithProviders(
      <GraduationScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    expect(getByText(/3/)).toBeTruthy(); // hints
    expect(getByText(/2/)).toBeTruthy(); // wrong
  });

  it('renders Try Again button', () => {
    const { getByText } = renderWithProviders(
      <GraduationScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    expect(getByText(/Try Again/i)).toBeTruthy();
  });

  it('renders Choose Another Level button', () => {
    const { getByText } = renderWithProviders(
      <GraduationScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    expect(getByText(/Choose Another Level/i)).toBeTruthy();
  });

  it('renders Back to Home button', () => {
    const { getByText } = renderWithProviders(
      <GraduationScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    expect(getByText(/Back to Home/i)).toBeTruthy();
  });

  it('navigates to QuizScreen when Try Again is pressed', () => {
    const { getByText } = renderWithProviders(
      <GraduationScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    const tryAgainButton = getByText(/Try Again/i);
    fireEvent.press(tryAgainButton);

    expect(mockNavigate).toHaveBeenCalledWith('Quiz', {
      listId: 'list-a',
      levelId: 'basic',
    });
  });

  it('navigates to DifficultyScreen when Choose Another Level is pressed', () => {
    const { getByText } = renderWithProviders(
      <GraduationScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    const chooseButton = getByText(/Choose Another Level/i);
    fireEvent.press(chooseButton);

    expect(mockNavigate).toHaveBeenCalledWith('Difficulty', {
      listId: 'list-a',
    });
  });

  it('navigates to HomeScreen when Back to Home is pressed', () => {
    const { getByText } = renderWithProviders(
      <GraduationScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    const homeButton = getByText(/Back to Home/i);
    fireEvent.press(homeButton);

    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('handles missing stats with defaults', () => {
    const routeWithoutStats = {
      ...mockRoute,
      params: {
        listId: 'list-a',
        levelId: 'basic',
      },
    };

    const { getByText } = renderWithProviders(
      <GraduationScreen navigation={mockNavigation as any} route={routeWithoutStats as any} />
    );

    // Should still render without crashing
    expect(getByText(/Congratulations/i)).toBeTruthy();
  });
});
