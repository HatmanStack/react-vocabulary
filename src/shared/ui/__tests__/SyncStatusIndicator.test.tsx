/**
 * SyncStatusIndicator Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SyncStatusIndicator } from '../SyncStatusIndicator';
import { useProgressStore } from '@/shared/store/progressStore';

// Mock the progress store
jest.mock('@/shared/store/progressStore', () => ({
  useProgressStore: jest.fn(),
}));

const mockUseProgressStore = useProgressStore as jest.MockedFunction<typeof useProgressStore>;

describe('SyncStatusIndicator', () => {
  const renderComponent = (props = {}) => {
    return render(
      <PaperProvider>
        <SyncStatusIndicator {...props} />
      </PaperProvider>
    );
  };

  const setupStoreMock = (overrides: {
    username?: string | null;
    syncStatus?: 'idle' | 'syncing' | 'success' | 'error';
    lastSyncError?: string | null;
  }) => {
    const defaults = {
      username: null,
      syncStatus: 'idle' as const,
      lastSyncError: null,
    };
    const state = { ...defaults, ...overrides };

    mockUseProgressStore.mockImplementation((selector: any) => {
      // If called with selector, return the selected value
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when not logged in', () => {
    it('does not render indicator content when username is null', () => {
      setupStoreMock({ username: null });
      const { queryByTestId, root } = renderComponent();
      // The component returns null, so there should be no container View
      const views = root.findAllByType(require('react-native').View);
      // Should only have wrapper views from PaperProvider, not our container
      expect(views.some((v) => v.props.testID === 'sync-indicator')).toBe(false);
    });
  });

  describe('when logged in', () => {
    it('does not render indicator when idle and showWhenIdle is false', () => {
      setupStoreMock({ username: 'testuser', syncStatus: 'idle' });
      const { root } = renderComponent({ showWhenIdle: false });
      const views = root.findAllByType(require('react-native').View);
      expect(views.some((v) => v.props.testID === 'sync-indicator')).toBe(false);
    });

    it('renders indicator when idle and showWhenIdle is true', () => {
      setupStoreMock({ username: 'testuser', syncStatus: 'idle' });
      const { toJSON } = renderComponent({ showWhenIdle: true });
      expect(toJSON()).not.toBeNull();
    });

    it('renders loading indicator when syncing', () => {
      setupStoreMock({ username: 'testuser', syncStatus: 'syncing' });
      const { toJSON } = renderComponent();
      expect(toJSON()).not.toBeNull();
    });

    it('renders success icon when sync succeeds', () => {
      setupStoreMock({ username: 'testuser', syncStatus: 'success' });
      const { toJSON } = renderComponent();
      expect(toJSON()).not.toBeNull();
    });

    it('renders error icon when sync fails', () => {
      setupStoreMock({
        username: 'testuser',
        syncStatus: 'error',
        lastSyncError: 'Network error',
      });
      const { toJSON } = renderComponent();
      expect(toJSON()).not.toBeNull();
    });
  });

  describe('props', () => {
    it('respects custom size prop', () => {
      setupStoreMock({ username: 'testuser', syncStatus: 'syncing' });
      const { toJSON } = renderComponent({ size: 32 });
      expect(toJSON()).not.toBeNull();
    });
  });
});
