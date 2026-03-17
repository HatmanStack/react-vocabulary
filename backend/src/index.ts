import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { validateRequest, ValidationError } from './validation.js';
import { checkUsernameExists, getProgress, saveProgress } from './db.js';
import { ErrorCodes, ErrorResponse } from './types.js';

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';

function createResponse(
  statusCode: number,
  body: unknown
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  };
}

function createErrorResponse(
  statusCode: number,
  error: string,
  code: string
): APIGatewayProxyResultV2 {
  const body: ErrorResponse = { error, code };
  return createResponse(statusCode, body);
}

// ARCHITECTURAL DECISION: No authentication by design.
// This API uses username-only identification (no passwords, tokens, or sessions)
// to minimize friction for a vocabulary learning app. Users are advised to choose
// a unique username for privacy. This is an intentional trade-off: simplicity over
// strict access control. The data stored is non-sensitive learning progress only.
export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return createErrorResponse(400, 'Invalid JSON in request body', ErrorCodes.INVALID_JSON);
    }

    // Validate request
    let request;
    try {
      request = validateRequest(body);
    } catch (err) {
      if (err instanceof ValidationError) {
        return createErrorResponse(400, err.message, err.code);
      }
      throw err;
    }

    // Route based on action
    switch (request.action) {
      case 'check-username': {
        const exists = await checkUsernameExists(request.username);
        return createResponse(200, { exists });
      }

      case 'get': {
        const result = await getProgress(request.username);
        if (!result) {
          return createErrorResponse(404, 'User not found', ErrorCodes.USER_NOT_FOUND);
        }
        return createResponse(200, result);
      }

      case 'save': {
        const lastSyncedAt = await saveProgress(request.username, request.progressData!);
        return createResponse(200, { success: true, lastSyncedAt });
      }

      default:
        return createErrorResponse(400, 'Invalid action', ErrorCodes.INVALID_ACTION);
    }
  } catch (err) {
    console.error('Handler error:', err);
    return createErrorResponse(500, 'Internal server error', ErrorCodes.INTERNAL_ERROR);
  }
}
