/**
 * Answer Validation Utilities
 *
 * Validates user answers for quiz questions with tolerance for typos and word variations.
 * Ported from Android app's answer validation logic.
 */

import { levenshteinDistance } from '@/shared/lib/levenshtein';

/**
 * Validate multiple choice answer (exact match)
 *
 * @param userAnswer - The user's selected answer
 * @param correctAnswer - The correct answer
 * @returns True if answer is correct (exact match), false otherwise
 *
 * @example
 * validateMultipleChoice('abject', 'abject'); // true
 * validateMultipleChoice('abject', 'abjure'); // false
 */
export function validateMultipleChoice(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer === correctAnswer;
}

/**
 * Validate fill-in-blank answer with tolerance for typos and word variations
 *
 * Accepts answers that:
 * - Exactly match the correct word
 * - Are within 1 character difference (Levenshtein distance ≤ 1)
 * - Match common word variations (plurals, tenses, etc.)
 *
 * Based on Android app's fillInTheBlankAnswer method (lines 260-303)
 *
 * @param userAnswer - The user's typed answer
 * @param correctAnswer - The correct word
 * @returns True if answer is accepted, false otherwise
 *
 * @example
 * validateFillInBlank('abject', 'abject'); // true (exact match)
 * validateFillInBlank('abjact', 'abject'); // true (1 char difference)
 * validateFillInBlank('abjects', 'abject'); // true (plural)
 * validateFillInBlank('abjected', 'abject'); // true (past tense)
 * validateFillInBlank('Abject', 'abject'); // true (case insensitive)
 * validateFillInBlank('abjxct', 'abject'); // false (2 char difference)
 */
export function validateFillInBlank(userAnswer: string, correctAnswer: string): boolean {
  // Normalize input: trim whitespace and convert to lowercase
  const normalizedUser = userAnswer.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();

  // Empty answer is always wrong
  if (normalizedUser.length === 0) {
    return false;
  }

  // Generate possible correct answers (base word + common variations)
  const possibleAnswers = generateWordVariations(normalizedCorrect);

  // Check each possible answer
  for (const possible of possibleAnswers) {
    // Check exact match
    if (normalizedUser === possible) {
      return true;
    }

    // Check Levenshtein distance (allow up to 1 character difference)
    if (levenshteinDistance(normalizedUser, possible) <= 1) {
      return true;
    }
  }

  return false;
}

/**
 * Generate word variations for tolerance matching
 *
 * Creates common variations of a word:
 * - Base word
 * - word + 's' (plural)
 * - word + 'es' (plural)
 * - word + 'd' (past tense)
 * - word + 'ed' (past tense)
 * - word + 'ing' (present participle)
 * - word + 'ly' (adverb)
 * - word[0..-1] + 'es' (remove last char + es)
 * - word[0..-1] + 'ing' (remove last char + ing)
 *
 * Based on Android app's possible answers array (lines 262-270)
 *
 * @param word - The base word
 * @returns Array of possible word variations
 */
function generateWordVariations(word: string): string[] {
  const variations: string[] = [
    word, // base word
    word + 's', // plural
    word + 'es', // plural (alternate)
    word + 'd', // past tense (short)
    word + 'ed', // past tense
    word + 'ing', // present participle
    word + 'ly', // adverb
  ];

  // Remove last char variations (for words ending in 'e', etc.)
  if (word.length > 1) {
    const wordWithoutLast = word.slice(0, -1);
    variations.push(wordWithoutLast + 'es'); // e.g., 'abate' → 'abates'
    variations.push(wordWithoutLast + 'ing'); // e.g., 'abate' → 'abating'
  }

  return variations;
}
