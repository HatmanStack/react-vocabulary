/**
 * Levenshtein Distance Algorithm
 *
 * Calculates the minimum number of single-character edits (insertions,
 * deletions, or substitutions) needed to change one string into another.
 *
 * Uses a rolling two-row DP approach (prevRow/currRow) for O(min(n,m)) space instead of O(n*m).
 *
 * Used for typo tolerance in fill-in-blank answer validation.
 */

/**
 * Calculate Levenshtein distance between two strings
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Minimum edit distance (number of character changes needed)
 *
 * @example
 * levenshteinDistance('abject', 'abjact'); // 1 (1 substitution: e -> a)
 * levenshteinDistance('cat', 'cats'); // 1 (1 insertion: s)
 * levenshteinDistance('hello', 'world'); // 4 (4 substitutions)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Ensure str2 is shorter for space optimization
  if (len1 < len2) return levenshteinDistance(str2, str1);

  let prevRow = Array.from({ length: len2 + 1 }, (_, i) => i);

  for (let i = 1; i <= len1; i++) {
    const currRow = [i];
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        currRow[j] = prevRow[j - 1];
      } else {
        currRow[j] =
          Math.min(
            prevRow[j - 1], // substitution
            prevRow[j], // deletion
            currRow[j - 1] // insertion
          ) + 1;
      }
    }
    prevRow = currRow;
  }

  return prevRow[len2];
}
