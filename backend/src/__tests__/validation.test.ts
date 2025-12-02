import { describe, it, expect } from '@jest/globals';
import { validateRequest, ValidationError } from '../validation.js';
import { ErrorCodes } from '../types.js';

describe('validateRequest', () => {
  describe('valid requests', () => {
    it('should accept valid check-username request', () => {
      const result = validateRequest({
        action: 'check-username',
        username: 'testuser',
      });

      expect(result).toEqual({
        action: 'check-username',
        username: 'testuser',
        progressData: undefined,
      });
    });

    it('should accept valid get request', () => {
      const result = validateRequest({
        action: 'get',
        username: 'testuser',
      });

      expect(result).toEqual({
        action: 'get',
        username: 'testuser',
        progressData: undefined,
      });
    });

    it('should accept valid save request', () => {
      const progressData = {
        listLevelProgress: {},
        globalStats: {
          allTimeHints: 0,
          allTimeWrong: 0,
          allTimeCorrect: 10,
          totalWordsLearned: 5,
          listsCompleted: [],
        },
      };

      const result = validateRequest({
        action: 'save',
        username: 'testuser',
        progressData,
      });

      expect(result).toEqual({
        action: 'save',
        username: 'testuser',
        progressData,
      });
    });

    it('should trim whitespace from username', () => {
      const result = validateRequest({
        action: 'get',
        username: '  testuser  ',
      });

      expect(result.username).toBe('testuser');
    });

    it('should accept username with underscores and hyphens', () => {
      const result = validateRequest({
        action: 'get',
        username: 'test_user-123',
      });

      expect(result.username).toBe('test_user-123');
    });
  });

  describe('invalid action', () => {
    it('should reject missing action', () => {
      expect(() => validateRequest({ username: 'testuser' }))
        .toThrow(ValidationError);

      try {
        validateRequest({ username: 'testuser' });
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect((err as ValidationError).code).toBe(ErrorCodes.INVALID_ACTION);
      }
    });

    it('should reject non-string action', () => {
      expect(() => validateRequest({ action: 123, username: 'testuser' }))
        .toThrow(ValidationError);
    });

    it('should reject invalid action value', () => {
      expect(() => validateRequest({ action: 'invalid', username: 'testuser' }))
        .toThrow(ValidationError);
    });
  });

  describe('invalid username', () => {
    it('should reject missing username', () => {
      try {
        validateRequest({ action: 'get' });
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect((err as ValidationError).code).toBe(ErrorCodes.INVALID_USERNAME);
      }
    });

    it('should reject non-string username', () => {
      expect(() => validateRequest({ action: 'get', username: 123 }))
        .toThrow(ValidationError);
    });

    it('should reject username shorter than 3 characters', () => {
      expect(() => validateRequest({ action: 'get', username: 'ab' }))
        .toThrow(ValidationError);
    });

    it('should reject username longer than 30 characters', () => {
      const longUsername = 'a'.repeat(31);
      expect(() => validateRequest({ action: 'get', username: longUsername }))
        .toThrow(ValidationError);
    });

    it('should reject username with invalid characters', () => {
      expect(() => validateRequest({ action: 'get', username: 'test@user' }))
        .toThrow(ValidationError);

      expect(() => validateRequest({ action: 'get', username: 'test user' }))
        .toThrow(ValidationError);

      expect(() => validateRequest({ action: 'get', username: 'test.user' }))
        .toThrow(ValidationError);
    });
  });

  describe('progressData validation for save', () => {
    it('should reject save without progressData', () => {
      try {
        validateRequest({ action: 'save', username: 'testuser' });
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect((err as ValidationError).code).toBe(ErrorCodes.MISSING_PROGRESS_DATA);
      }
    });

    it('should reject save with non-object progressData', () => {
      expect(() =>
        validateRequest({ action: 'save', username: 'testuser', progressData: 'string' })
      ).toThrow(ValidationError);
    });

    it('should accept save with empty object progressData', () => {
      const result = validateRequest({
        action: 'save',
        username: 'testuser',
        progressData: {},
      });

      expect(result.progressData).toEqual({});
    });
  });

  describe('body validation', () => {
    it('should reject null body', () => {
      try {
        validateRequest(null);
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect((err as ValidationError).code).toBe(ErrorCodes.INVALID_JSON);
      }
    });

    it('should reject non-object body', () => {
      expect(() => validateRequest('string')).toThrow(ValidationError);
      expect(() => validateRequest(123)).toThrow(ValidationError);
      expect(() => validateRequest([])).toThrow(ValidationError);
    });
  });
});
