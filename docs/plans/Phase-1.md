# Phase 1: Backend Implementation

## Phase Goal

Build the complete AWS SAM backend including DynamoDB table, Lambda handler, API Gateway, and deployment scripts. The backend will provide a single endpoint for all progress sync operations.

**Success Criteria:**
- SAM template deploys successfully
- Lambda handles all three actions (get, save, check-username)
- Deploy script generates config and updates frontend .env
- All unit and integration tests pass with mocked DynamoDB

**Estimated Tokens:** ~45,000

## Prerequisites

- Phase 0 complete (backend directory structure, CI updated)
- AWS CLI configured with valid credentials
- SAM CLI installed

---

## Tasks

### Task 1: Create SAM Template

**Goal:** Define the AWS infrastructure using SAM template with DynamoDB table, Lambda function, and API Gateway.

**Files to Create:**
- `backend/template.yaml`

**Prerequisites:**
- Backend directory structure exists (Phase 0)

**Implementation Steps:**
- Create SAM template with Transform `AWS::Serverless-2016-10-31`
- Define parameters: `AllowedOrigins`, `LambdaMemory`, `LambdaTimeout`
- Create DynamoDB table resource with:
  - Table name: `${AWS::StackName}-UserProgress`
  - Partition key: `username` (String)
  - Billing mode: PAY_PER_REQUEST
  - No TTL (progress data persists indefinitely)
- Create Lambda function resource with:
  - Runtime: nodejs20.x
  - Handler: `dist/index.handler`
  - Memory and timeout from parameters
  - Environment variable for table name
  - IAM policy for DynamoDB read/write
- Create HTTP API (API Gateway v2) with:
  - CORS configuration using AllowedOrigins parameter
  - Single POST route `/progress`
  - Default throttling (100 burst, 50 RPS)
- Define outputs: `VocabularySyncApiUrl`, `UserProgressTableName`

**Verification Checklist:**
- [ ] `sam validate` passes
- [ ] Template includes all three resources (DynamoDB, Lambda, API Gateway)
- [ ] CORS is parameterized via AllowedOrigins
- [ ] Lambda has DynamoDB permissions scoped to the table
- [ ] Outputs include API URL

**Testing Instructions:**
- Run `sam validate` in backend directory
- Review template for security best practices (least privilege IAM)

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

feat(backend): add SAM template with DynamoDB and API Gateway

- Define UserProgress DynamoDB table with username partition key
- Configure Lambda with parameterized memory and timeout
- Set up HTTP API with CORS and throttling
- Add stack outputs for API URL and table name
```

---

### Task 2: Implement Request Validation and Types

**Goal:** Create TypeScript types and validation logic for API requests and responses.

**Files to Create:**
- `backend/src/types.ts`
- `backend/src/validation.ts`

**Prerequisites:**
- Task 1 complete (template exists for context)

**Implementation Steps:**

**types.ts:**
- Define `ProgressAction` type: `'get' | 'save' | 'check-username'`
- Define `ProgressRequest` interface with action, username, progressData (optional)
- Define `ProgressResponse` interface (union type for different actions)
- Define `ErrorResponse` interface with error message and code
- Copy/adapt `UserProgress` and related types from frontend (or define compatible versions)

**validation.ts:**
- Create `validateRequest(body: unknown): ProgressRequest` function
- Validate action is one of allowed values
- Validate username is non-empty string, alphanumeric, reasonable length (3-30 chars)
- Validate progressData present and is object for 'save' action
- Throw descriptive errors for validation failures
- Export validation error codes as constants

**Verification Checklist:**
- [ ] Types compile without errors
- [ ] Validation rejects invalid action values
- [ ] Validation rejects empty/invalid usernames
- [ ] Validation requires progressData for save action
- [ ] Error messages are clear and include error codes

**Testing Instructions:**
- Write unit tests for validation function
- Test valid requests for each action type
- Test invalid action, empty username, missing progressData

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

feat(backend): add request types and validation

- Define ProgressRequest and ProgressResponse types
- Implement validateRequest with action and username validation
- Add error codes for validation failures
- Include unit tests for validation logic
```

---

### Task 3: Implement DynamoDB Operations

**Goal:** Create data access layer for DynamoDB operations.

