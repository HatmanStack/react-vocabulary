import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import HomeScreen from '../HomeScreen';

// Mock the vocabulary loader
jest.mock('../../utils/vocabularyLoader', () => ({
  loadVocabularyLists: jest.fn(() => [
    {
      id: 'list-a',
      name: 'List A',
      description: 'Test list A',
      levels: [
        {
          id: 'basic',
          name: 'Basic',
          words: Array(8).fill({ word: 'test', definition: 'test def' }),
        },
      ],
    },
    {
      id: 'list-b',
      name: 'List B',
      description: 'Test list B',
      levels: [
        {
          id: 'basic',
          name: 'Basic',
          words: Array(8).fill({ word: 'test', definition: 'test def' }),
        },
      ],
    },
  ]),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
};

const mockRoute = {
  key: 'test',
  name: 'Home' as const,
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <PaperProvider>
      <NavigationContainer>{component}</NavigationContainer>
    </PaperProvider>
  );
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the screen title', () => {
    const { getByText } = renderWithProviders(
      <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    expect(getByText('Choose a List')).toBeTruthy();
  });

  it('renders vocabulary lists', () => {
    const { getByText } = renderWithProviders(
      <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    expect(getByText('List A')).toBeTruthy();
    expect(getByText('List B')).toBeTruthy();
  });

  it('navigates to Stats when stats button is pressed', () => {
    const { getByLabelText } = renderWithProviders(
      <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    const statsButton = getByLabelText('View Statistics');
    fireEvent.press(statsButton);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Stats');
  });

  it('navigates to Settings when settings button is pressed', () => {
    const { getByLabelText } = renderWithProviders(
      <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    const settingsButton = getByLabelText('Open Settings');
    fireEvent.press(settingsButton);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Settings');
  });
});
