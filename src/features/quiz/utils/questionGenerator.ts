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
  // Create pool of incorrect options (excluding the correct word)
  const incorrectWords = allWords.filter((w) => w.id !== correctWord.id);

  // Shuffle the incorrect words using Fisher-Yates
  const shuffled = [...incorrectWords];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Take first 3 shuffled words as incorrect options
  const incorrectOptions = shuffled.slice(0, 3).map((w) => w.word);

  // Randomize position of correct answer (0-3)
  const correctPosition = Math.floor(Math.random() * 4);

  const options: string[] = new Array(4);
  options[correctPosition] = correctWord.word;

  // Fill remaining positions with incorrect options
  let incorrectIndex = 0;
  for (let i = 0; i < 4; i++) {
    if (i !== correctPosition) {
      options[i] = incorrectOptions[incorrectIndex] || '';
      incorrectIndex++;
    }
  }

  return options;
}
