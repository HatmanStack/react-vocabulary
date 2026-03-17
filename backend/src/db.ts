import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { UserProgress, UserProgressItem } from './types.js';

// Singleton client instance
const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';

/**
 * Check if a username exists in the database
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { username },
      ProjectionExpression: 'username',
    })
  );

  return result.Item !== undefined;
}

/**
 * Get progress data for a user
 * Returns null if user doesn't exist
 */
export async function getProgress(
  username: string
): Promise<{ progressData: UserProgress; lastSyncedAt: string } | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { username },
    })
  );

  if (!result.Item) {
    return null;
  }

  const item = result.Item as UserProgressItem;
  return {
    progressData: item.progressData,
    lastSyncedAt: item.lastSyncedAt,
  };
}

/**
 * Save progress data for a user
 * Creates or updates the item atomically using UpdateCommand.
 * Uses if_not_exists for createdAt to preserve original creation time.
 * Returns the lastSyncedAt timestamp.
 */
export async function saveProgress(
  username: string,
  progressData: UserProgress
): Promise<string> {
  const now = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { username },
      UpdateExpression:
        'SET progressData = :pd, lastSyncedAt = :now, createdAt = if_not_exists(createdAt, :now)',
      ExpressionAttributeValues: {
        ':pd': progressData,
        ':now': now,
      },
    })
  );

  return now;
}
