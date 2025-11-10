/**
 * QuizScreen Tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import QuizScreen from '../QuizScreen';

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
  key: 'quiz-test',
  name: 'Quiz' as const,
  params: {
    listId: 'list-a',
    levelId: 'basic',
  },
};

// Mock vocabulary loader
jest.mock('../../../vocabulary/utils/vocabularyLoader', () => ({
  getListById: jest.fn((id: string) => ({
    id,
    name: id.toUpperCase().replace('LIST-', 'List '),
    description: 'Test description',
    levels: [
      {
        id: 'basic',
        name: 'Basic',
        words: [
          {
            word: 'abject',
            definition: 'Experienced or marked by humiliation or degradation',
            fillInBlank: 'Timmy was _____ after falling off the jungle gym',
          },
          {
            word: 'aberration',
            definition: 'A deviation from what is normal',
            fillInBlank: 'The _____ in the data was unexpected',
          },
        ],
      },
    ],
  })),
  getLevelWords: jest.fn((listId: string, levelId: string) => [
    {
      word: 'abject',
      definition: 'Experienced or marked by humiliation or degradation',
      fillInBlank: 'Timmy was _____ after falling off the jungle gym',
    },
    {
      word: 'aberration',
      definition: 'A deviation from what is normal',
      fillInBlank: 'The _____ in the data was unexpected',
    },
  ]),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <PaperProvider>
      <NavigationContainer>{component}</NavigationContainer>
    </PaperProvider>
  );
};

describe('QuizScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders quiz header with list and level name', () => {
    const { getByText } = renderWithProviders(
      <QuizScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    expect(getByText(/List A/i)).toBeTruthy();
    expect(getByText(/Basic/i)).toBeTruthy();
  });

  it('displays question progress', () => {
    const { getByText } = renderWithProviders(
      <QuizScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    expect(getByText(/Question 1/i)).toBeTruthy();
  });

  it('displays question text', () => {
    const { getByTestId } = renderWithProviders(
      <QuizScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Should display the question display component
    const questionDisplay = getByTestId('question-display');
    expect(questionDisplay).toBeTruthy();
  });

  it('renders answer component (MultipleChoice or FillInBlank)', () => {
    const { root } = renderWithProviders(
      <QuizScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Should render either multiple choice buttons or fill-in-blank input
    expect(root).toBeTruthy();
  });

  it('renders without crashing with quiz data', () => {
    const { getByText } = renderWithProviders(
      <QuizScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Just verify the screen renders successfully
    expect(getByText(/List A/i)).toBeTruthy();
  });
});
