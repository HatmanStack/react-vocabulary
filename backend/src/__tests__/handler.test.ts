import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ErrorCodes } from '../types.js';

// Mock the db module before importing handler
jest.unstable_mockModule('../db.js', () => ({
  checkUsernameExists: jest.fn(),
  getProgress: jest.fn(),
  saveProgress: jest.fn(),
  docClient: {},
}));

// Import after mocking
const { handler } = await import('../index.js');
const db = await import('../db.js');

const mockDb = {
  checkUsernameExists: db.checkUsernameExists as jest.Mock,
  getProgress: db.getProgress as jest.Mock,
  saveProgress: db.saveProgress as jest.Mock,
};

// Helper to create mock event
function createEvent(body: unknown): APIGatewayProxyEventV2 {
  return {
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: {},
    isBase64Encoded: false,
    rawPath: '/progress',
    rawQueryString: '',
    requestContext: {} as APIGatewayProxyEventV2['requestContext'],
    routeKey: 'POST /progress',
    version: '2.0',
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ALLOWED_ORIGINS = '*';
});

describe('handler', () => {
  describe('JSON parsing', () => {
    it('should return 400 for invalid JSON', async () => {
      const event = createEvent('invalid json');
      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.code).toBe(ErrorCodes.INVALID_JSON);
    });

    it('should handle empty body', async () => {
      const event = { ...createEvent({}), body: '' };
      const result = await handler(event);

      expect(result.statusCode).toBe(400);
    });
  });

  describe('check-username action', () => {
    it('should return exists: false for new user', async () => {
      mockDb.checkUsernameExists.mockResolvedValue(false);

      const event = createEvent({
        action: 'check-username',
        username: 'newuser',
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body).toEqual({ exists: false });
    });

    it('should return exists: true for existing user', async () => {
      mockDb.checkUsernameExists.mockResolvedValue(true);

      const event = createEvent({
        action: 'check-username',
        username: 'existinguser',
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body).toEqual({ exists: true });
    });
  });

  describe('get action', () => {
    it('should return progress data for existing user', async () => {
      const mockProgress = {
        progressData: {
          listLevelProgress: {},
          globalStats: {
            allTimeHints: 5,
            allTimeWrong: 2,
            allTimeCorrect: 20,
            totalWordsLearned: 10,
            listsCompleted: [],
          },
        },
        lastSyncedAt: '2024-01-15T10:00:00.000Z',
      };

      mockDb.getProgress.mockResolvedValue(mockProgress);

      const event = createEvent({
        action: 'get',
        username: 'testuser',
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body).toEqual(mockProgress);
    });

    it('should return 404 for non-existent user', async () => {
      mockDb.getProgress.mockResolvedValue(null);

      const event = createEvent({
        action: 'get',
        username: 'nonexistent',
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body as string);
      expect(body.code).toBe(ErrorCodes.USER_NOT_FOUND);
    });
  });

  describe('save action', () => {
    it('should save progress and return success', async () => {
      const timestamp = '2024-01-15T10:00:00.000Z';
      mockDb.saveProgress.mockResolvedValue(timestamp);

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

      const event = createEvent({
        action: 'save',
        username: 'testuser',
        progressData,
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body).toEqual({ success: true, lastSyncedAt: timestamp });

      expect(mockDb.saveProgress).toHaveBeenCalledWith('testuser', progressData);
    });
  });

  describe('validation errors', () => {
    it('should return 400 for invalid action', async () => {
      const event = createEvent({
        action: 'invalid',
        username: 'testuser',
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.code).toBe(ErrorCodes.INVALID_ACTION);
    });

    it('should return 400 for invalid username', async () => {
      const event = createEvent({
        action: 'get',
        username: 'ab', // too short
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.code).toBe(ErrorCodes.INVALID_USERNAME);
    });

    it('should return 400 for save without progressData', async () => {
      const event = createEvent({
        action: 'save',
        username: 'testuser',
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.code).toBe(ErrorCodes.MISSING_PROGRESS_DATA);
    });
  });

  describe('error handling', () => {
    it('should return 500 for internal errors', async () => {
      mockDb.checkUsernameExists.mockRejectedValue(new Error('Database error'));

      const event = createEvent({
        action: 'check-username',
        username: 'testuser',
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body as string);
      expect(body.code).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('CORS headers', () => {
    it('should include CORS headers in response', async () => {
      mockDb.checkUsernameExists.mockResolvedValue(false);

      const event = createEvent({
        action: 'check-username',
        username: 'testuser',
      });
      const result = await handler(event);

      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('');
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });
  });
});