**Files to Create:**
- `backend/src/db.ts`

**Prerequisites:**
- Task 2 complete (types available)

**Implementation Steps:**
- Import DynamoDBDocumentClient from `@aws-sdk/lib-dynamodb`
- Create singleton client instance
- Read table name from `TABLE_NAME` environment variable
- Implement `checkUsernameExists(username: string): Promise<boolean>`
  - Use GetCommand with ProjectionExpression to check existence efficiently
  - Return true if item exists, false otherwise
- Implement `getProgress(username: string): Promise<{progressData, lastSyncedAt} | null>`
  - Use GetCommand to fetch full item
  - Return null if user doesn't exist
- Implement `saveProgress(username: string, progressData: UserProgress): Promise<string>`
  - Use PutCommand to store/update item
  - Set lastSyncedAt to current ISO timestamp
  - Set createdAt only if item is new (use ConditionExpression or always set)
  - Return the lastSyncedAt timestamp

**Verification Checklist:**
- [ ] Client is created as singleton
- [ ] Table name read from environment variable
- [ ] checkUsernameExists returns boolean
- [ ] getProgress returns null for non-existent user
- [ ] saveProgress sets lastSyncedAt timestamp
- [ ] All functions handle DynamoDB errors gracefully

**Testing Instructions:**
- Write unit tests using aws-sdk-client-mock
- Mock GetCommand responses for exists/not-exists cases
- Mock PutCommand and verify item structure
- Test error handling for DynamoDB failures

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

feat(backend): implement DynamoDB data access layer

- Create DynamoDB document client singleton
- Add checkUsernameExists for username validation
- Add getProgress to fetch user progress data
- Add saveProgress with timestamp tracking
- Include unit tests with mocked DynamoDB client
```

---

### Task 4: Implement Lambda Handler

**Goal:** Create the main Lambda handler that routes requests to appropriate operations.

**Files to Create:**
- `backend/src/index.ts`

**Prerequisites:**
- Tasks 2 and 3 complete (validation and db modules)

**Implementation Steps:**
- Import validation and db modules
- Export `handler` function matching APIGatewayProxyHandlerV2 signature
- Parse request body (handle JSON parse errors)
- Call validateRequest (catch validation errors → 400 response)
- Route based on action:
  - `check-username`: call checkUsernameExists, return `{ exists: boolean }`
  - `get`: call getProgress, return data or 404 if null
  - `save`: call saveProgress, return `{ success: true, lastSyncedAt }`
- Wrap all operations in try-catch for 500 errors
- Return consistent response format with appropriate status codes
- Include CORS headers in all responses (Access-Control-Allow-Origin from env)

**Response Format:**
```typescript
return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*'
  },
  body: JSON.stringify(responseData)
};
```

**Verification Checklist:**
- [ ] Handler parses JSON body correctly
- [ ] Validation errors return 400 with error details
- [ ] check-username returns `{ exists: boolean }`
- [ ] get returns progress data or 404
- [ ] save returns success response with timestamp
- [ ] CORS headers included in all responses
- [ ] Unexpected errors return 500 with generic message

**Testing Instructions:**
- Write integration tests with mocked DynamoDB
- Test each action type with valid input
- Test validation error responses
- Test 404 response for non-existent user
- Test 500 response for simulated DynamoDB failure

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

feat(backend): implement Lambda handler with action routing

- Parse and validate incoming requests
- Route to check-username, get, or save operations
- Return consistent response format with CORS headers
- Handle errors with appropriate status codes
- Include integration tests for all actions
```

---

### Task 5: Configure Build System

**Goal:** Set up esbuild for Lambda bundling and npm scripts.

**Files to Modify:**
- `backend/package.json`

**Files to Create:**
- `backend/build.js` (optional, if complex build needed)

**Prerequisites:**
- Task 4 complete (source files exist)

**Implementation Steps:**
- Add build script using esbuild:
  - Entry point: `src/index.ts`
  - Output: `dist/index.js`
  - Platform: node
  - Target: node20
  - Bundle: true
  - Minify: true (production)
  - External: `@aws-sdk/*` (provided by Lambda runtime)
  - Format: esm or cjs (match Lambda expectations)
