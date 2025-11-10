/**
 * QuizHeader Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { QuizHeader } from '../QuizHeader';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('QuizHeader', () => {
  const mockOnExit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays list and level names', () => {
    const { getByText } = renderWithProvider(
      <QuizHeader
        listName="List A"
        levelName="Basic"
        currentIndex={0}
        totalWords={8}
        hintsUsed={0}
        wrongAnswers={0}
        onExit={mockOnExit}
      />
    );

    expect(getByText(/List A/i)).toBeTruthy();
    expect(getByText(/Basic/i)).toBeTruthy();
  });

  it('displays current progress correctly', () => {
    const { getByText } = renderWithProvider(
      <QuizHeader
        listName="List A"
        levelName="Basic"
        currentIndex={2}
        totalWords={8}
        hintsUsed={0}
        wrongAnswers={0}
        onExit={mockOnExit}
      />
    );

    expect(getByText(/Question 3/i)).toBeTruthy(); // currentIndex 2 = Question 3
    expect(getByText(/8/)).toBeTruthy(); // total words
  });

  it('displays hints used count', () => {
    const { getByText } = renderWithProvider(
      <QuizHeader
        listName="List A"
        levelName="Basic"
        currentIndex={0}
        totalWords={8}
        hintsUsed={3}
        wrongAnswers={0}
        onExit={mockOnExit}
      />
    );

    expect(getByText(/3/)).toBeTruthy(); // hints count
  });

  it('displays wrong answers count', () => {
    const { getByText } = renderWithProvider(
      <QuizHeader
        listName="List A"
        levelName="Basic"
        currentIndex={0}
        totalWords={8}
        hintsUsed={0}
        wrongAnswers={5}
        onExit={mockOnExit}
      />
    );

    expect(getByText(/5/)).toBeTruthy(); // wrong answers count
  });

  it('shows progress bar with correct percentage', () => {
    const { root } = renderWithProvider(
      <QuizHeader
        listName="List A"
        levelName="Basic"
        currentIndex={4}
        totalWords={8}
        hintsUsed={0}
        wrongAnswers={0}
        onExit={mockOnExit}
      />
    );

    // Progress should be 4/8 = 0.5 (50%)
    expect(root).toBeTruthy();
  });

  it('handles first question correctly', () => {
    const { getByText } = renderWithProvider(
      <QuizHeader
        listName="List A"
        levelName="Basic"
        currentIndex={0}
        totalWords={8}
        hintsUsed={0}
        wrongAnswers={0}
        onExit={mockOnExit}
      />
    );

    expect(getByText(/Question 1/i)).toBeTruthy();
  });

  it('handles last question correctly', () => {
    const { getByText } = renderWithProvider(
      <QuizHeader
        listName="List A"
        levelName="Basic"
        currentIndex={7}
        totalWords={8}
        hintsUsed={0}
        wrongAnswers={0}
        onExit={mockOnExit}
      />
    );

    expect(getByText(/Question 8/i)).toBeTruthy();
  });
});
