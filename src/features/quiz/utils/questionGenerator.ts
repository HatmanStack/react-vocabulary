/**
 * Question Generation Utilities
 *
 * Generates multiple choice options for quiz questions.
 * Ported from Android app's multiple choice generation logic.
 */

import { VocabularyWord } from '@/shared/types';

/**
 * Generate 4 multiple choice options (1 correct + 3 incorrect)
 *
 * Based on Android app's definition method (MainActivity.java lines 327-362)
 *
 * @param correctWord - The correct answer word
 * @param allWords - All words from the same level
 * @returns Array of 4 word strings (options)
 *
 * @example
 * const options = generateMultipleChoiceOptions(correctWord, levelWords);
 * // Returns: ['abject', 'abjure', 'abdicate', 'aberration'] (randomized order)
 */
export function generateMultipleChoiceOptions(
  correctWord: VocabularyWord,
  allWords: VocabularyWord[]
): string[] {
  // Randomize position of correct answer (0-3)
  const correctPosition = Math.floor(Math.random() * 4);

  const options: string[] = new Array(4);
  options[correctPosition] = correctWord.word;

  // Fill remaining positions with random incorrect words
  const usedIndices = new Set<number>();
  const correctWordIndex = allWords.findIndex((w) => w.id === correctWord.id);

  for (let i = 0; i < 4; i++) {
    if (i === correctPosition) continue; // Skip correct answer position

    // Find a random word that isn't used yet
    let attempts = 0;
    while (attempts < allWords.length * 2) {
      const randomIndex = Math.floor(Math.random() * allWords.length);

      // Check if this word is valid (not correct word, not already used)
      if (randomIndex !== correctWordIndex && !usedIndices.has(randomIndex)) {
        options[i] = allWords[randomIndex].word;
        usedIndices.add(randomIndex);
        break;
      }

      attempts++;
    }
  }

  return options;
}
