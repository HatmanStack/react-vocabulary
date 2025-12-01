# Vocabulary Sync Backend

AWS SAM backend for vocabulary progress synchronization.

## Prerequisites

- Node.js 20+
- AWS CLI configured with valid credentials
- SAM CLI installed

## Quick Start

```bash
npm install
npm run deploy
```

## Available Scripts

- `npm run build` - Bundle TypeScript for Lambda
- `npm run type-check` - Check TypeScript types
- `npm test` - Run tests
- `npm run check` - Run type-check and tests
- `npm run deploy` - Deploy to AWS (interactive)

## API Endpoint

All operations use `POST /progress` with an action in the request body.

### Actions

**check-username** - Check if a username exists

```json
{
  "action": "check-username",
  "username": "string"
}
```

Response:
```json
{ "exists": true | false }
```

**get** - Fetch progress for a user

```json
{
  "action": "get",
  "username": "string"
}
```

Response (200):
```json
{
  "progressData": { ... },
  "lastSyncedAt": "2024-01-15T10:00:00.000Z"
}
```

Response (404):
```json
{
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}
```

**save** - Store progress for a user

```json
{
  "action": "save",
  "username": "string",
  "progressData": { ... }
}
```

Response:
```json
{
  "success": true,
  "lastSyncedAt": "2024-01-15T10:00:00.000Z"
}
```

### Username Requirements

- 3-30 characters
- Letters, numbers, underscores, and hyphens only

### Error Response Format

```json
{
  "error": "Human readable message",
  "code": "MACHINE_CODE"
}
```

Error codes: `INVALID_ACTION`, `INVALID_USERNAME`, `MISSING_PROGRESS_DATA`, `USER_NOT_FOUND`, `INTERNAL_ERROR`, `INVALID_JSON`

## Environment Variables

Lambda uses these environment variables (set automatically by SAM):

- `TABLE_NAME` - DynamoDB table name
- `ALLOWED_ORIGINS` - CORS allowed origins

## Architecture

- **DynamoDB** - Single table storing progress per username
- **Lambda** - Node.js 20 handler for all operations
- **API Gateway HTTP API** - CORS-enabled endpoint with throttling
