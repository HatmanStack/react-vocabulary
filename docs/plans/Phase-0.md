# Phase 0: Foundation

## Phase Goal

Establish architectural decisions, shared patterns, deployment infrastructure, and testing strategy that all subsequent phases will follow. This phase produces no application code but creates the foundational documents and scripts that ensure consistent implementation.

**Success Criteria:**
- Architecture Decision Records (ADRs) documented
- Deployment script specification complete
- Testing strategy defined with mocking approach
- Shared patterns and conventions established

**Estimated Tokens:** ~15,000

## Prerequisites

- Access to codebase
- Understanding of existing progressStore structure
- Familiarity with react-stocks backend patterns

## Architecture Decision Records (ADRs)

### ADR-001: Single DynamoDB Table Design

**Context:** Need to store user progress data in DynamoDB.

**Decision:** Use a single table with `username` as partition key and store the entire progress blob as a single item.

**Rationale:**
- Progress data is always read/written as a unit (no partial queries needed)
- Simpler API design (one get, one put)
- Atomic updates prevent partial sync states
- Lower DynamoDB costs (single item operations)

**Consequences:**
- Maximum item size is 400KB (sufficient for progress data)
- No ability to query individual word progress (acceptable - not needed)

**Schema:**
```
Table: {StackName}-UserProgress
PK: username (String)
Attributes:
  - progressData (Map) - full UserProgress object
  - lastSyncedAt (String) - ISO timestamp
  - createdAt (String) - ISO timestamp
```

### ADR-002: Single Lambda Endpoint with Action Routing

**Context:** Need API endpoints for progress sync operations.

**Decision:** Single `POST /progress` endpoint with `action` field in request body.

**Rationale:**
- Simpler API Gateway configuration
- Single Lambda cold start path
- Easier CORS configuration
- Matches the atomic nature of progress operations

**Actions:**
- `check-username`: Check if username exists (returns `{ exists: boolean }`)
- `get`: Fetch progress for username (returns `{ progressData, lastSyncedAt }` or 404)
- `save`: Store progress for username (creates or updates)

**Request Format:**
```json
{
  "action": "get" | "save" | "check-username",
  "username": "string",
  "progressData": { ... }  // only for "save" action
}
```

### ADR-003: Local-First with Higher-Wins Merge

**Context:** Need conflict resolution strategy when local and cloud data differ.

**Decision:** Local storage is authoritative during active use. On sync, merge using "higher wins" per field.

**Merge Rules:**
- Numeric fields (hints, attempts, scores): take maximum value
- State fields (wordState 0-3): take maximum value
- Date fields: take most recent date
- Arrays (listsCompleted, achievements): union of both sets
- Object fields (wordProgress, listLevelProgress): recursive merge

**Rationale:**
- Users never lose progress
- Works offline without conflicts
- Simple to implement and understand
- Matches user expectation ("my progress should only go up")

### ADR-004: Username Claim-Based Identity

**Context:** Need user identification without authentication complexity.

**Decision:** First user to enter a username claims it permanently. No passwords.

**Flow:**
1. User enters username
2. System checks if username exists (`check-username`)
3. If exists: warn "Username taken. Is this you?" → user confirms → pull and merge
4. If not exists: auto-create on first save

**Security Considerations:**
- No sensitive data stored (just learning progress)
- CORS restricts to known origins
- API Gateway throttling prevents abuse
- Acceptable risk for this use case

### ADR-005: CORS-Only API Security

**Context:** Need to secure API without authentication service.

**Decision:** Use CORS restrictions + API Gateway throttling. No Cognito/JWT.

**Configuration:**
- AllowedOrigins parameter in SAM template
- Production: specific domain(s)
- Development: `*` or `localhost:*`
- Throttling: 100 burst, 50 RPS (configurable)

**Rationale:**
- Progress data is not sensitive
- Complexity of auth outweighs benefits
- CORS prevents casual abuse
- Throttling prevents DoS

---

## Deployment Script Specification

### Overview

The deployment script (`backend/scripts/deploy.js`) handles interactive configuration, SAM config generation, deployment, and frontend environment injection.

