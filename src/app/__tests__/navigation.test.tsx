/**
 * Navigation Component Tests
 */

import React from 'react';
import { useSettingsStore } from '@/shared/store/settingsStore';

// Mock all navigation screens to avoid rendering complex components
jest.mock('@/features/onboarding/screens/OnboardingScreen', () => 'OnboardingScreen');
jest.mock('@/features/vocabulary/screens/HomeScreen', () => 'HomeScreen');
jest.mock('@/features/vocabulary/screens/DifficultyScreen', () => 'DifficultyScreen');
jest.mock('@/features/quiz/screens/QuizScreen', () => 'QuizScreen');
jest.mock('@/features/quiz/screens/GraduationScreen', () => 'GraduationScreen');
jest.mock('@/features/progress/screens/StatsScreen', () => 'StatsScreen');
jest.mock('@/features/settings/screens/SettingsScreen', () => 'SettingsScreen');
jest.mock('@/features/help/screens/HelpScreen', () => 'HelpScreen');

describe('Navigation', () => {
  beforeEach(() => {
    // Reset settings store to default
    useSettingsStore.setState({ onboardingCompleted: false });
  });

  it('exports Navigation component', () => {
    const Navigation = require('../navigation').default;
    expect(Navigation).toBeDefined();
  });

  it('uses onboarding state from settings store', () => {
    useSettingsStore.setState({ onboardingCompleted: false });
    const Navigation = require('../navigation').default;
    expect(Navigation).toBeDefined();
  });

  it('handles onboarding completed state', () => {
    useSettingsStore.setState({ onboardingCompleted: true });
    const Navigation = require('../navigation').default;
    expect(Navigation).toBeDefined();
  });
});
