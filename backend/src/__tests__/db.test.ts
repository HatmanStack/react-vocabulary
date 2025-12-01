import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { UserProgress } from '../types.js';

// Set TABLE_NAME before importing db module
process.env.TABLE_NAME = 'test-table';

// Import after setting env
const { checkUsernameExists, getProgress, saveProgress, docClient } = await import('../db.js');

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
});

describe('checkUsernameExists', () => {
  it('should return true when user exists', async () => {
    ddbMock.on(GetCommand).resolves({
      Item: { username: 'testuser' },
    });

    const result = await checkUsernameExists('testuser');

    expect(result).toBe(true);
    expect(ddbMock.calls()).toHaveLength(1);
    expect(ddbMock.call(0).args[0].input).toEqual({
      TableName: 'test-table',
      Key: { username: 'testuser' },
      ProjectionExpression: 'username',
    });
  });

  it('should return false when user does not exist', async () => {
    ddbMock.on(GetCommand).resolves({
      Item: undefined,
    });

    const result = await checkUsernameExists('nonexistent');

    expect(result).toBe(false);
  });
});

describe('getProgress', () => {
  it('should return progress data when user exists', async () => {
    const mockProgress: UserProgress = {
      listLevelProgress: {},
      globalStats: {
        allTimeHints: 5,
        allTimeWrong: 2,
        allTimeCorrect: 20,
        totalWordsLearned: 10,
        listsCompleted: ['list1'],
      },
    };

    ddbMock.on(GetCommand).resolves({
      Item: {
        username: 'testuser',
        progressData: mockProgress,
        lastSyncedAt: '2024-01-15T10:00:00.000Z',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    });

    const result = await getProgress('testuser');

    expect(result).toEqual({
      progressData: mockProgress,
      lastSyncedAt: '2024-01-15T10:00:00.000Z',
    });
  });

  it('should return null when user does not exist', async () => {
    ddbMock.on(GetCommand).resolves({
      Item: undefined,
    });

    const result = await getProgress('nonexistent');

    expect(result).toBeNull();
  });
});

describe('saveProgress', () => {
  const mockProgress: UserProgress = {
    listLevelProgress: {},
    globalStats: {
      allTimeHints: 0,
      allTimeWrong: 0,
      allTimeCorrect: 10,
      totalWordsLearned: 5,
      listsCompleted: [],
    },
  };

  it('should save new user progress and return timestamp', async () => {
    // First GetCommand for checking createdAt - user doesn't exist
    ddbMock.on(GetCommand).resolves({
      Item: undefined,
    });
    ddbMock.on(PutCommand).resolves({});

    const timestamp = await saveProgress('newuser', mockProgress);

    // Verify timestamp format
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // Verify PutCommand was called
    const putCall = ddbMock.calls().find(call => call.args[0] instanceof PutCommand);
    expect(putCall).toBeDefined();
    expect(putCall?.args[0].input.Item.username).toBe('newuser');
    expect(putCall?.args[0].input.Item.progressData).toEqual(mockProgress);
  });

  it('should preserve createdAt for existing user', async () => {
    const existingCreatedAt = '2024-01-01T00:00:00.000Z';

    ddbMock.on(GetCommand).resolves({
      Item: { createdAt: existingCreatedAt },
    });
    ddbMock.on(PutCommand).resolves({});

    await saveProgress('existinguser', mockProgress);

    const putCall = ddbMock.calls().find(call => call.args[0] instanceof PutCommand);
    expect(putCall?.args[0].input.Item.createdAt).toBe(existingCreatedAt);
  });

  it('should handle DynamoDB errors', async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });
    ddbMock.on(PutCommand).rejects(new Error('DynamoDB error'));

    await expect(saveProgress('testuser', mockProgress)).rejects.toThrow('DynamoDB error');
  });
});
