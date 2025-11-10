/**
 * Vocabulary Data Loader
 *
 * Provides functions to load and access vocabulary data from JSON files.
 */

import { VocabularyList, VocabularyWord } from '@/shared/types';

// Import all vocabulary JSON files
import listA from '@/assets/vocabulary/list-a.json';
import listB from '@/assets/vocabulary/list-b.json';
import listC from '@/assets/vocabulary/list-c.json';
import listD from '@/assets/vocabulary/list-d.json';
import listE from '@/assets/vocabulary/list-e.json';
import listF from '@/assets/vocabulary/list-f.json';
import listG from '@/assets/vocabulary/list-g.json';
import listH from '@/assets/vocabulary/list-h.json';

// Type assertion to ensure imported JSON matches our types
const vocabularyLists = [
  listA,
  listB,
  listC,
  listD,
  listE,
  listF,
  listG,
  listH,
] as VocabularyList[];

/**
 * Load all vocabulary lists
 *
 * @returns Array of all 8 vocabulary lists (A-H)
 */
export function loadVocabularyLists(): VocabularyList[] {
  return vocabularyLists;
}

/**
 * Get a vocabulary list by ID
 *
 * @param id - The list ID (e.g., 'list-a', 'list-b')
 * @returns The vocabulary list or undefined if not found
 */
export function getListById(id: string): VocabularyList | undefined {
  return vocabularyLists.find((list) => list.id === id);
}

/**
 * Get words for a specific list and level
 *
 * @param listId - The list ID (e.g., 'list-a')
 * @param levelId - The level ID (e.g., 'basic', 'intermediate')
 * @returns Array of vocabulary words for that level, or empty array if not found
 */
export function getLevelWords(listId: string, levelId: string): VocabularyWord[] {
  const list = getListById(listId);
  if (!list) return [];

  const level = list.levels.find((l) => l.id === levelId);
  return level?.words || [];
}

/**
 * Get all vocabulary words from all lists and levels
 *
 * @returns Array of all vocabulary words across all lists
 */
export function getAllWords(): VocabularyWord[] {
  const allWords: VocabularyWord[] = [];

  vocabularyLists.forEach((list) => {
    list.levels.forEach((level) => {
      allWords.push(...level.words);
    });
  });

  return allWords;
}

/**
 * Get total word count across all lists
 *
 * @returns Total number of vocabulary words
 */
export function getTotalWordCount(): number {
  return getAllWords().length;
}

/**
 * Get list of all available list IDs
 *
 * @returns Array of list IDs
 */
export function getAvailableListIds(): string[] {
  return vocabularyLists.map((list) => list.id);
}
