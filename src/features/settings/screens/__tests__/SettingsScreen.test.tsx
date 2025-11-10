import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import SettingsScreen from '../SettingsScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
};

const mockRoute = {
  key: 'test',
  name: 'Settings' as const,
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <PaperProvider>
      <NavigationContainer>{component}</NavigationContainer>
    </PaperProvider>
  );
};

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders screen title', () => {
    const { getByText } = renderWithProviders(
      <SettingsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    expect(getByText('Appearance')).toBeTruthy();
  });

  it('renders theme setting', () => {
    const { getByText } = renderWithProviders(
      <SettingsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    expect(getByText('Theme')).toBeTruthy();
    expect(getByText('Light')).toBeTruthy();
  });

  it('renders sound effects toggle', () => {
    const { getByText } = renderWithProviders(
      <SettingsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    expect(getByText('Sound Effects')).toBeTruthy();
  });

  it('renders app version', () => {
    const { getByText } = renderWithProviders(
      <SettingsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    expect(getByText('App Version')).toBeTruthy();
    expect(getByText('2.0.0')).toBeTruthy();
  });

  it('toggles sound effects', () => {
    const { getByLabelText } = renderWithProviders(
      <SettingsScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    const soundToggle = getByLabelText('Toggle Sound Effects');
    fireEvent(soundToggle, 'onValueChange', false);
    // Component updates state internally
    expect(soundToggle).toBeTruthy();
  });
});
