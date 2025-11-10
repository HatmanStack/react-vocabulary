/**
 * Levenshtein Distance Algorithm
 *
 * Calculates the minimum number of single-character edits (insertions,
 * deletions, or substitutions) needed to change one string into another.
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
 * levenshteinDistance('abject', 'abjact'); // 1 (1 substitution: e → a)
 * levenshteinDistance('cat', 'cats'); // 1 (1 insertion: s)
 * levenshteinDistance('hello', 'world'); // 4 (4 substitutions)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create 2D array for dynamic programming
  // dp[i][j] = distance between str1[0..i-1] and str2[0..j-1]
  const dp: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first column (deletions from str1)
  for (let i = 0; i <= len1; i++) {
    dp[i][0] = i;
  }

  // Initialize first row (insertions to str1)
  for (let j = 0; j <= len2; j++) {
    dp[0][j] = j;
  }

  // Fill the DP table
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        // Characters match, no operation needed
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        // Take minimum of:
        // 1. Substitution: dp[i-1][j-1] + 1
        // 2. Deletion: dp[i-1][j] + 1
        // 3. Insertion: dp[i][j-1] + 1
        dp[i][j] =
          Math.min(
            dp[i - 1][j - 1], // substitution
            dp[i - 1][j], // deletion
            dp[i][j - 1] // insertion
          ) + 1;
      }
    }
  }

  return dp[len1][len2];
}
