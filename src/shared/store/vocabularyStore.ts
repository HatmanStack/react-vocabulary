/**
 * Vocabulary Store
 *
 * Manages vocabulary data loading and selection state using Zustand.
 * Provides centralized access to all lists, levels, and words.
 */

import { create } from 'zustand';
import { VocabularyList, VocabularyWord, VocabularyLevel } from '@/shared/types';
import {
  loadVocabularyLists,
  getListById,
  getLevelWords,
  getAllWords,
} from '@/features/vocabulary/utils/vocabularyLoader';

interface VocabularyState {
  // Data
  vocabularyLists: VocabularyList[];
  selectedListId: string | null;
  selectedLevelId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadVocabularyLists: () => void;
  selectList: (listId: string) => void;
  selectLevel: (levelId: string) => void;
  clearSelection: () => void;

  // Selectors
  getSelectedList: () => VocabularyList | undefined;
  getSelectedLevel: () => VocabularyLevel | undefined;
  getWordsByListLevel: (listId: string, levelId: string) => VocabularyWord[];
  getAllWords: () => VocabularyWord[];
}

export const useVocabularyStore = create<VocabularyState>((set, get) => ({
  // Initial state
  vocabularyLists: [],
  selectedListId: null,
  selectedLevelId: null,
  isLoading: false,
  error: null,

  // Load all vocabulary lists
  loadVocabularyLists: () => {
    set({ isLoading: true, error: null });
    try {
      const lists = loadVocabularyLists();
      set({ vocabularyLists: lists, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load vocabulary',
        isLoading: false,
      });
    }
  },

  // Select a list by ID
  selectList: (listId: string) => {
    const lists = get().vocabularyLists;
    const list = lists.find((l) => l.id === listId);

    if (!list) {
      console.warn(`List with ID "${listId}" not found`);
      return;
    }

    set({ selectedListId: listId });
  },

  // Select a level by ID
  selectLevel: (levelId: string) => {
    const selectedList = get().getSelectedList();

    if (!selectedList) {
      console.warn('No list selected. Select a list before selecting a level.');
      return;
    }

    const level = selectedList.levels.find((l) => l.id === levelId);

    if (!level) {
      console.warn(`Level with ID "${levelId}" not found in selected list`);
      return;
    }

    set({ selectedLevelId: levelId });
  },

  // Clear all selections
  clearSelection: () => {
    set({ selectedListId: null, selectedLevelId: null });
  },

  // Get the currently selected list
  getSelectedList: () => {
    const { vocabularyLists, selectedListId } = get();
    if (!selectedListId) return undefined;
    return vocabularyLists.find((list) => list.id === selectedListId);
  },

  // Get the currently selected level
  getSelectedLevel: () => {
    const selectedList = get().getSelectedList();
    const { selectedLevelId } = get();

    if (!selectedList || !selectedLevelId) return undefined;
    return selectedList.levels.find((level) => level.id === selectedLevelId);
  },

  // Get words for a specific list and level
  getWordsByListLevel: (listId: string, levelId: string) => {
    return getLevelWords(listId, levelId);
  },

  // Get all words from all lists and levels
  getAllWords: () => {
    return getAllWords();
  },
}));

// Initialize store with vocabulary data on creation
useVocabularyStore.getState().loadVocabularyLists();
