/**
 * DifficultyScreen Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import DifficultyScreen from '../DifficultyScreen';

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
  key: 'difficulty-test',
  name: 'Difficulty' as const,
  params: {
    listId: 'list-a',
  },
};

// Mock vocabulary loader
jest.mock('../../utils/vocabularyLoader', () => ({
  getListById: jest.fn((id: string) => ({
    id,
    name: id.toUpperCase().replace('LIST-', 'List '),
    description: `Test description for ${id}`,
    levels: [
      {
        id: 'basic',
        name: 'Basic',
        words: new Array(8).fill({ word: 'test', definition: 'test def' }),
      },
      {
        id: 'intermediate',
        name: 'Intermediate',
        words: new Array(8).fill({ word: 'test', definition: 'test def' }),
      },
      {
        id: 'advanced',
        name: 'Advanced',
        words: new Array(8).fill({ word: 'test', definition: 'test def' }),
      },
      {
        id: 'expert',
        name: 'Expert',
        words: new Array(8).fill({ word: 'test', definition: 'test def' }),
      },
      {
        id: 'professional',
        name: 'Professional',
        words: new Array(8).fill({ word: 'test', definition: 'test def' }),
      },
    ],
  })),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <PaperProvider>
      <NavigationContainer>{component}</NavigationContainer>
    </PaperProvider>
  );
};

describe('DifficultyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the list name from route params', () => {
    const { getByText } = renderWithProviders(
      <DifficultyScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    expect(getByText(/List A/i)).toBeTruthy();
  });

  it('displays all 5 difficulty levels', () => {
    const { getByText } = renderWithProviders(
      <DifficultyScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    expect(getByText('Basic')).toBeTruthy();
    expect(getByText('Intermediate')).toBeTruthy();
    expect(getByText('Advanced')).toBeTruthy();
    expect(getByText('Expert')).toBeTruthy();
    expect(getByText('Professional')).toBeTruthy();
  });

  it('shows word count for each level', () => {
    const { getAllByText } = renderWithProviders(
      <DifficultyScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    const wordCounts = getAllByText(/8 words/i);
    expect(wordCounts.length).toBeGreaterThan(0);
  });

  it('navigates to QuizScreen when a level is selected', () => {
    const { getByText } = renderWithProviders(
      <DifficultyScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    const basicButton = getByText('Basic');
    fireEvent.press(basicButton);

    expect(mockNavigate).toHaveBeenCalledWith('Quiz', {
      listId: 'list-a',
      levelId: 'basic',
    });
  });

  it('renders without crashing and displays content', () => {
    const { getByText } = renderWithProviders(
      <DifficultyScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Just verify the screen renders successfully
    expect(getByText('Basic')).toBeTruthy();
  });
});