- Add scripts to package.json:
  - `build`: run esbuild
  - `type-check`: `tsc --noEmit`
  - `test`: `jest`
  - `deploy`: `node scripts/deploy.js`
- Verify SAM build integration (SAM should use npm run build)

**Verification Checklist:**
- [ ] `npm run build` produces `dist/index.js`
- [ ] Bundle excludes AWS SDK (external)
- [ ] `npm run type-check` passes
- [ ] `npm test` runs jest
- [ ] Built output is valid JavaScript

**Testing Instructions:**
- Run `npm run build` and verify dist/index.js exists
- Check bundle size is reasonable (<100KB)
- Run `sam build` and verify it uses the build output

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

chore(backend): configure esbuild and npm scripts

- Add esbuild configuration for Lambda bundling
- Externalize AWS SDK for smaller bundle
- Add build, type-check, test, and deploy scripts
- Configure SAM to use npm build output
```

---

### Task 6: Implement Deploy Script

**Goal:** Create interactive deployment script that manages config, generates samconfig.toml, deploys, and updates frontend .env.

**Files to Create:**
- `backend/scripts/deploy.js`

**Prerequisites:**
- Tasks 1-5 complete (template and build working)

**Implementation Steps:**
- Use ES modules (type: module in package.json)
- Implement prerequisite checks:
  - Check AWS CLI configured (`aws sts get-caller-identity`)
  - Check SAM CLI installed (`sam --version`)
- Implement config loading/prompting:
  - Read `.deploy-config.json` if exists
  - Prompt for missing values: region, stackName, allowedOrigins, lambdaMemory, lambdaTimeout
  - Validate values (memory 128-10240, timeout 1-900)
  - Save config to `.deploy-config.json`
- Implement samconfig.toml generation:
  - Build parameter_overrides string from config
  - Write samconfig.toml with stack_name, region, capabilities, parameter_overrides
  - Do NOT use `sam --guided`
- Implement build and deploy:
  - Run `sam build`
  - Run `sam deploy --no-confirm-changeset --no-fail-on-empty-changeset`
- Implement output capture:
  - Query CloudFormation for stack outputs
  - Find `VocabularySyncApiUrl` output
  - Update/create frontend `.env` with `EXPO_PUBLIC_SYNC_API_URL`

**Verification Checklist:**
- [ ] Script checks for AWS CLI and SAM CLI
- [ ] Config is loaded from file if exists
- [ ] Missing config values are prompted
- [ ] Config is validated before use
- [ ] samconfig.toml is generated (not sam --guided)
- [ ] SAM build and deploy are executed
- [ ] Frontend .env is updated with API URL
- [ ] Script is executable (`chmod +x`)

**Testing Instructions:**
- Test with no existing config (should prompt)
- Test with existing config (should skip prompts)
- Test config validation (reject invalid memory/timeout)
- Manual deployment test to verify end-to-end

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

feat(deploy): add interactive deployment script

- Check prerequisites (AWS CLI, SAM CLI)
- Load or prompt for deployment configuration
- Validate config values before use
- Generate samconfig.toml programmatically
- Execute sam build and deploy
- Capture outputs and update frontend .env
```

---

### Task 7: Add Comprehensive Tests

**Goal:** Ensure full test coverage for all backend modules with mocked AWS services.

**Files to Create:**
- `backend/src/__tests__/validation.test.ts`
- `backend/src/__tests__/db.test.ts`
- `backend/src/__tests__/handler.test.ts`
- `backend/jest.config.js`

**Prerequisites:**
- Tasks 2-4 complete (source modules exist)

**Implementation Steps:**

**jest.config.js:**
- Configure ts-jest for TypeScript
- Set test environment to node
- Configure coverage thresholds (aim for 80%+)
- Set up module name mapping if needed

**validation.test.ts:**
- Test valid requests for each action type
- Test invalid action rejection
- Test username validation (empty, too short, too long, invalid chars)
- Test progressData requirement for save action

**db.test.ts:**
- Use aws-sdk-client-mock to mock DynamoDBDocumentClient
- Test checkUsernameExists returns true when item exists
- Test checkUsernameExists returns false when item doesn't exist
- Test getProgress returns data when user exists
- Test getProgress returns null when user doesn't exist
- Test saveProgress writes correct item structure
- Test error handling for DynamoDB failures

