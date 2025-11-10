/**
 * Storage Utility Tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_KEYS,
  getItem,
  setItem,
  removeItem,
  clear,
  getAllKeys,
  multiGet,
  multiSet,
  getVersion,
  setVersion,
  migrate,
  initializeStorage,
} from '../storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
}));

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console errors in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('STORAGE_KEYS', () => {
    it('exports storage keys constants', () => {
      expect(STORAGE_KEYS.USER_PROGRESS).toBe('vocabulary-progress');
      expect(STORAGE_KEYS.SETTINGS).toBe('vocabulary-settings');
      expect(STORAGE_KEYS.VERSION).toBe('vocabulary-version');
      expect(STORAGE_KEYS.LAST_SYNC).toBe('vocabulary-last-sync');
    });
  });

  describe('getItem', () => {
    it('retrieves and parses JSON value', async () => {
      const mockData = { test: 'value' };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      const result = await getItem('test-key');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(mockData);
    });

    it('returns null when item does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getItem('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await getItem('error-key');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('setItem', () => {
    it('stringifies and stores value', async () => {
      const mockData = { test: 'value' };
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await setItem('test-key', mockData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(mockData));
    });

    it('throws error on storage failure', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(setItem('error-key', 'value')).rejects.toThrow('Storage error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('removes item from storage', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await removeItem('test-key');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('throws error on removal failure', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Remove error'));

      await expect(removeItem('error-key')).rejects.toThrow('Remove error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('clears all storage', async () => {
      (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);

      await clear();

      expect(AsyncStorage.clear).toHaveBeenCalled();
    });

    it('throws error on clear failure', async () => {
      (AsyncStorage.clear as jest.Mock).mockRejectedValue(new Error('Clear error'));

      await expect(clear()).rejects.toThrow('Clear error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getAllKeys', () => {
    it('returns all storage keys', async () => {
      const mockKeys = ['key1', 'key2', 'key3'];
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys);

      const result = await getAllKeys();

      expect(AsyncStorage.getAllKeys).toHaveBeenCalled();
      expect(result).toEqual(mockKeys);
    });

    it('returns empty array on error', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValue(new Error('Keys error'));

      const result = await getAllKeys();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('multiGet', () => {
    it('retrieves multiple items', async () => {
      const mockPairs: [string, string | null][] = [
        ['key1', JSON.stringify({ value: 1 })],
        ['key2', JSON.stringify({ value: 2 })],
      ];
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue(mockPairs);

      const result = await multiGet<{ value: number }>(['key1', 'key2']);

      expect(AsyncStorage.multiGet).toHaveBeenCalledWith(['key1', 'key2']);
      expect(result).toEqual({
        key1: { value: 1 },
        key2: { value: 2 },
      });
    });

    it('handles null values', async () => {
      const mockPairs: [string, string | null][] = [
        ['key1', JSON.stringify({ value: 1 })],
        ['key2', null],
      ];
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue(mockPairs);

      const result = await multiGet(['key1', 'key2']);

      expect(result).toEqual({
        key1: { value: 1 },
        key2: null,
      });
    });

    it('handles parse errors gracefully', async () => {
      const mockPairs: [string, string | null][] = [
        ['key1', 'invalid json'],
      ];
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue(mockPairs);

      const result = await multiGet(['key1']);

      expect(result).toEqual({
        key1: null,
      });
    });

    it('returns empty object on error', async () => {
      (AsyncStorage.multiGet as jest.Mock).mockRejectedValue(new Error('MultiGet error'));

      const result = await multiGet(['key1', 'key2']);

      expect(result).toEqual({});
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('multiSet', () => {
    it('stores multiple items', async () => {
      (AsyncStorage.multiSet as jest.Mock).mockResolvedValue(undefined);

      const items = {
        key1: { value: 1 },
        key2: { value: 2 },
      };

      await multiSet(items);

      expect(AsyncStorage.multiSet).toHaveBeenCalledWith([
        ['key1', JSON.stringify({ value: 1 })],
        ['key2', JSON.stringify({ value: 2 })],
      ]);
    });

    it('throws error on storage failure', async () => {
      (AsyncStorage.multiSet as jest.Mock).mockRejectedValue(new Error('MultiSet error'));

      await expect(multiSet({ key1: 'value' })).rejects.toThrow('MultiSet error');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getVersion', () => {
    it('returns stored version', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify('1.0.0'));

      const result = await getVersion();

      expect(result).toBe('1.0.0');
    });

    it('returns current version when not stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getVersion();

      expect(result).toBe('1.0.0');
    });
  });

  describe('setVersion', () => {
    it('stores version', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await setVersion('1.1.0');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.VERSION,
        JSON.stringify('1.1.0')
      );
    });
  });

  describe('migrate', () => {
    it('performs migration and sets new version', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await migrate('1.0.0', '1.1.0');

      expect(console.log).toHaveBeenCalledWith('Migrating storage from 1.0.0 to 1.1.0');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.VERSION,
        JSON.stringify('1.1.0')
      );
    });
  });

  describe('initializeStorage', () => {
    it('initializes storage without migration when versions match', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify('1.0.0'));

      await initializeStorage();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.VERSION);
      // Should not call setItem when versions match
    });

    it('performs migration when versions differ', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify('0.9.0'));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await initializeStorage();

      expect(console.log).toHaveBeenCalledWith('Migrating storage from 0.9.0 to 1.0.0');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('handles initialization errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Init error'));

      await initializeStorage();

      // Error is logged by getItem, not initializeStorage
      expect(console.error).toHaveBeenCalledWith(
        'Error getting item vocabulary-version from storage:',
        expect.any(Error)
      );
    });
  });
});
