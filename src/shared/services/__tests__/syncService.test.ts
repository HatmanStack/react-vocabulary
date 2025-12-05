/**
 * Sync Service Tests
 *
 * Tests for the API client that communicates with the backend sync endpoint.
 */

import type { UserProgress } from '@/shared/types';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Store original env value
const originalApiUrl = process.env.EXPO_PUBLIC_SYNC_API_URL;

// Mock progress data for testing
const mockProgress: UserProgress = {
  currentListId: 'list1',
  currentLevelId: 'level1',
  listLevelProgress: {},
  globalStats: {
    allTimeHints: 10,
    allTimeWrong: 5,
    allTimeCorrect: 50,
    totalWordsLearned: 25,
    listsCompleted: ['list1'],
  },
  achievements: [],
  dailyProgress: { '2024-01-15': 5 },
};

describe('syncService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    jest.clearAllMocks();
    // Set API URL for tests that need it
    process.env.EXPO_PUBLIC_SYNC_API_URL = 'https://test-api.example.com/progress';
  });

  afterAll(() => {
    // Restore original env
    process.env.EXPO_PUBLIC_SYNC_API_URL = originalApiUrl;
  });

  describe('with API configured', () => {
    // Import fresh module for each describe block to pick up env changes
    let checkUsername: typeof import('../syncService').checkUsername;
    let getProgress: typeof import('../syncService').getProgress;
    let saveProgress: typeof import('../syncService').saveProgress;
    let SyncError: typeof import('../syncService').SyncError;
    let isApiConfigured: typeof import('../syncService').isApiConfigured;

    beforeEach(() => {
      jest.resetModules();
      process.env.EXPO_PUBLIC_SYNC_API_URL = 'https://test-api.example.com/progress';
      const syncService = require('../syncService');
      checkUsername = syncService.checkUsername;
      getProgress = syncService.getProgress;
      saveProgress = syncService.saveProgress;
      SyncError = syncService.SyncError;
      isApiConfigured = syncService.isApiConfigured;
    });

    describe('isApiConfigured', () => {
      it('returns true when API URL is configured', () => {
        expect(isApiConfigured()).toBe(true);
      });
    });

    describe('checkUsername', () => {
      it('returns { exists: true } when username exists', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ exists: true }),
        });

        const result = await checkUsername('testuser');

        expect(result).toEqual({ exists: true });
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-api.example.com/progress',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check-username', username: 'testuser' }),
          })
        );
      });

      it('returns { exists: false } when username does not exist', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ exists: false }),
        });

        const result = await checkUsername('newuser');

        expect(result).toEqual({ exists: false });
      });

      it('throws SyncError on 400 response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () =>
            Promise.resolve({ error: 'Invalid username format', code: 'INVALID_USERNAME' }),
        });

        await expect(checkUsername('bad@user')).rejects.toThrow(SyncError);
      });

      it('throws SyncError with correct code on 400 response', async () => {
        // 400 errors are not retried, so only one mock is needed
        mockFetch.mockResolvedValue({
          ok: false,
          status: 400,
          json: () =>
            Promise.resolve({ error: 'Invalid username format', code: 'INVALID_USERNAME' }),
        });

        try {
          await checkUsername('bad@user');
          fail('Expected SyncError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(SyncError);
          // 400 errors return the code from the response or HTTP_400
          expect(['INVALID_USERNAME', 'HTTP_400']).toContain(
            (error as InstanceType<typeof SyncError>).code
          );
        }
      });

      it('throws SyncError on 500 response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error', code: 'SERVER_ERROR' }),
        });

        await expect(checkUsername('testuser')).rejects.toThrow(SyncError);
      });

      it('throws SyncError on network failure', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

        await expect(checkUsername('testuser')).rejects.toThrow(SyncError);
      });

      it('throws SyncError with NETWORK_ERROR code on network failure', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

        try {
          await checkUsername('testuser');
          fail('Expected SyncError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(SyncError);
          expect((error as InstanceType<typeof SyncError>).code).toBe('NETWORK_ERROR');
        }
      });
    });

    describe('getProgress', () => {
      it('returns progress data when user exists', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              progressData: mockProgress,
              lastSyncedAt: '2024-01-15T10:00:00Z',
            }),
        });

        const result = await getProgress('testuser');

        expect(result).toEqual({
          progressData: mockProgress,
          lastSyncedAt: '2024-01-15T10:00:00Z',
        });
        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-api.example.com/progress',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ action: 'get', username: 'testuser' }),
          })
        );
      });

      it('returns null when user does not exist (404)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'User not found', code: 'USER_NOT_FOUND' }),
        });

        const result = await getProgress('nonexistent');

        expect(result).toBeNull();
      });

      it('throws SyncError on 500 response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error', code: 'SERVER_ERROR' }),
        });

        await expect(getProgress('testuser')).rejects.toThrow(SyncError);
      });
    });

    describe('saveProgress', () => {
      it('saves progress successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              lastSyncedAt: '2024-01-15T10:00:00Z',
            }),
        });

        const result = await saveProgress('testuser', mockProgress);

        expect(result).toEqual({
          success: true,
          lastSyncedAt: '2024-01-15T10:00:00Z',
        });
        expect(mockFetch).toHaveBeenCalledWith(
          'https://test-api.example.com/progress',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              action: 'save',
              username: 'testuser',
              progressData: mockProgress,
            }),
          })
        );
      });

      it('throws SyncError on 400 response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Invalid data', code: 'INVALID_DATA' }),
        });

        await expect(saveProgress('testuser', mockProgress)).rejects.toThrow(SyncError);
      });

      it('throws SyncError on network failure', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

        await expect(saveProgress('testuser', mockProgress)).rejects.toThrow(SyncError);
      });
    });

    describe('SyncError', () => {
      it('creates error with code and message', () => {
        const error = new SyncError('Test error', 'TEST_CODE');

        expect(error.message).toBe('Test error');
        expect(error.code).toBe('TEST_CODE');
        expect(error.name).toBe('SyncError');
      });
    });
  });

  describe('without API configured', () => {
    let checkUsername: typeof import('../syncService').checkUsername;
    let getProgress: typeof import('../syncService').getProgress;
    let saveProgress: typeof import('../syncService').saveProgress;
    let isApiConfigured: typeof import('../syncService').isApiConfigured;

    beforeEach(() => {
      jest.resetModules();
      delete process.env.EXPO_PUBLIC_SYNC_API_URL;
      const syncService = require('../syncService');
      checkUsername = syncService.checkUsername;
      getProgress = syncService.getProgress;
      saveProgress = syncService.saveProgress;
      isApiConfigured = syncService.isApiConfigured;
    });

    it('isApiConfigured returns false', () => {
      expect(isApiConfigured()).toBe(false);
    });

    it('checkUsername returns { exists: false }', async () => {
      const result = await checkUsername('testuser');
      expect(result).toEqual({ exists: false });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('getProgress returns null', async () => {
      const result = await getProgress('testuser');
      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('saveProgress returns failure', async () => {
      const result = await saveProgress('testuser', mockProgress);
      expect(result).toEqual({ success: false, lastSyncedAt: '' });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