**handler.test.ts:**
- Mock db module functions
- Test full request flow for each action
- Test JSON parse error handling
- Test validation error responses (400)
- Test not found responses (404)
- Test internal error responses (500)
- Verify CORS headers in responses

**Verification Checklist:**
- [ ] `npm test` passes all tests
- [ ] Coverage report shows 80%+ coverage
- [ ] All three action types tested
- [ ] Error paths tested
- [ ] No live AWS calls in tests

**Testing Instructions:**
- Run `npm test` and verify all tests pass
- Run `npm test -- --coverage` and review coverage report
- Verify CI pipeline passes with tests

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

test(backend): add comprehensive unit and integration tests

- Configure Jest with ts-jest and coverage
- Add validation tests for all request types
- Add DynamoDB tests with aws-sdk-client-mock
- Add handler integration tests
- Achieve 80%+ code coverage
```

---

### Task 8: Update .gitignore and Documentation

**Goal:** Ensure sensitive files are ignored and add basic documentation.

**Files to Modify:**
- `backend/.gitignore`
- `.gitignore` (root, if needed)

**Files to Create:**
- `backend/README.md`

**Prerequisites:**
- All previous tasks complete

**Implementation Steps:**

**backend/.gitignore additions:**
```
# Deployment config (contains region/stack preferences)
.deploy-config.json

# SAM build artifacts
.aws-sam/

# Generated config
samconfig.toml

# Dependencies
node_modules/

# Build output
dist/

# Coverage
coverage/
```

**backend/README.md:**
- Brief description of backend purpose
- Prerequisites (AWS CLI, SAM CLI, Node 20)
- Quick start commands (`npm install`, `npm run deploy`)
- Available npm scripts
- Environment variables used by Lambda
- API endpoint documentation (actions, request/response formats)

**Verification Checklist:**
- [ ] .deploy-config.json is git-ignored
- [ ] samconfig.toml is git-ignored
- [ ] .aws-sam/ directory is git-ignored
- [ ] README includes deployment instructions
- [ ] README documents API format

**Testing Instructions:**
- Run `git status` after deployment to verify ignored files
- Verify README renders correctly on GitHub

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

docs(backend): add README and update gitignore

- Document deployment prerequisites and commands
- Add API endpoint documentation
- Ignore deployment config and SAM artifacts
```

---

## Phase Verification

**Phase 1 is complete when:**
- [x] `sam validate` passes in backend/
- [x] `npm test` passes with 80%+ coverage (97% achieved)
- [ ] `npm run deploy` successfully deploys stack (manual verification)
- [ ] API responds to curl requests for all actions
- [ ] Frontend .env is updated with API URL after deploy
- [ ] CI pipeline passes (backend job green)

**Manual Verification Commands:**
```bash
# After deployment, test API
API_URL=$(grep EXPO_PUBLIC_SYNC_API_URL .env | cut -d= -f2)

# Test check-username (new user)
curl -X POST "$API_URL/progress" \
  -H "Content-Type: application/json" \
  -d '{"action":"check-username","username":"testuser123"}'
# Expected: {"exists":false}

# Test save
curl -X POST "$API_URL/progress" \
  -H "Content-Type: application/json" \
  -d '{"action":"save","username":"testuser123","progressData":{"globalStats":{"allTimeCorrect":10}}}'
# Expected: {"success":true,"lastSyncedAt":"..."}

# Test check-username (existing user)
curl -X POST "$API_URL/progress" \
  -H "Content-Type: application/json" \
  -d '{"action":"check-username","username":"testuser123"}'
# Expected: {"exists":true}

# Test get
curl -X POST "$API_URL/progress" \
  -H "Content-Type: application/json" \
  -d '{"action":"get","username":"testuser123"}'
# Expected: {"progressData":{...},"lastSyncedAt":"..."}
```

**Integration Points for Phase 2:**
- Frontend will call `EXPO_PUBLIC_SYNC_API_URL/progress`
- Request/response formats defined in types.ts
- Error codes defined in validation.ts

**Known Limitations:**
- No rate limiting per user (only API Gateway throttling)
- No data validation on progressData structure (trusts client)
- No backup/export mechanism for user data
