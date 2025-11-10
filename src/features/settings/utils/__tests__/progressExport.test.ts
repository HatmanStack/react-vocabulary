/**
 * Progress Export/Import Utilities Tests
 */

import { Platform, Share } from 'react-native';
import { useProgressStore } from '@/shared/store/progressStore';
import {
  exportProgress,
  importProgress,
  applyImportedProgress,
  ProgressExportData,
} from '../progressExport';

// Mock dependencies
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
  Share: {
    share: jest.fn(),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
}));

jest.mock('@/shared/store/progressStore', () => ({
  useProgressStore: {
    getState: jest.fn(),
    setState: jest.fn(),
  },
}));

describe('progressExport', () => {
  const mockProgressData = {
    listLevelProgress: {
      'list-a-basic': {
        listId: 'list-a',
        levelId: 'basic',
        wordProgress: {
          word1: { state: 3, correctCount: 5, wrongCount: 0 },
          word2: { state: 2, correctCount: 2, wrongCount: 1 },
        },
      },
    },
    globalStats: {
      allTimeHints: 10,
      allTimeWrong: 5,
      allTimeCorrect: 50,
      totalWordsLearned: 25,
      listsCompleted: ['list-a'],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('exportProgress', () => {
    beforeEach(() => {
      (useProgressStore.getState as jest.Mock).mockReturnValue(mockProgressData);
    });

    it('exports progress on mobile platform', async () => {
      (Platform as any).OS = 'ios';
      (Share.share as jest.Mock).mockResolvedValue({
        action: Share.sharedAction,
      });

      const result = await exportProgress();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Share.share).toHaveBeenCalledWith({
        message: expect.any(String),
        title: 'Vocabulary Progress Export',
      });

      // Verify exported data structure
      const exportedData = JSON.parse(result.data!);
      expect(exportedData.version).toBe('1.0.0');
      expect(exportedData.exportDate).toBeDefined();
      expect(exportedData.data.listLevelProgress).toEqual(mockProgressData.listLevelProgress);
      expect(exportedData.data.globalStats).toEqual(mockProgressData.globalStats);
    });

    it('handles share cancellation on mobile', async () => {
      (Platform as any).OS = 'android';
      (Share.share as jest.Mock).mockResolvedValue({
        action: Share.dismissedAction,
      });

      const result = await exportProgress();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Share canceled');
    });

    it('exports progress on web platform', async () => {
      (Platform as any).OS = 'web';

      // Mock DOM APIs (document is not available in React Native test environment)
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };

      // Mock document and DOM methods
      (global as any).document = {
        createElement: jest.fn(() => mockLink),
        body: {
          appendChild: jest.fn(() => mockLink),
          removeChild: jest.fn(() => mockLink),
        },
      };

      (global as any).Blob = class Blob {
        constructor(public content: any[], public options?: any) {}
      };

      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const result = await exportProgress();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect((global as any).document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('vocabulary-progress.json');
      expect(mockLink.click).toHaveBeenCalled();

      // Cleanup
      delete (global as any).document;
      delete (global as any).Blob;
    });

    it('handles export errors gracefully', async () => {
      (useProgressStore.getState as jest.Mock).mockImplementation(() => {
        throw new Error('Store error');
      });

      const result = await exportProgress();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Store error');
    });

    it('exports progress with correct date format', async () => {
      (Platform as any).OS = 'ios';
      (Share.share as jest.Mock).mockResolvedValue({
        action: Share.sharedAction,
      });

      const result = await exportProgress();

      const exportedData = JSON.parse(result.data!);
      const exportDate = new Date(exportedData.exportDate);
      expect(exportDate).toBeInstanceOf(Date);
      expect(exportDate.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('importProgress', () => {
    it('imports valid progress data', async () => {
      const validExport: ProgressExportData = {
        version: '1.0.0',
        exportDate: '2024-01-01T00:00:00.000Z',
        data: {
          listLevelProgress: {
            'list-a-basic': {
              listId: 'list-a',
              levelId: 'basic',
              wordProgress: {
                word1: { state: 3, correctCount: 5, wrongCount: 0 },
                word2: { state: 3, correctCount: 4, wrongCount: 0 },
                word3: { state: 2, correctCount: 2, wrongCount: 1 },
              },
            },
          },
          globalStats: {
            allTimeHints: 5,
            allTimeWrong: 1,
            allTimeCorrect: 11,
            totalWordsLearned: 2,
            listsCompleted: ['list-a'],
          },
        },
      };

      const result = await importProgress(JSON.stringify(validExport));

      expect(result.success).toBe(true);
      expect(result.preview).toEqual({
        wordsLearned: 2,
        listsCompleted: 1,
        exportDate: '2024-01-01T00:00:00.000Z',
      });
    });

    it('rejects invalid JSON', async () => {
      const result = await importProgress('invalid json');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Error message varies by JavaScript engine
      expect(typeof result.error).toBe('string');
    });

    it('rejects data without version', async () => {
      const invalidData = {
        data: { listLevelProgress: {}, globalStats: {} },
      };

      const result = await importProgress(JSON.stringify(invalidData));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid export file format');
    });

    it('rejects data without data field', async () => {
      const invalidData = {
        version: '1.0.0',
        exportDate: '2024-01-01T00:00:00.000Z',
      };

      const result = await importProgress(JSON.stringify(invalidData));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid export file format');
    });

    it('warns on version mismatch but continues', async () => {
      const oldVersionExport = {
        version: '0.9.0',
        exportDate: '2024-01-01T00:00:00.000Z',
        data: {
          listLevelProgress: {},
          globalStats: {
            allTimeHints: 0,
            allTimeWrong: 0,
            allTimeCorrect: 0,
            totalWordsLearned: 0,
            listsCompleted: [],
          },
        },
      };

      const result = await importProgress(JSON.stringify(oldVersionExport));

      expect(result.success).toBe(true);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('0.9.0')
      );
    });

    it('calculates preview stats correctly', async () => {
      const exportData: ProgressExportData = {
        version: '1.0.0',
        exportDate: '2024-01-01T00:00:00.000Z',
        data: {
          listLevelProgress: {
            'list-a-basic': {
              listId: 'list-a',
              levelId: 'basic',
              wordProgress: {
                word1: { state: 3, correctCount: 5, wrongCount: 0 },
                word2: { state: 3, correctCount: 4, wrongCount: 0 },
                word3: { state: 2, correctCount: 2, wrongCount: 1 },
              },
            },
            'list-b-advanced': {
              listId: 'list-b',
              levelId: 'advanced',
              wordProgress: {
                word4: { state: 3, correctCount: 3, wrongCount: 0 },
              },
            },
          },
          globalStats: {
            allTimeHints: 10,
            allTimeWrong: 5,
            allTimeCorrect: 50,
            totalWordsLearned: 25,
            listsCompleted: ['list-a', 'list-b'],
          },
        },
      };

      const result = await importProgress(JSON.stringify(exportData));

      expect(result.success).toBe(true);
      expect(result.preview?.wordsLearned).toBe(3); // word1, word2, word4 have state === 3
      expect(result.preview?.listsCompleted).toBe(2);
    });

    it('handles missing wordProgress gracefully', async () => {
      const exportData = {
        version: '1.0.0',
        exportDate: '2024-01-01T00:00:00.000Z',
        data: {
          listLevelProgress: {
            'list-a-basic': {
              listId: 'list-a',
              levelId: 'basic',
              // No wordProgress field
            },
          },
          globalStats: {
            allTimeHints: 0,
            allTimeWrong: 0,
            allTimeCorrect: 0,
            totalWordsLearned: 0,
            listsCompleted: [],
          },
        },
      };

      const result = await importProgress(JSON.stringify(exportData));

      expect(result.success).toBe(true);
      expect(result.preview?.wordsLearned).toBe(0);
    });
  });

  describe('applyImportedProgress', () => {
    it('applies imported progress to store', () => {
      const mockResetAllProgress = jest.fn();
      (useProgressStore.getState as jest.Mock).mockReturnValue({
        resetAllProgress: mockResetAllProgress,
      });

      const validExport: ProgressExportData = {
        version: '1.0.0',
        exportDate: '2024-01-01T00:00:00.000Z',
        data: {
          listLevelProgress: mockProgressData.listLevelProgress,
          globalStats: mockProgressData.globalStats,
        },
      };

      const result = applyImportedProgress(JSON.stringify(validExport));

      expect(result).toBe(true);
      expect(mockResetAllProgress).toHaveBeenCalled();
      expect(useProgressStore.setState).toHaveBeenCalledWith({
        listLevelProgress: mockProgressData.listLevelProgress,
        globalStats: mockProgressData.globalStats,
        lastSyncedAt: expect.any(String),
      });
    });

    it('sets lastSyncedAt to current time', () => {
      const mockResetAllProgress = jest.fn();
      (useProgressStore.getState as jest.Mock).mockReturnValue({
        resetAllProgress: mockResetAllProgress,
      });

      const validExport: ProgressExportData = {
        version: '1.0.0',
        exportDate: '2024-01-01T00:00:00.000Z',
        data: {
          listLevelProgress: {},
          globalStats: {
            allTimeHints: 0,
            allTimeWrong: 0,
            allTimeCorrect: 0,
            totalWordsLearned: 0,
            listsCompleted: [],
          },
        },
      };

      const beforeTime = Date.now();
      applyImportedProgress(JSON.stringify(validExport));
      const afterTime = Date.now();

      const setStateCall = (useProgressStore.setState as jest.Mock).mock.calls[0][0];
      const syncedAtTime = new Date(setStateCall.lastSyncedAt).getTime();
      expect(syncedAtTime).toBeGreaterThanOrEqual(beforeTime);
      expect(syncedAtTime).toBeLessThanOrEqual(afterTime);
    });

    it('handles invalid JSON gracefully', () => {
      const result = applyImportedProgress('invalid json');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to apply imported progress:',
        expect.any(Error)
      );
    });

    it('handles store errors gracefully', () => {
      (useProgressStore.getState as jest.Mock).mockImplementation(() => {
        throw new Error('Store error');
      });

      const validExport: ProgressExportData = {
        version: '1.0.0',
        exportDate: '2024-01-01T00:00:00.000Z',
        data: {
          listLevelProgress: {},
          globalStats: {
            allTimeHints: 0,
            allTimeWrong: 0,
            allTimeCorrect: 0,
            totalWordsLearned: 0,
            listsCompleted: [],
          },
        },
      };

      const result = applyImportedProgress(JSON.stringify(validExport));

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
