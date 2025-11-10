/**
 * Vocabulary Loader Tests
 */

import {
  loadVocabularyLists,
  getListById,
  getLevelWords,
  getAllWords,
  getTotalWordCount,
  getAvailableListIds,
} from '../vocabularyLoader';

// Note: These tests use the actual vocabulary JSON data from the project
// This ensures the data structure is correct and the loader works with real data

describe('vocabularyLoader', () => {
  describe('loadVocabularyLists', () => {
    it('loads all vocabulary lists', () => {
      const lists = loadVocabularyLists();

      expect(lists).toBeDefined();
      expect(Array.isArray(lists)).toBe(true);
      expect(lists.length).toBe(8); // List A through H
    });

    it('each list has required structure', () => {
      const lists = loadVocabularyLists();

      lists.forEach((list) => {
        expect(list).toHaveProperty('id');
        expect(list).toHaveProperty('name');
        expect(list).toHaveProperty('levels');
        expect(Array.isArray(list.levels)).toBe(true);
      });
    });

    it('each level has required structure', () => {
      const lists = loadVocabularyLists();

      lists.forEach((list) => {
        list.levels.forEach((level) => {
          expect(level).toHaveProperty('id');
          expect(level).toHaveProperty('name');
          expect(level).toHaveProperty('words');
          expect(Array.isArray(level.words)).toBe(true);
        });
      });
    });

    it('each word has required structure', () => {
      const lists = loadVocabularyLists();

      lists.forEach((list) => {
        list.levels.forEach((level) => {
          level.words.forEach((word) => {
            expect(word).toHaveProperty('id');
            expect(word).toHaveProperty('word');
            expect(word).toHaveProperty('definition');
            expect(word).toHaveProperty('fillInBlank');
          });
        });
      });
    });

    it('loads list A with expected structure', () => {
      const lists = loadVocabularyLists();
      const listA = lists.find((l) => l.id === 'list-a');

      expect(listA).toBeDefined();
      expect(listA?.name).toBe('List A');
      expect(listA?.levels).toBeDefined();
      expect(listA!.levels.length).toBeGreaterThan(0);
    });
  });

  describe('getListById', () => {
    it('returns list for valid ID', () => {
      const list = getListById('list-a');

      expect(list).toBeDefined();
      expect(list?.id).toBe('list-a');
      expect(list?.name).toBe('List A');
    });

    it('returns different lists for different IDs', () => {
      const listA = getListById('list-a');
      const listB = getListById('list-b');

      expect(listA?.id).toBe('list-a');
      expect(listB?.id).toBe('list-b');
      expect(listA?.id).not.toBe(listB?.id);
    });

    it('returns undefined for non-existent ID', () => {
      const list = getListById('non-existent');

      expect(list).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      const list = getListById('');

      expect(list).toBeUndefined();
    });

    it('gets all 8 lists individually', () => {
      const listIds = ['list-a', 'list-b', 'list-c', 'list-d', 'list-e', 'list-f', 'list-g', 'list-h'];

      listIds.forEach((id) => {
        const list = getListById(id);
        expect(list).toBeDefined();
        expect(list?.id).toBe(id);
      });
    });
  });

  describe('getLevelWords', () => {
    it('returns words for valid list and level', () => {
      const words = getLevelWords('list-a', 'basic');

      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
    });

    it('each word has valid structure', () => {
      const words = getLevelWords('list-a', 'basic');

      words.forEach((word) => {
        expect(word.id).toBeDefined();
        expect(word.word).toBeDefined();
        expect(word.definition).toBeDefined();
        expect(typeof word.word).toBe('string');
        expect(typeof word.definition).toBe('string');
      });
    });

    it('returns empty array for non-existent list', () => {
      const words = getLevelWords('non-existent', 'basic');

      expect(words).toEqual([]);
    });

    it('returns empty array for non-existent level', () => {
      const words = getLevelWords('list-a', 'non-existent');

      expect(words).toEqual([]);
    });

    it('returns empty array when both list and level are invalid', () => {
      const words = getLevelWords('non-existent', 'non-existent');

      expect(words).toEqual([]);
    });

    it('returns different words for different levels', () => {
      const basicWords = getLevelWords('list-a', 'basic');
      const advancedWords = getLevelWords('list-a', 'advanced');

      // They should have different content (assuming list has both levels)
      if (basicWords.length > 0 && advancedWords.length > 0) {
        expect(basicWords[0]?.id).not.toBe(advancedWords[0]?.id);
      }
    });
  });

  describe('getAllWords', () => {
    it('returns array of all words', () => {
      const allWords = getAllWords();

      expect(Array.isArray(allWords)).toBe(true);
      expect(allWords.length).toBeGreaterThan(0);
    });

    it('returns more words than any single list', () => {
      const allWords = getAllWords();
      const listAWords = getLevelWords('list-a', 'basic');

      expect(allWords.length).toBeGreaterThan(listAWords.length);
    });

    it('each word has valid structure', () => {
      const allWords = getAllWords();

      allWords.forEach((word) => {
        expect(word).toHaveProperty('id');
        expect(word).toHaveProperty('word');
        expect(word).toHaveProperty('definition');
        expect(typeof word.word).toBe('string');
        expect(typeof word.definition).toBe('string');
      });
    });

    it('includes words from multiple lists', () => {
      const allWords = getAllWords();

      // Get sample words from different lists
      const listAWord = getLevelWords('list-a', 'basic')[0];
      const listBWord = getLevelWords('list-b', 'basic')[0];

      if (listAWord && listBWord) {
        const hasListAWord = allWords.some((w) => w.id === listAWord.id);
        const hasListBWord = allWords.some((w) => w.id === listBWord.id);

        expect(hasListAWord).toBe(true);
        expect(hasListBWord).toBe(true);
      }
    });

    it('returns same result when called multiple times', () => {
      const allWords1 = getAllWords();
      const allWords2 = getAllWords();

      expect(allWords1.length).toBe(allWords2.length);
    });
  });

  describe('getTotalWordCount', () => {
    it('returns total number of words', () => {
      const count = getTotalWordCount();

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    it('matches length of getAllWords', () => {
      const count = getTotalWordCount();
      const allWords = getAllWords();

      expect(count).toBe(allWords.length);
    });

    it('returns same count when called multiple times', () => {
      const count1 = getTotalWordCount();
      const count2 = getTotalWordCount();

      expect(count1).toBe(count2);
    });
  });

  describe('getAvailableListIds', () => {
    it('returns array of list IDs', () => {
      const ids = getAvailableListIds();

      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBe(8);
    });

    it('contains expected list IDs', () => {
      const ids = getAvailableListIds();

      expect(ids).toContain('list-a');
      expect(ids).toContain('list-b');
      expect(ids).toContain('list-c');
      expect(ids).toContain('list-d');
      expect(ids).toContain('list-e');
      expect(ids).toContain('list-f');
      expect(ids).toContain('list-g');
      expect(ids).toContain('list-h');
    });

    it('all IDs are strings', () => {
      const ids = getAvailableListIds();

      ids.forEach((id) => {
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      });
    });

    it('returns same IDs when called multiple times', () => {
      const ids1 = getAvailableListIds();
      const ids2 = getAvailableListIds();

      expect(ids1).toEqual(ids2);
    });
  });

  describe('integration', () => {
    it('can navigate from lists to words', () => {
      // Get all lists
      const lists = loadVocabularyLists();
      expect(lists.length).toBeGreaterThan(0);

      // Get first list
      const firstList = lists[0];
      expect(firstList).toBeDefined();

      // Get same list by ID
      const listById = getListById(firstList.id);
      expect(listById?.id).toBe(firstList.id);

      // Get words from first level
      if (firstList.levels.length > 0) {
        const words = getLevelWords(firstList.id, firstList.levels[0].id);
        expect(words.length).toBeGreaterThan(0);
      }
    });

    it('getAllWords includes words from getLevelWords', () => {
      const allWords = getAllWords();
      const levelWords = getLevelWords('list-a', 'basic');

      if (levelWords.length > 0) {
        const sampleWord = levelWords[0];
        const foundInAll = allWords.some((w) => w.id === sampleWord.id);
        expect(foundInAll).toBe(true);
      }
    });

    it('getAvailableListIds matches loaded lists', () => {
      const lists = loadVocabularyLists();
      const ids = getAvailableListIds();

      expect(ids.length).toBe(lists.length);

      lists.forEach((list) => {
        expect(ids).toContain(list.id);
      });
    });
  });
});
