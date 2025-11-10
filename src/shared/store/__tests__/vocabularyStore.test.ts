/**
 * Vocabulary Store Tests
 */

import { useVocabularyStore } from '../vocabularyStore';
import {
  loadVocabularyLists,
  getListById,
  getLevelWords,
  getAllWords,
} from '@/features/vocabulary/utils/vocabularyLoader';

// Mock the vocabulary loader
jest.mock('@/features/vocabulary/utils/vocabularyLoader', () => ({
  loadVocabularyLists: jest.fn(),
  getListById: jest.fn(),
  getLevelWords: jest.fn(),
  getAllWords: jest.fn(),
}));

describe('vocabularyStore', () => {
  const mockVocabularyLists = [
    {
      id: 'list-a',
      name: 'List A',
      description: 'Basic words',
      levels: [
        {
          id: 'basic',
          name: 'Basic',
          description: 'Easy words',
          wordCount: 10,
        },
        {
          id: 'advanced',
          name: 'Advanced',
          description: 'Hard words',
          wordCount: 15,
        },
      ],
    },
    {
      id: 'list-b',
      name: 'List B',
      description: 'Advanced words',
      levels: [
        {
          id: 'expert',
          name: 'Expert',
          description: 'Expert level words',
          wordCount: 20,
        },
      ],
    },
  ];

  const mockWords = [
    { id: 'word1', word: 'test', definition: 'a test' },
    { id: 'word2', word: 'example', definition: 'an example' },
  ];

  beforeEach(() => {
    // Reset store to initial state
    useVocabularyStore.setState({
      vocabularyLists: [],
      selectedListId: null,
      selectedLevelId: null,
      isLoading: false,
      error: null,
    });

    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loadVocabularyLists', () => {
    it('loads vocabulary lists successfully', () => {
      (loadVocabularyLists as jest.Mock).mockReturnValue(mockVocabularyLists);

      const store = useVocabularyStore.getState();
      store.loadVocabularyLists();

      const state = useVocabularyStore.getState();
      expect(state.vocabularyLists).toEqual(mockVocabularyLists);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets loading state during load', () => {
      (loadVocabularyLists as jest.Mock).mockImplementation(() => {
        const state = useVocabularyStore.getState();
        expect(state.isLoading).toBe(true);
        return mockVocabularyLists;
      });

      const store = useVocabularyStore.getState();
      store.loadVocabularyLists();
    });

    it('handles load errors gracefully', () => {
      const error = new Error('Failed to load');
      (loadVocabularyLists as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const store = useVocabularyStore.getState();
      store.loadVocabularyLists();

      const state = useVocabularyStore.getState();
      expect(state.error).toBe('Failed to load');
      expect(state.isLoading).toBe(false);
      expect(state.vocabularyLists).toEqual([]);
    });

    it('handles non-Error exceptions', () => {
      (loadVocabularyLists as jest.Mock).mockImplementation(() => {
        throw 'String error';
      });

      const store = useVocabularyStore.getState();
      store.loadVocabularyLists();

      const state = useVocabularyStore.getState();
      expect(state.error).toBe('Failed to load vocabulary');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('selectList', () => {
    beforeEach(() => {
      useVocabularyStore.setState({
        vocabularyLists: mockVocabularyLists,
      });
    });

    it('selects a valid list', () => {
      const store = useVocabularyStore.getState();
      store.selectList('list-a');

      const state = useVocabularyStore.getState();
      expect(state.selectedListId).toBe('list-a');
    });

    it('selects a different list', () => {
      const store = useVocabularyStore.getState();
      store.selectList('list-b');

      const state = useVocabularyStore.getState();
      expect(state.selectedListId).toBe('list-b');
    });

    it('warns when selecting non-existent list', () => {
      const store = useVocabularyStore.getState();
      store.selectList('non-existent');

      const state = useVocabularyStore.getState();
      expect(state.selectedListId).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('List with ID "non-existent" not found');
    });
  });

  describe('selectLevel', () => {
    beforeEach(() => {
      useVocabularyStore.setState({
        vocabularyLists: mockVocabularyLists,
        selectedListId: 'list-a',
      });
    });

    it('selects a valid level', () => {
      const store = useVocabularyStore.getState();
      store.selectLevel('basic');

      const state = useVocabularyStore.getState();
      expect(state.selectedLevelId).toBe('basic');
    });

    it('selects a different level', () => {
      const store = useVocabularyStore.getState();
      store.selectLevel('advanced');

      const state = useVocabularyStore.getState();
      expect(state.selectedLevelId).toBe('advanced');
    });

    it('warns when no list is selected', () => {
      useVocabularyStore.setState({ selectedListId: null });

      const store = useVocabularyStore.getState();
      store.selectLevel('basic');

      const state = useVocabularyStore.getState();
      expect(state.selectedLevelId).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        'No list selected. Select a list before selecting a level.'
      );
    });

    it('warns when selecting non-existent level', () => {
      const store = useVocabularyStore.getState();
      store.selectLevel('non-existent');

      const state = useVocabularyStore.getState();
      expect(state.selectedLevelId).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        'Level with ID "non-existent" not found in selected list'
      );
    });
  });

  describe('clearSelection', () => {
    it('clears selected list and level', () => {
      useVocabularyStore.setState({
        selectedListId: 'list-a',
        selectedLevelId: 'basic',
      });

      const store = useVocabularyStore.getState();
      store.clearSelection();

      const state = useVocabularyStore.getState();
      expect(state.selectedListId).toBeNull();
      expect(state.selectedLevelId).toBeNull();
    });

    it('works when nothing is selected', () => {
      const store = useVocabularyStore.getState();
      store.clearSelection();

      const state = useVocabularyStore.getState();
      expect(state.selectedListId).toBeNull();
      expect(state.selectedLevelId).toBeNull();
    });
  });

  describe('getSelectedList', () => {
    beforeEach(() => {
      useVocabularyStore.setState({
        vocabularyLists: mockVocabularyLists,
      });
    });

    it('returns selected list', () => {
      useVocabularyStore.setState({ selectedListId: 'list-a' });

      const store = useVocabularyStore.getState();
      const list = store.getSelectedList();

      expect(list).toEqual(mockVocabularyLists[0]);
    });

    it('returns undefined when no list is selected', () => {
      useVocabularyStore.setState({ selectedListId: null });

      const store = useVocabularyStore.getState();
      const list = store.getSelectedList();

      expect(list).toBeUndefined();
    });

    it('returns undefined when selected list does not exist', () => {
      useVocabularyStore.setState({ selectedListId: 'non-existent' });

      const store = useVocabularyStore.getState();
      const list = store.getSelectedList();

      expect(list).toBeUndefined();
    });
  });

  describe('getSelectedLevel', () => {
    beforeEach(() => {
      useVocabularyStore.setState({
        vocabularyLists: mockVocabularyLists,
        selectedListId: 'list-a',
        selectedLevelId: 'basic',
      });
    });

    it('returns selected level', () => {
      const store = useVocabularyStore.getState();
      const level = store.getSelectedLevel();

      expect(level).toEqual(mockVocabularyLists[0].levels[0]);
    });

    it('returns undefined when no list is selected', () => {
      useVocabularyStore.setState({ selectedListId: null });

      const store = useVocabularyStore.getState();
      const level = store.getSelectedLevel();

      expect(level).toBeUndefined();
    });

    it('returns undefined when no level is selected', () => {
      useVocabularyStore.setState({ selectedLevelId: null });

      const store = useVocabularyStore.getState();
      const level = store.getSelectedLevel();

      expect(level).toBeUndefined();
    });

    it('returns undefined when selected level does not exist', () => {
      useVocabularyStore.setState({ selectedLevelId: 'non-existent' });

      const store = useVocabularyStore.getState();
      const level = store.getSelectedLevel();

      expect(level).toBeUndefined();
    });
  });

  describe('getWordsByListLevel', () => {
    it('delegates to getLevelWords', () => {
      (getLevelWords as jest.Mock).mockReturnValue(mockWords);

      const store = useVocabularyStore.getState();
      const words = store.getWordsByListLevel('list-a', 'basic');

      expect(getLevelWords).toHaveBeenCalledWith('list-a', 'basic');
      expect(words).toEqual(mockWords);
    });
  });

  describe('getAllWords', () => {
    it('delegates to getAllWords utility', () => {
      (getAllWords as jest.Mock).mockReturnValue(mockWords);

      const store = useVocabularyStore.getState();
      const words = store.getAllWords();

      expect(getAllWords).toHaveBeenCalled();
      expect(words).toEqual(mockWords);
    });
  });

  describe('integration', () => {
    it('can select list and level in sequence', () => {
      (loadVocabularyLists as jest.Mock).mockReturnValue(mockVocabularyLists);

      const store = useVocabularyStore.getState();

      // Load lists
      store.loadVocabularyLists();
      expect(useVocabularyStore.getState().vocabularyLists).toHaveLength(2);

      // Select list
      store.selectList('list-a');
      expect(useVocabularyStore.getState().selectedListId).toBe('list-a');

      // Select level
      store.selectLevel('advanced');
      expect(useVocabularyStore.getState().selectedLevelId).toBe('advanced');

      // Verify selected list and level
      const selectedList = store.getSelectedList();
      const selectedLevel = store.getSelectedLevel();

      expect(selectedList?.id).toBe('list-a');
      expect(selectedLevel?.id).toBe('advanced');
    });

    it('clears selection after selecting', () => {
      useVocabularyStore.setState({
        vocabularyLists: mockVocabularyLists,
        selectedListId: 'list-a',
        selectedLevelId: 'basic',
      });

      const store = useVocabularyStore.getState();
      store.clearSelection();

      expect(store.getSelectedList()).toBeUndefined();
      expect(store.getSelectedLevel()).toBeUndefined();
    });
  });
});
