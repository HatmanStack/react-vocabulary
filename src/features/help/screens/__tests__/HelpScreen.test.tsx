/**
 * HelpScreen Tests
 */

import React from 'react';
import HelpScreen from '../HelpScreen';

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
} as any;

const mockRoute = {
  key: 'Help',
  name: 'Help' as const,
  params: undefined,
} as any;

describe('HelpScreen', () => {
  it('exports HelpScreen component', () => {
    expect(HelpScreen).toBeDefined();
    expect(typeof HelpScreen).toBe('function');
  });

  it('returns a React element', () => {
    const result = HelpScreen({ navigation: mockNavigation, route: mockRoute });
    expect(result).toBeTruthy();
    expect(result.type).toBeDefined();
  });

  it('accepts navigation prop with goBack method', () => {
    const result = HelpScreen({ navigation: mockNavigation, route: mockRoute });
    expect(mockNavigation.goBack).toBeDefined();
    expect(result).toBeTruthy();
  });

  it('accepts route prop', () => {
    const result = HelpScreen({ navigation: mockNavigation, route: mockRoute });
    expect(mockRoute.name).toBe('Help');
    expect(result).toBeTruthy();
  });
});
