/**
 * LoginPrompt Component Tests
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { LoginPrompt } from '../LoginPrompt';
import { useProgressStore } from '@/shared/store/progressStore';

// Mock the progress store
jest.mock('@/shared/store/progressStore', () => ({
  useProgressStore: jest.fn(),
}));

const mockUseProgressStore = useProgressStore as jest.MockedFunction<typeof useProgressStore>;

describe('LoginPrompt', () => {
  const mockOnComplete = jest.fn();
  const mockOnSkip = jest.fn();
  const mockSetUsername = jest.fn();
  const mockCheckUsernameExists = jest.fn();
  const mockFullSync = jest.fn();
  const mockSyncToCloud = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseProgressStore.mockReturnValue({
      setUsername: mockSetUsername,
      checkUsernameExists: mockCheckUsernameExists,
      fullSync: mockFullSync,
      syncToCloud: mockSyncToCloud,
    } as any);
  });

  const renderComponent = (props = {}) => {
    return render(
      <PaperProvider>
        <LoginPrompt onComplete={mockOnComplete} onSkip={mockOnSkip} {...props} />
      </PaperProvider>
    );
  };

  describe('rendering', () => {
    it('renders username input', () => {
      const { getByPlaceholderText } = renderComponent();
      expect(getByPlaceholderText('Enter username')).toBeTruthy();
    });

    it('renders Continue button', () => {
      const { getByText } = renderComponent();
      expect(getByText('Continue')).toBeTruthy();
    });

    it('renders Skip button when onSkip is provided', () => {
      const { getByText } = renderComponent();
      expect(getByText('Skip for now')).toBeTruthy();
    });

    it('does not render Skip button when onSkip is not provided', () => {
      const { queryByText } = renderComponent({ onSkip: undefined });
      expect(queryByText('Skip for now')).toBeNull();
    });
  });

  describe('validation', () => {
    it('does not call API for username less than 3 characters', async () => {
      const { getByPlaceholderText, getByText } = renderComponent();

      const input = getByPlaceholderText('Enter username');
      fireEvent.changeText(input, 'ab');

      // Press Continue (may be disabled, but try anyway)
      const continueButton = getByText('Continue');
      fireEvent.press(continueButton);

      // API should not be called for invalid username
      expect(mockCheckUsernameExists).not.toHaveBeenCalled();
    });

    it('does not call API for invalid characters', async () => {
      const { getByPlaceholderText, getByText } = renderComponent();

      const input = getByPlaceholderText('Enter username');
      fireEvent.changeText(input, 'user@name');

      // Press Continue
      const continueButton = getByText('Continue');
      fireEvent.press(continueButton);

      // API should not be called for invalid username
      expect(mockCheckUsernameExists).not.toHaveBeenCalled();
    });

    it('converts username to lowercase', () => {
      const { getByPlaceholderText } = renderComponent();

      const input = getByPlaceholderText('Enter username');
      fireEvent.changeText(input, 'TestUser');

      expect(input.props.value).toBe('testuser');
    });
  });

  describe('new username flow', () => {
    it('creates new user when username does not exist', async () => {
      mockCheckUsernameExists.mockResolvedValue(false);
      mockSetUsername.mockResolvedValue(undefined);
      mockSyncToCloud.mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText } = renderComponent();

      const input = getByPlaceholderText('Enter username');
      fireEvent.changeText(input, 'newuser');

      const continueButton = getByText('Continue');
      await act(async () => {
        fireEvent.press(continueButton);
      });

      await waitFor(() => {
        expect(mockCheckUsernameExists).toHaveBeenCalledWith('newuser');
        expect(mockSetUsername).toHaveBeenCalledWith('newuser');
        expect(mockSyncToCloud).toHaveBeenCalled();
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });
  });

  describe('existing username flow', () => {
    it('shows confirmation dialog when username exists', async () => {
      mockCheckUsernameExists.mockResolvedValue(true);

      const { getByPlaceholderText, getByText } = renderComponent();

      const input = getByPlaceholderText('Enter username');
      fireEvent.changeText(input, 'existinguser');

      const continueButton = getByText('Continue');
      await act(async () => {
        fireEvent.press(continueButton);
      });

      await waitFor(() => {
        expect(getByText('Username Taken')).toBeTruthy();
        expect(getByText("Yes, that's me")).toBeTruthy();
        expect(getByText('No, try different name')).toBeTruthy();
      });
    });

    it('syncs existing user when confirmed', async () => {
      mockCheckUsernameExists.mockResolvedValue(true);
      mockSetUsername.mockResolvedValue(undefined);
      mockFullSync.mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText } = renderComponent();

      const input = getByPlaceholderText('Enter username');
      fireEvent.changeText(input, 'existinguser');

      const continueButton = getByText('Continue');
      await act(async () => {
        fireEvent.press(continueButton);
      });

      await waitFor(() => {
        expect(getByText("Yes, that's me")).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText("Yes, that's me"));
      });

      await waitFor(() => {
        expect(mockSetUsername).toHaveBeenCalledWith('existinguser');
        expect(mockFullSync).toHaveBeenCalled();
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('clears input when user says no', async () => {
      mockCheckUsernameExists.mockResolvedValue(true);

      const { getByPlaceholderText, getByText } = renderComponent();

      const input = getByPlaceholderText('Enter username');
      fireEvent.changeText(input, 'existinguser');

      await act(async () => {
        fireEvent.press(getByText('Continue'));
      });

      await waitFor(() => {
        expect(getByText('No, try different name')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText('No, try different name'));
      });

      await waitFor(() => {
        expect(input.props.value).toBe('');
        expect(getByText('Please try a different username')).toBeTruthy();
      });
    });
  });

  describe('skip functionality', () => {
    it('calls onSkip when skip button is pressed', () => {
      const { getByText } = renderComponent();

      fireEvent.press(getByText('Skip for now'));

      expect(mockOnSkip).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('shows error when API call fails', async () => {
      mockCheckUsernameExists.mockRejectedValue(new Error('Network error'));

      const { getByPlaceholderText, getByText } = renderComponent();

      const input = getByPlaceholderText('Enter username');
      fireEvent.changeText(input, 'validuser');

      await act(async () => {
        fireEvent.press(getByText('Continue'));
      });

      await waitFor(() => {
        expect(getByText('Failed to connect to server. Please try again.')).toBeTruthy();
      });
    });
  });
});
