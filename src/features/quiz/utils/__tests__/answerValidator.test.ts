/**
 * Answer Validator Tests
 */

import { validateMultipleChoice, validateFillInBlank } from '../answerValidator';

describe('validateMultipleChoice', () => {
  it('returns true for exact match', () => {
    expect(validateMultipleChoice('abject', 'abject')).toBe(true);
  });

  it('returns false for different word', () => {
    expect(validateMultipleChoice('abject', 'abjure')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(validateMultipleChoice('Abject', 'abject')).toBe(false);
    expect(validateMultipleChoice('ABJECT', 'abject')).toBe(false);
  });

  it('returns false for partial match', () => {
    expect(validateMultipleChoice('abje', 'abject')).toBe(false);
  });

  it('returns false for empty answer', () => {
    expect(validateMultipleChoice('', 'abject')).toBe(false);
  });
});

describe('validateFillInBlank', () => {
  describe('exact matches', () => {
    it('accepts exact match', () => {
      expect(validateFillInBlank('abject', 'abject')).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(validateFillInBlank('Abject', 'abject')).toBe(true);
      expect(validateFillInBlank('ABJECT', 'abject')).toBe(true);
      expect(validateFillInBlank('AbJeCt', 'abject')).toBe(true);
    });

    it('trims whitespace', () => {
      expect(validateFillInBlank('  abject  ', 'abject')).toBe(true);
      expect(validateFillInBlank(' abject', 'abject')).toBe(true);
      expect(validateFillInBlank('abject ', 'abject')).toBe(true);
    });
  });

  describe('typo tolerance (1 character difference)', () => {
    it('accepts 1 character substitution', () => {
      expect(validateFillInBlank('abjact', 'abject')).toBe(true); // e → a
      expect(validateFillInBlank('abjoct', 'abject')).toBe(true); // e → o
    });

    it('accepts 1 character insertion', () => {
      expect(validateFillInBlank('abjects', 'abject')).toBe(true); // extra s
    });

    it('accepts 1 character deletion', () => {
      expect(validateFillInBlank('abjet', 'abject')).toBe(true); // missing c
    });

    it('rejects 2 character differences', () => {
      expect(validateFillInBlank('abjxxt', 'abject')).toBe(false); // 2 substitutions
      expect(validateFillInBlank('abxxx', 'abject')).toBe(false); // too different
    });
  });

  describe('word variations', () => {
    it('accepts plural with s', () => {
      expect(validateFillInBlank('abjects', 'abject')).toBe(true);
    });

    it('accepts plural with es', () => {
      expect(validateFillInBlank('abjectes', 'abject')).toBe(true);
    });

    it('accepts past tense with d', () => {
      expect(validateFillInBlank('abjectd', 'abject')).toBe(true);
    });

    it('accepts past tense with ed', () => {
      expect(validateFillInBlank('abjected', 'abject')).toBe(true);
    });

    it('accepts present participle with ing', () => {
      expect(validateFillInBlank('abjecting', 'abject')).toBe(true);
    });

    it('accepts adverb with ly', () => {
      expect(validateFillInBlank('abjectly', 'abject')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('rejects empty answer', () => {
      expect(validateFillInBlank('', 'abject')).toBe(false);
    });

    it('rejects whitespace-only answer', () => {
      expect(validateFillInBlank('   ', 'abject')).toBe(false);
    });

    it('handles short words correctly', () => {
      expect(validateFillInBlank('at', 'at')).toBe(true);
      expect(validateFillInBlank('a', 'at')).toBe(true); // 1 char diff OK
      expect(validateFillInBlank('x', 'at')).toBe(false); // 2 char diff
    });

    it('handles single character words', () => {
      expect(validateFillInBlank('a', 'a')).toBe(true);
      expect(validateFillInBlank('b', 'a')).toBe(true); // 1 substitution
    });
  });

  describe('real word examples', () => {
    it('validates "aberration" variations', () => {
      expect(validateFillInBlank('aberration', 'aberration')).toBe(true);
      expect(validateFillInBlank('aberrations', 'aberration')).toBe(true);
      expect(validateFillInBlank('aberating', 'aberration')).toBe(false); // too different
    });

    it('validates "abjure" variations', () => {
      expect(validateFillInBlank('abjure', 'abjure')).toBe(true);
      expect(validateFillInBlank('abjured', 'abjure')).toBe(true);
      expect(validateFillInBlank('abjuring', 'abjure')).toBe(true);
    });
  });
});
