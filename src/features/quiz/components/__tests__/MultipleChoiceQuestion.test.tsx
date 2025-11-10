import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { MultipleChoiceQuestion } from '../MultipleChoiceQuestion';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('MultipleChoiceQuestion', () => {
  const mockOptions = ['option1', 'option2', 'option3', 'option4'];
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all 4 options', () => {
    const { getByText } = renderWithProvider(
      <MultipleChoiceQuestion options={mockOptions} onSelectAnswer={mockOnSelect} />
    );

    expect(getByText('option1')).toBeTruthy();
    expect(getByText('option2')).toBeTruthy();
    expect(getByText('option3')).toBeTruthy();
    expect(getByText('option4')).toBeTruthy();
  });

  it('calls onSelectAnswer when option is pressed', async () => {
    const { getByText } = renderWithProvider(
      <MultipleChoiceQuestion options={mockOptions} onSelectAnswer={mockOnSelect} />
    );

    fireEvent.press(getByText('option1'));

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith('option1');
    });
  });

  it('disables buttons after selection', async () => {
    const { getByText } = renderWithProvider(
      <MultipleChoiceQuestion options={mockOptions} onSelectAnswer={mockOnSelect} />
    );

    fireEvent.press(getByText('option1'));

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    // Try pressing again
    fireEvent.press(getByText('option2'));

    // Should still only be called once
    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });
  });
});
