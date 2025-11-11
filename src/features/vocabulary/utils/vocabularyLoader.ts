/**
 * Vocabulary Data Loader
 *
 * Provides functions to load and access vocabulary data from JSON files.
 */

import { VocabularyList, VocabularyWord } from '@/shared/types';

// Import all vocabulary JSON files
import phoenix from '@/assets/vocabulary/phoenix.json';
import zenith from '@/assets/vocabulary/zenith.json';
import odyssey from '@/assets/vocabulary/odyssey.json';
import cascade from '@/assets/vocabulary/cascade.json';
import horizon from '@/assets/vocabulary/horizon.json';
import eclipse from '@/assets/vocabulary/eclipse.json';
import mosaic from '@/assets/vocabulary/mosaic.json';
import nexus from '@/assets/vocabulary/nexus.json';
import catalyst from '@/assets/vocabulary/catalyst.json';
import prism from '@/assets/vocabulary/prism.json';
import aurora from '@/assets/vocabulary/aurora.json';
import pinnacle from '@/assets/vocabulary/pinnacle.json';
import meridian from '@/assets/vocabulary/meridian.json';
import spectrum from '@/assets/vocabulary/spectrum.json';
import vertex from '@/assets/vocabulary/vertex.json';
import quantum from '@/assets/vocabulary/quantum.json';
import nebula from '@/assets/vocabulary/nebula.json';
import summit from '@/assets/vocabulary/summit.json';

// Type assertion to ensure imported JSON matches our types
const vocabularyLists = [
  phoenix,
  zenith,
  odyssey,
  cascade,
  horizon,
  eclipse,
  mosaic,
  nexus,
  catalyst,
  prism,
  aurora,
  pinnacle,
  meridian,
  spectrum,
  vertex,
  quantum,
  nebula,
  summit,
] as VocabularyList[];

/**
 * Load all vocabulary lists
 *
 * @returns Array of all 18 vocabulary lists (Phoenix, Zenith, Odyssey, etc.)
 */
export function loadVocabularyLists(): VocabularyList[] {
  return vocabularyLists;
}

/**
 * Get a vocabulary list by ID
 *
 * @param id - The list ID (e.g., 'phoenix', 'zenith')
 * @returns The vocabulary list or undefined if not found
 */
export function getListById(id: string): VocabularyList | undefined {
  return vocabularyLists.find((list) => list.id === id);
}

/**
 * Get words for a specific list and level
 *
 * @param listId - The list ID (e.g., 'phoenix', 'zenith')
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
