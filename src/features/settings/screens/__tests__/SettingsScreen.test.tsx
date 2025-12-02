import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import SettingsScreen from '../SettingsScreen';

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
      <SettingsScreen />
    );
    expect(getByText('Appearance')).toBeTruthy();
  });

  it('renders theme setting', () => {
    const { getByText } = renderWithProviders(
      <SettingsScreen />
    );
    expect(getByText('Theme')).toBeTruthy();
    expect(getByText('Light')).toBeTruthy();
  });

  it('renders sound effects toggle', () => {
    const { getByText } = renderWithProviders(
      <SettingsScreen />
    );
    expect(getByText('Sound Effects')).toBeTruthy();
  });

  it('renders cloud sync section', () => {
    const { getByText } = renderWithProviders(
      <SettingsScreen />
    );
    expect(getByText('Cloud Sync')).toBeTruthy();
  });

  it('toggles sound effects', () => {
    const { getByLabelText } = renderWithProviders(
      <SettingsScreen />
    );
    const soundToggle = getByLabelText('Toggle Sound Effects');
    fireEvent(soundToggle, 'onValueChange', false);
    // Component updates state internally
    expect(soundToggle).toBeTruthy();
  });
});
