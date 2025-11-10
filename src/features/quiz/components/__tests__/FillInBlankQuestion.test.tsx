/**
 * FillInBlankQuestion Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { FillInBlankQuestion } from '../FillInBlankQuestion';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('FillInBlankQuestion', () => {
  const mockOnSubmit = jest.fn();
  const mockOnHint = jest.fn();
  const testSentence = 'Timmy was _____ after falling off the jungle gym';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the fill-in-blank sentence', () => {
    const { getByText } = renderWithProvider(
      <FillInBlankQuestion
        sentence={testSentence}
        onSubmitAnswer={mockOnSubmit}
        onUseHint={mockOnHint}
      />
    );

    expect(getByText(/Timmy was/i)).toBeTruthy();
  });

  it('renders text input for answer', () => {
    const { getByPlaceholderText } = renderWithProvider(
      <FillInBlankQuestion
        sentence={testSentence}
        onSubmitAnswer={mockOnSubmit}
        onUseHint={mockOnHint}
      />
    );

    expect(getByPlaceholderText(/answer/i)).toBeTruthy();
  });

  it('renders submit button', () => {
    const { getByText } = renderWithProvider(
      <FillInBlankQuestion
        sentence={testSentence}
        onSubmitAnswer={mockOnSubmit}
        onUseHint={mockOnHint}
      />
    );

    expect(getByText(/Submit/i)).toBeTruthy();
  });

  it('renders hint button', () => {
    const { getByText } = renderWithProvider(
      <FillInBlankQuestion
        sentence={testSentence}
        onSubmitAnswer={mockOnSubmit}
        onUseHint={mockOnHint}
      />
    );

    expect(getByText(/Hint/i)).toBeTruthy();
  });

  it('does not call onSubmit when input is empty', () => {
    const { getByText } = renderWithProvider(
      <FillInBlankQuestion
        sentence={testSentence}
        onSubmitAnswer={mockOnSubmit}
        onUseHint={mockOnHint}
      />
    );

    const submitButton = getByText(/Submit/i);
    fireEvent.press(submitButton);

    // Should not call onSubmit with empty input
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit when input has text', () => {
    const { getByPlaceholderText, getByText } = renderWithProvider(
      <FillInBlankQuestion
        sentence={testSentence}
        onSubmitAnswer={mockOnSubmit}
        onUseHint={mockOnHint}
      />
    );

    const input = getByPlaceholderText(/answer/i);
    fireEvent.changeText(input, 'abject');

    const submitButton = getByText(/Submit/i);
    fireEvent.press(submitButton);

    // Should call onSubmit with the text
    expect(mockOnSubmit).toHaveBeenCalledWith('abject');
  });

  it('calls onSubmitAnswer when submit is pressed with trimmed text', () => {
    const { getByPlaceholderText, getByText } = renderWithProvider(
      <FillInBlankQuestion
        sentence={testSentence}
        onSubmitAnswer={mockOnSubmit}
        onUseHint={mockOnHint}
      />
    );

    const input = getByPlaceholderText(/answer/i);
    fireEvent.changeText(input, '  abject  ');

    const submitButton = getByText(/Submit/i);
    fireEvent.press(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('abject');
  });

  it('calls onUseHint when hint button is pressed', () => {
    const { getByText } = renderWithProvider(
      <FillInBlankQuestion
        sentence={testSentence}
        onSubmitAnswer={mockOnSubmit}
        onUseHint={mockOnHint}
      />
    );

    const hintButton = getByText(/Hint/i);
    fireEvent.press(hintButton);

    expect(mockOnHint).toHaveBeenCalled();
  });

  it('accepts text input changes', () => {
    const { getByPlaceholderText } = renderWithProvider(
      <FillInBlankQuestion
        sentence={testSentence}
        onSubmitAnswer={mockOnSubmit}
        onUseHint={mockOnHint}
      />
    );

    const input = getByPlaceholderText(/answer/i);
    fireEvent.changeText(input, 'abject');

    // Input should have the value
    expect(input.props.value).toBe('abject');
  });
});