### Script Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. Check Prerequisites                                  │
│     - AWS CLI configured                                │
│     - SAM CLI installed                                 │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  2. Load or Prompt Configuration                        │
│     - Read .deploy-config.json if exists                │
│     - Prompt for missing values                         │
│     - Validate all values                               │
│     - Save to .deploy-config.json                       │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  3. Generate samconfig.toml                             │
│     - Build from config values                          │
│     - NO sam --guided (we control the config)           │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  4. Build and Deploy                                    │
│     - sam build                                         │
│     - sam deploy --no-confirm-changeset                 │
└────────────────────────┬────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│  5. Capture Outputs & Update .env                       │
│     - Get stack outputs via AWS CLI                     │
│     - Write EXPO_PUBLIC_SYNC_API_URL to frontend .env   │
└─────────────────────────────────────────────────────────┘
```

### Configuration File (.deploy-config.json)

**Location:** `backend/.deploy-config.json` (git-ignored)

**Schema:**
```json
{
  "region": "us-west-2",
  "stackName": "vocabulary-sync",
  "allowedOrigins": "*",
  "lambdaMemory": 256,
  "lambdaTimeout": 10
}
```

**Defaults:**
- region: `us-west-2`
- stackName: `vocabulary-sync`
- allowedOrigins: `*`
- lambdaMemory: `256` (MB)
- lambdaTimeout: `10` (seconds)

### Generated samconfig.toml

```toml
version = 0.1
[default.deploy.parameters]
stack_name = "vocabulary-sync"
region = "us-west-2"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "AllowedOrigins=* LambdaMemory=256 LambdaTimeout=10"
resolve_s3 = true
```

### Frontend .env Injection

After deployment, script:
1. Queries CloudFormation for stack outputs
2. Finds `VocabularySyncApiUrl` output
3. Updates/creates `.env` with `EXPO_PUBLIC_SYNC_API_URL=<url>`

---

## Testing Strategy

### Unit Tests

**Backend (`backend/src/__tests__/`):**
- Handler logic tests with mocked DynamoDB client
- Validation tests for request parsing
- Merge logic tests (pure functions)

**Frontend (`src/**/__tests__/`):**
- Sync service tests with mocked fetch
- Merge utility tests (pure functions)
- Store integration tests with mocked sync service

### Integration Tests (Mocked)

**Backend:**
- Full handler invocation with mocked AWS SDK
- Use `aws-sdk-client-mock` for DynamoDB mocking
- Test all action types (get, save, check-username)

**Frontend:**
- Full sync flow with mocked API responses
- Test offline scenarios
- Test merge conflict scenarios

### Mocking Approach

**Backend - DynamoDB Mocking:**
```typescript
// Use @aws-sdk/client-dynamodb mock
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
});

// Mock specific commands
ddbMock.on(GetCommand).resolves({ Item: { ... } });
```

**Frontend - Fetch Mocking:**
```typescript
// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

// Mock specific responses
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve({ exists: true })
});
```

### CI Pipeline Configuration

**GitHub Actions (`.github/workflows/ci.yml`):**

The existing CI uses Node 24 and runs `npm run check` (which includes type-check, lint, and test). The backend job will use Node 20 to match the Lambda runtime.

```yaml
# Backend job (new)
backend:
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: backend
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'  # Match Lambda runtime
        cache: npm
        cache-dependency-path: backend/package-lock.json
    - run: npm ci
    - run: npm run check  # type-check && test

# Frontend job (existing - unchanged)
check:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 24
        cache: npm
    - run: npm ci
    - run: npm run check  # type-check && lint && test
```

**Note:** Backend uses Node 20 for Lambda compatibility; frontend uses Node 24 (existing setup).

**No live AWS resources in CI.** All tests use mocks.

---

## Shared Patterns and Conventions

### Error Handling Pattern

**Backend:**
```typescript
// Consistent error response format
interface ErrorResponse {
  error: string;
  code: string;
}

// HTTP status codes:
// 400 - Bad request (validation errors)
// 404 - User not found (for "get" action only)
// 500 - Internal server error
```

**Frontend:**
```typescript
// Sync errors don't block the app
// Log errors, show subtle indicator, retry later
interface SyncResult {
  success: boolean;
  error?: string;
  data?: UserProgress;
}
```

### Naming Conventions

**Backend:**
- Files: kebab-case (`progress-handler.ts`)
- Functions: camelCase (`handleGetProgress`)
- Types: PascalCase (`ProgressRequest`)
- Constants: SCREAMING_SNAKE_CASE (`TABLE_NAME`)

**Frontend:**
- Follows existing codebase conventions
- Services: `syncService.ts`
- Hooks: `useSync.ts`
- Components: PascalCase

### API Response Format

**Success Responses:**
```typescript
// check-username
{ "exists": boolean }

// get (success)
{
  "progressData": UserProgress,
  "lastSyncedAt": "ISO-8601"
}

