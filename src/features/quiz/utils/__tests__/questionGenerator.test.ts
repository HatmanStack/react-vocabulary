/**
 * Question Generator Tests
 */

import { generateMultipleChoiceOptions } from '../questionGenerator';
import { VocabularyWord } from '@/shared/types';

// Mock vocabulary words for testing
const mockWords: VocabularyWord[] = [
  {
    id: '1',
    word: 'abject',
    definition: 'Experienced or marked by humiliation or degradation',
    fillInBlank: 'Timmy was _____ after falling off the jungle gym',
  },
  {
    id: '2',
    word: 'aberration',
    definition: 'A deviation from what is normal',
    fillInBlank: 'The _____ in the data was unexpected',
  },
  {
    id: '3',
    word: 'abjure',
    definition: 'To renounce or reject solemnly',
    fillInBlank: 'He chose to _____ his former beliefs',
  },
  {
    id: '4',
    word: 'abnegate',
    definition: 'To deny or renounce',
    fillInBlank: 'She was forced to _____ her rights',
  },
  {
    id: '5',
    word: 'abrogate',
    definition: 'To abolish or cancel formally',
    fillInBlank: 'The government moved to _____ the old law',
  },
];

describe('generateMultipleChoiceOptions', () => {
  it('returns 4 options', () => {
    const correctWord = mockWords[0];
    const options = generateMultipleChoiceOptions(correctWord, mockWords);

    expect(options).toHaveLength(4);
  });

  it('includes the correct word in options', () => {
    const correctWord = mockWords[0];
    const options = generateMultipleChoiceOptions(correctWord, mockWords);

    expect(options).toContain(correctWord.word);
  });

  it('generates unique words (no duplicates)', () => {
    const correctWord = mockWords[0];
    const options = generateMultipleChoiceOptions(correctWord, mockWords);

    const uniqueOptions = new Set(options);
    expect(uniqueOptions.size).toBe(4);
  });

  it('randomizes correct answer position', () => {
    const correctWord = mockWords[0];
    const positions = new Set<number>();

    // Run 20 times to check randomization
    for (let i = 0; i < 20; i++) {
      const options = generateMultipleChoiceOptions(correctWord, mockWords);
      const position = options.indexOf(correctWord.word);
      positions.add(position);
    }

    // With 20 iterations, we should see at least 2 different positions
    // (very unlikely to get same position 20 times if truly random)
    expect(positions.size).toBeGreaterThan(1);
  });

  it('uses words from the provided word list', () => {
    const correctWord = mockWords[0];
    const options = generateMultipleChoiceOptions(correctWord, mockWords);

    // All options should be from mockWords
    const allWordsSet = new Set(mockWords.map((w) => w.word));
    options.forEach((option) => {
      expect(allWordsSet.has(option)).toBe(true);
    });
  });

  it('handles minimum word count (4 words)', () => {
    const minWords = mockWords.slice(0, 4);
    const correctWord = minWords[0];
    const options = generateMultipleChoiceOptions(correctWord, minWords);

    expect(options).toHaveLength(4);
    expect(options).toContain(correctWord.word);
    expect(new Set(options).size).toBe(4);
  });

  it('works with larger word lists', () => {
    const correctWord = mockWords[2];
    const options = generateMultipleChoiceOptions(correctWord, mockWords);

    expect(options).toHaveLength(4);
    expect(options).toContain(correctWord.word);
    expect(new Set(options).size).toBe(4);
  });
});
