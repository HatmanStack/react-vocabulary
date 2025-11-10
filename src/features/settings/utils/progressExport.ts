/**
 * Progress Export/Import Utilities
 *
 * Handles exporting and importing user progress data for backup/restore.
 */

import { Platform, Share } from 'react-native';
import { useProgressStore } from '@/shared/store/progressStore';

const EXPORT_VERSION = '1.0.0';

export interface ProgressExportData {
  version: string;
  exportDate: string;
  data: {
    listLevelProgress: Record<string, any>;
    globalStats: {
      allTimeHints: number;
      allTimeWrong: number;
      allTimeCorrect: number;
      totalWordsLearned: number;
      listsCompleted: string[];
    };
  };
}

/**
 * Export progress data as JSON
 */
export async function exportProgress(): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  try {
    const progressStore = useProgressStore.getState();

    const exportData: ProgressExportData = {
      version: EXPORT_VERSION,
      exportDate: new Date().toISOString(),
      data: {
        listLevelProgress: progressStore.listLevelProgress,
        globalStats: progressStore.globalStats,
      },
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    if (Platform.OS === 'web') {
      // Web: Download as file
      downloadFile(jsonString, 'vocabulary-progress.json');
      return { success: true, data: jsonString };
    } else {
      // Mobile: Share using native share API
      const result = await Share.share({
        message: jsonString,
        title: 'Vocabulary Progress Export',
      });

      if (result.action === Share.sharedAction) {
        return { success: true, data: jsonString };
      } else {
        return { success: false, error: 'Share canceled' };
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

/**
 * Import progress data from JSON string
 */
export async function importProgress(jsonString: string): Promise<{
  success: boolean;
  error?: string;
  preview?: {
    wordsLearned: number;
    listsCompleted: number;
    exportDate: string;
  };
}> {
  try {
    const importData: ProgressExportData = JSON.parse(jsonString);

    // Validate version
    if (!importData.version || !importData.data) {
      return {
        success: false,
        error: 'Invalid export file format',
      };
    }

    // Version compatibility check
    if (importData.version !== EXPORT_VERSION) {
      console.warn(`Import version ${importData.version} differs from current ${EXPORT_VERSION}`);
    }

    // Calculate preview stats
    const preview = {
      wordsLearned: Object.values(importData.data.listLevelProgress).reduce((count, llp: any) => {
        return (
          count + Object.values(llp.wordProgress || {}).filter((wp: any) => wp.state === 3).length
        );
      }, 0),
      listsCompleted: importData.data.globalStats.listsCompleted?.length || 0,
      exportDate: importData.exportDate,
    };

    return {
      success: true,
      preview,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse import data',
    };
  }
}

/**
 * Apply imported progress data to store
 */
export function applyImportedProgress(jsonString: string): boolean {
  try {
    const importData: ProgressExportData = JSON.parse(jsonString);
    const progressStore = useProgressStore.getState();

    // Reset and apply imported data
    progressStore.resetAllProgress();

    // Manually set the state (bypassing normal actions to avoid conflicts)
    useProgressStore.setState({
      listLevelProgress: importData.data.listLevelProgress,
      globalStats: importData.data.globalStats,
      lastSyncedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Failed to apply imported progress:', error);
    return false;
  }
}

/**
 * Download file on web platform
 */
function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