// save (success)
{ "success": true, "lastSyncedAt": "ISO-8601" }
```

**Error Responses:**
```typescript
{
  "error": "Human readable message",
  "code": "MACHINE_CODE"
}
```

### Commit Message Format

All commits follow conventional commits:

```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

type(scope): brief description

- Detail 1
- Detail 2
```

**Types:** feat, fix, test, chore, docs, refactor
**Scopes:** backend, frontend, deploy, ci

---

## Tasks

### Task 1: Create Backend Directory Structure

**Goal:** Set up the backend folder structure matching react-stocks patterns.

**Files to Create:**
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/.gitignore`
- `backend/src/` (empty directory structure)

**Prerequisites:**
- None (first task)

**Implementation Steps:**
- Create `backend/` directory at project root
- Initialize with package.json containing dependencies: `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-dynamodb`, `esbuild`
- Dev dependencies: `typescript`, `@types/node`, `@types/aws-lambda`, `jest`, `ts-jest`, `aws-sdk-client-mock`
- Configure TypeScript for Node.js 20 with ESM
- Add .gitignore for node_modules, dist, .deploy-config.json

**Verification Checklist:**
- [ ] `backend/package.json` exists with correct dependencies
- [ ] `backend/tsconfig.json` compiles without errors
- [ ] `backend/.gitignore` excludes node_modules, dist, .deploy-config.json
- [ ] `npm install` completes successfully in backend/

**Testing Instructions:**
- Run `npm install` in backend directory
- Run `npx tsc --noEmit` to verify TypeScript config

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

chore(backend): initialize backend directory structure

- Add package.json with AWS SDK and dev dependencies
- Configure TypeScript for Node.js 20
- Add .gitignore for build artifacts and local config
```

---

### Task 2: Add Backend to CI Pipeline

**Goal:** Extend existing CI workflow to include backend type checking and tests.

**Files to Modify:**
- `.github/workflows/ci.yml`

**Prerequisites:**
- Task 1 complete

**Implementation Steps:**
- Add new job `backend` to existing workflow
- Set working-directory to `backend`
- Use Node 20 (Lambda runtime compatibility) with cache for backend/package-lock.json
- Steps: checkout, setup-node, npm ci, npm run check (type-check && test)
- Update status-check job to require both `check` and `backend` jobs
- Ensure job runs in parallel with existing `check` job

**Verification Checklist:**
- [ ] CI workflow syntax is valid (`act` or GitHub syntax check)
- [ ] Backend job runs independently of frontend job
- [ ] Type-check and test scripts are called

**Testing Instructions:**
- Validate workflow syntax
- Commit and verify GitHub Actions runs both jobs

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

ci: add backend type checking and tests to pipeline

- Add backend-tests job with Node.js 20
- Run type-check and jest tests
- Execute in parallel with frontend tests
```

---

## Phase Verification

**Phase 0 is complete when:**
- [x] Backend directory exists with valid package.json and tsconfig.json
- [x] `npm install` succeeds in backend/
- [x] CI workflow includes backend job
- [x] ADRs documented in this file for reference

**Integration Points:**
- Phase 1 will implement the Lambda handler following patterns defined here
- Phase 2 will implement frontend sync following error handling patterns defined here

**Known Limitations:**
- No actual application code yet
- Tests will initially be placeholder/empty until Phase 1

---

## Appendix: Type Definitions for Reference

These types from the existing codebase will be reused/referenced:

```typescript
// From src/shared/types/progress.ts
interface WordProgress {
  state: WordState;  // 0 | 1 | 2 | 3
  hintsUsed: number;
  wrongAttempts: number;
  correctAttempts: number;
  lastAttemptDate: string;
  firstAttemptDate: string;
  masteredDate?: string;
}

interface ListLevelProgress {
  listId: string;
  levelId: string;
  wordProgress: Record<string, WordProgress>;
  bestScore?: {
    hints: number;
    wrong: number;
    completedAt: string;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'performance' | 'consistency' | 'completion';
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

interface UserProgress {
  currentListId?: string;
  currentLevelId?: string;
  listLevelProgress: Record<string, ListLevelProgress>;
  globalStats: {
    allTimeHints: number;
    allTimeWrong: number;
    allTimeCorrect: number;
    totalWordsLearned: number;
    listsCompleted: string[];
  };
  achievements?: Achievement[];
  dailyProgress?: Record<string, number>;
}
```

These types will be shared between backend and frontend (either via copy or shared package).
