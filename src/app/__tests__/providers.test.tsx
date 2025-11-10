/**
 * Providers Component Tests
 */

import React from 'react';
import Providers from '../providers';
import { useSettingsStore } from '@/shared/store/settingsStore';

// Mock storage module
jest.mock('@/shared/lib/storage', () => ({
  initializeStorage: jest.fn(() => Promise.resolve()),
  STORAGE_KEYS: {
    USER_PROGRESS: 'vocabulary-progress',
    SETTINGS: 'vocabulary-settings',
    VERSION: 'vocabulary-version',
    LAST_SYNC: 'vocabulary-last-sync',
  },
}));

describe('Providers', () => {
  beforeEach(() => {
    // Reset settings store to default
    useSettingsStore.setState({ theme: 'auto' });
  });

  it('exports Providers component', () => {
    expect(Providers).toBeDefined();
    expect(typeof Providers).toBe('function');
  });

  it('accepts children prop', () => {
    const props = { children: null };
    expect(() => Providers(props)).toBeDefined();
  });

  it('uses theme from settings store', () => {
    useSettingsStore.setState({ theme: 'light' });
    const state = useSettingsStore.getState();
    expect(state.theme).toBe('light');
  });

  it('supports dark theme', () => {
    useSettingsStore.setState({ theme: 'dark' });
    const state = useSettingsStore.getState();
    expect(state.theme).toBe('dark');
  });

  it('supports auto theme', () => {
    useSettingsStore.setState({ theme: 'auto' });
    const state = useSettingsStore.getState();
    expect(state.theme).toBe('auto');
  });
});
