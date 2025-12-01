import { ProgressAction, ProgressRequest, ErrorCodes } from './types.js';

const VALID_ACTIONS: ProgressAction[] = ['get', 'save', 'check-username'];
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

export class ValidationError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

export function validateRequest(body: unknown): ProgressRequest {
  if (body === null || typeof body !== 'object') {
    throw new ValidationError('Request body must be an object', ErrorCodes.INVALID_JSON);
  }

  const data = body as Record<string, unknown>;

  // Validate action
  if (!data.action || typeof data.action !== 'string') {
    throw new ValidationError('Action is required and must be a string', ErrorCodes.INVALID_ACTION);
  }

  if (!VALID_ACTIONS.includes(data.action as ProgressAction)) {
    throw new ValidationError(
      `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`,
      ErrorCodes.INVALID_ACTION
    );
  }

  // Validate username
  if (!data.username || typeof data.username !== 'string') {
    throw new ValidationError('Username is required and must be a string', ErrorCodes.INVALID_USERNAME);
  }

  const username = data.username.trim();

  if (username.length < USERNAME_MIN_LENGTH) {
    throw new ValidationError(
      `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
      ErrorCodes.INVALID_USERNAME
    );
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    throw new ValidationError(
      `Username must be at most ${USERNAME_MAX_LENGTH} characters`,
      ErrorCodes.INVALID_USERNAME
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    throw new ValidationError(
      'Username can only contain letters, numbers, underscores, and hyphens',
      ErrorCodes.INVALID_USERNAME
    );
  }

  // Validate progressData for save action
  if (data.action === 'save') {
    if (!data.progressData || typeof data.progressData !== 'object') {
      throw new ValidationError(
        'progressData is required for save action and must be an object',
        ErrorCodes.MISSING_PROGRESS_DATA
      );
    }
  }

  return {
    action: data.action as ProgressAction,
    username,
    progressData: data.progressData as ProgressRequest['progressData'],
  };
}
