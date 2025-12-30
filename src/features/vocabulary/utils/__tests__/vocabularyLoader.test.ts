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

describe('vocabularyLoader', () => {
  describe('loadVocabularyLists', () => {
    it('returns all 18 vocabulary lists', () => {
      const lists = loadVocabularyLists();

      expect(lists).toHaveLength(18);
    });

    it('returns lists with correct structure', () => {
      const lists = loadVocabularyLists();

      lists.forEach(list => {
        expect(list).toHaveProperty('id');
        expect(list).toHaveProperty('name');
        expect(list).toHaveProperty('levels');
        expect(Array.isArray(list.levels)).toBe(true);
      });
    });

    it('includes expected list names', () => {
      const lists = loadVocabularyLists();
      const listIds = lists.map(l => l.id);

      expect(listIds).toContain('phoenix');
      expect(listIds).toContain('zenith');
      expect(listIds).toContain('aurora');
      expect(listIds).toContain('nebula');
    });

    it('each list has 5 levels', () => {
      const lists = loadVocabularyLists();

      lists.forEach(list => {
        expect(list.levels).toHaveLength(5);
      });
    });

    it('levels have correct IDs', () => {
      const lists = loadVocabularyLists();
      const expectedLevelIds = ['basic', 'intermediate', 'advanced', 'expert', 'professional'];

      lists.forEach(list => {
        const levelIds = list.levels.map(l => l.id);
        expect(levelIds).toEqual(expectedLevelIds);
      });
    });
  });

  describe('getListById', () => {
    it('returns list when found', () => {
      const list = getListById('phoenix');

      expect(list).toBeDefined();
      expect(list?.id).toBe('phoenix');
      expect(list?.name).toBe('Phoenix');
    });

    it('returns undefined for non-existent list', () => {
      const list = getListById('non-existent');

      expect(list).toBeUndefined();
    });

    it('returns correct list structure', () => {
      const list = getListById('zenith');

      expect(list).toHaveProperty('id', 'zenith');
      expect(list).toHaveProperty('name', 'Zenith');
      expect(list).toHaveProperty('levels');
      expect(list?.levels).toHaveLength(5);
    });
  });

  describe('getLevelWords', () => {
    it('returns words for valid list and level', () => {
      const words = getLevelWords('phoenix', 'basic');

      expect(words.length).toBeGreaterThan(0);
      words.forEach(word => {
        expect(word).toHaveProperty('id');
        expect(word).toHaveProperty('word');
        expect(word).toHaveProperty('definition');
        expect(word).toHaveProperty('fillInBlank');
      });
    });

    it('returns 4 words per level', () => {
      const words = getLevelWords('phoenix', 'basic');

      expect(words).toHaveLength(4);
    });

    it('returns empty array for non-existent list', () => {
      const words = getLevelWords('non-existent', 'basic');

      expect(words).toEqual([]);
    });

    it('returns empty array for non-existent level', () => {
      const words = getLevelWords('phoenix', 'non-existent');

      expect(words).toEqual([]);
    });

    it('returns words with correct ID format', () => {
      const words = getLevelWords('phoenix', 'basic');

      words.forEach(word => {
        expect(word.id).toMatch(/^phoenix-basic-\d+$/);
      });
    });

    it('returns different words for different levels', () => {
      const basicWords = getLevelWords('phoenix', 'basic');
      const advancedWords = getLevelWords('phoenix', 'advanced');

      const basicIds = basicWords.map(w => w.id);
      const advancedIds = advancedWords.map(w => w.id);

      // No overlap between levels
      advancedIds.forEach(id => {
        expect(basicIds).not.toContain(id);
      });
    });
  });

  describe('getAllWords', () => {
    it('returns all words from all lists', () => {
      const words = getAllWords();

      // 17 lists * 20 words + 1 list (summit) * 10 words = 350 words
      expect(words.length).toBe(350);
    });

    it('returns words with correct structure', () => {
      const words = getAllWords();

      words.forEach(word => {
        expect(word).toHaveProperty('id');
        expect(word).toHaveProperty('word');
        expect(word).toHaveProperty('definition');
        expect(word).toHaveProperty('fillInBlank');
        expect(typeof word.word).toBe('string');
        expect(typeof word.definition).toBe('string');
      });
    });

    it('includes words from different lists', () => {
      const words = getAllWords();
      const wordIds = words.map(w => w.id);

      // Check for words from different lists
      expect(wordIds.some(id => id.startsWith('phoenix'))).toBe(true);
      expect(wordIds.some(id => id.startsWith('zenith'))).toBe(true);
      expect(wordIds.some(id => id.startsWith('aurora'))).toBe(true);
    });
  });

  describe('getTotalWordCount', () => {
    it('returns correct total count', () => {
      const count = getTotalWordCount();

      // 17 lists * 20 words + 1 list (summit) * 10 words = 350 words
      expect(count).toBe(350);
    });

    it('matches getAllWords length', () => {
      const count = getTotalWordCount();
      const words = getAllWords();

      expect(count).toBe(words.length);
    });
  });

  describe('getAvailableListIds', () => {
    it('returns 18 list IDs', () => {
      const ids = getAvailableListIds();

      expect(ids).toHaveLength(18);
    });

    it('returns string IDs', () => {
      const ids = getAvailableListIds();

      ids.forEach(id => {
        expect(typeof id).toBe('string');
      });
    });

    it('includes expected IDs', () => {
      const ids = getAvailableListIds();

      expect(ids).toContain('phoenix');
      expect(ids).toContain('zenith');
      expect(ids).toContain('odyssey');
      expect(ids).toContain('cascade');
      expect(ids).toContain('horizon');
      expect(ids).toContain('eclipse');
      expect(ids).toContain('mosaic');
      expect(ids).toContain('nexus');
      expect(ids).toContain('catalyst');
      expect(ids).toContain('prism');
      expect(ids).toContain('aurora');
      expect(ids).toContain('pinnacle');
      expect(ids).toContain('meridian');
      expect(ids).toContain('spectrum');
      expect(ids).toContain('vertex');
      expect(ids).toContain('quantum');
      expect(ids).toContain('nebula');
      expect(ids).toContain('summit');
    });
  });
});
