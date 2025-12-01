# Phase 2: Frontend Implementation

## Phase Goal

Implement the frontend sync functionality including the sync service, merge utilities, login UI flow, Settings integration, and automatic sync triggers. Users will be able to create/claim usernames, sync progress across devices, and see sync status.

**Success Criteria:**
- Sync service communicates with backend API
- Merge logic correctly resolves conflicts with "higher wins" strategy
- Login flow works in onboarding and Settings
- Auto-sync triggers on quiz completion, app foreground, and periodic interval
- Sync status indicator visible to user
- All tests pass with mocked fetch

**Estimated Tokens:** ~40,000

## Prerequisites

- Phase 1 complete (backend deployed and tested)
- `EXPO_PUBLIC_SYNC_API_URL` in `.env`
- Understanding of existing progressStore and Zustand patterns

---

## Tasks

### Task 1: Create Sync Service

**Goal:** Implement the API client for communicating with the backend sync endpoint.

**Files to Create:**
- `src/shared/services/` directory (new)
- `src/shared/services/syncService.ts`

**Prerequisites:**
- Backend deployed with API URL in .env

**Implementation Steps:**
- Read API URL from `process.env.EXPO_PUBLIC_SYNC_API_URL`
- Create typed functions for each API action:
  - `checkUsername(username: string): Promise<{ exists: boolean }>`
  - `getProgress(username: string): Promise<{ progressData: UserProgress, lastSyncedAt: string } | null>`
  - `saveProgress(username: string, progressData: UserProgress): Promise<{ success: boolean, lastSyncedAt: string }>`
- All functions call `POST /progress` with appropriate action in body
- Handle HTTP errors gracefully:
  - 404 from get → return null (user doesn't exist)
  - 400 → throw validation error with message
  - 500 → throw generic sync error
  - Network errors → throw with offline-friendly message
- Include timeout handling (10 second timeout)
- Export a `SyncError` class for typed error handling

**API URL Handling:**
```typescript
const API_URL = process.env.EXPO_PUBLIC_SYNC_API_URL;

// Gracefully handle missing URL (offline mode)
if (!API_URL) {
  console.warn('Sync API URL not configured, sync disabled');
}
```

**Verification Checklist:**
- [x] API URL read from environment variable
- [x] All three actions implemented
- [x] 404 response returns null (not throw)
- [x] Other HTTP errors throw SyncError
- [x] Network timeout handled
- [x] Missing API URL doesn't crash app

**Testing Instructions:**
- Write unit tests with mocked fetch
- Test successful responses for each action
- Test error handling (400, 500, network failure)
- Test timeout behavior
- Test missing API URL case

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

feat(frontend): add sync service for API communication

- Implement checkUsername, getProgress, saveProgress
- Handle HTTP errors with typed SyncError
- Add timeout handling for slow connections
- Gracefully handle missing API URL config
- Include unit tests with mocked fetch
```

---

### Task 2: Implement Merge Utilities

**Goal:** Create pure functions for merging local and cloud progress data using "higher wins" strategy.

**Files to Create:**
- `src/shared/utils/` directory (new)
- `src/shared/utils/mergeProgress.ts`

**Prerequisites:**
- Understanding of UserProgress type structure

**Implementation Steps:**
- Create `mergeProgress(local: UserProgress, cloud: UserProgress): UserProgress`
- Implement merge rules:
  - **globalStats**: take max of each numeric field, union of listsCompleted arrays
  - **listLevelProgress**: merge by key, for each ListLevelProgress merge wordProgress
  - **wordProgress**: for each word, take max of state, hintsUsed, wrongAttempts, correctAttempts; take latest dates
  - **achievements**: union by id, prefer unlocked version, take earliest unlockedAt
  - **dailyProgress**: merge by date key, take max count per date
- Create helper functions:
  - `mergeWordProgress(local: WordProgress, cloud: WordProgress): WordProgress`
  - `mergeListLevelProgress(local: ListLevelProgress, cloud: ListLevelProgress): ListLevelProgress`
  - `mergeAchievements(local: Achievement[], cloud: Achievement[]): Achievement[]`
- Handle undefined/missing fields gracefully (treat as empty/zero)
- Functions must be pure (no side effects)

**Merge Example:**
```typescript
// Local: word has state 2, cloud has state 3
// Result: state 3 (higher wins)

// Local: 5 hints, cloud: 3 hints
// Result: 5 hints (higher wins - more progress recorded)

// Local: lastAttemptDate 2024-01-15, cloud: 2024-01-10
// Result: 2024-01-15 (more recent)
```

**Verification Checklist:**
- [x] All numeric fields use max value
- [x] Date fields use most recent
- [x] Arrays use union (no duplicates)
- [x] Missing fields handled (undefined/null safe)
- [x] Pure functions (no mutations)
- [x] Deeply nested structures merged correctly

**Testing Instructions:**
- Write comprehensive unit tests
- Test each field type merge behavior
- Test edge cases: empty objects, undefined fields, null values
- Test deep merge of nested wordProgress
- Test achievement deduplication

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

feat(frontend): add progress merge utilities

- Implement mergeProgress with higher-wins strategy
- Add helpers for word, level, and achievement merging
- Handle undefined and missing fields safely
- Include comprehensive unit tests for all merge cases
```

---

### Task 3: Add Sync State to Progress Store

**Goal:** Extend progressStore with sync-related state and actions.

**Files to Modify:**
- `src/shared/store/progressStore.ts`

**Prerequisites:**
- Tasks 1-2 complete (sync service and merge utilities)

**Implementation Steps:**
- Add new state fields:
  ```typescript
  username: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncError: string | null;
  lastCloudSyncAt: string | null;
  ```
- Add new actions:
  - `setUsername(username: string | null): void`
  - `setSyncStatus(status: SyncStatus): void`
  - `syncToCloud(): Promise<void>` - saves current progress to cloud
  - `syncFromCloud(): Promise<void>` - fetches and merges cloud progress
  - `fullSync(): Promise<void>` - pull then push (for login/switch)
- Implement sync logic:
  - Check if username is set before syncing
  - Set syncStatus to 'syncing' during operation
  - On success: update lastCloudSyncAt, set status to 'success'
  - On error: set lastSyncError, set status to 'error'
  - Use merge utilities when pulling from cloud
- Persist username to AsyncStorage (separate key from progress)
- Load username on app start (loadFromStorage)

**Username Persistence:**
```typescript
const USERNAME_KEY = 'vocabulary-username';

// In loadFromStorage:
const storedUsername = await AsyncStorage.getItem(USERNAME_KEY);
if (storedUsername) {
  set({ username: storedUsername });
}

// In setUsername:
if (username) {
  await AsyncStorage.setItem(USERNAME_KEY, username);
} else {
  await AsyncStorage.removeItem(USERNAME_KEY);
}
```

**Verification Checklist:**
- [x] New state fields added (username, syncStatus, etc.)
- [x] setUsername persists to AsyncStorage
- [x] syncToCloud sends current progress to API
- [x] syncFromCloud merges cloud data with local
- [x] fullSync does pull-then-push
- [x] syncStatus reflects current operation state
- [x] Errors captured in lastSyncError

**Testing Instructions:**
- Mock syncService functions
- Test setUsername persists correctly
- Test syncToCloud calls saveProgress with current state
- Test syncFromCloud merges data correctly
- Test error handling sets appropriate status
- Test no-op when username is null

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

feat(frontend): add sync state and actions to progressStore

- Add username, syncStatus, lastSyncError state
- Implement syncToCloud and syncFromCloud actions
- Add fullSync for login flow (pull then push)
- Persist username to AsyncStorage
- Include tests with mocked sync service
```

---

### Task 4: Create Login Component

**Goal:** Build a reusable login/username entry component with claim-based flow.

**Files to Create:**
- `src/shared/ui/LoginPrompt.tsx`

**Prerequisites:**
- Task 3 complete (store has username state)

**Implementation Steps:**
- Create component that accepts props:
  ```typescript
  interface LoginPromptProps {
    onComplete: () => void;
    onSkip?: () => void;  // Optional skip for onboarding
  }
  ```
- Implement UI:
  - Text input for username (alphanumeric, 3-30 chars)
  - "Continue" button (disabled while checking/empty)
  - Loading state while checking username
  - Skip link (if onSkip provided)
- Implement flow:
  1. User enters username, taps Continue
  2. Call `checkUsername` from sync service
  3. If username doesn't exist:
     - Set username in store
     - Call `syncToCloud` to create user
     - Call onComplete
  4. If username exists:
     - Show confirmation dialog: "This username is taken. Is this you?"
     - If "Yes": set username, call `fullSync`, call onComplete
     - If "No": clear input, show error "Try a different username"
- Handle errors gracefully (show error message, allow retry)
- Use React Native Paper components for consistent styling

**Validation:**
- Username must be 3-30 characters
- Alphanumeric and underscores only
- Show validation error inline

**Verification Checklist:**
- [x] Username input with validation
- [x] Loading state during API calls
- [x] New username flow works (create + sync)
- [x] Existing username shows confirmation dialog
- [x] Confirmation "Yes" triggers fullSync
- [x] Confirmation "No" clears and shows error
- [x] Skip option works (if provided)
- [x] Error states displayed clearly

**Testing Instructions:**
- Test rendering with/without onSkip
- Test username validation (too short, invalid chars)
- Test new username flow (mock checkUsername returns false)
- Test existing username flow (mock checkUsername returns true)
- Test error handling (mock API failure)

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

feat(frontend): add LoginPrompt component

- Create reusable username entry with validation
- Implement claim-based flow with confirmation dialog
- Handle new user creation and existing user sync
- Add optional skip for onboarding use
- Include component tests
```

---

### Task 5: Integrate Login into Onboarding

**Goal:** Add login step to onboarding flow for new users.

**Files to Modify:**
- `src/features/onboarding/screens/OnboardingScreen.tsx`

**Prerequisites:**
- Task 4 complete (LoginPrompt component)

**Implementation Steps:**
- Identify where in onboarding flow to add login step
- Add new screen/step for username entry
- Use LoginPrompt component with onSkip enabled
- If user skips: proceed without username (local-only mode)
- If user completes: proceed with sync enabled
- Update onboarding completion logic to handle both paths
- Consider showing brief explanation of sync benefits before login

**Onboarding Flow:**
```
Welcome → Feature Intro → [Username Entry (skippable)] → Complete
```

**Verification Checklist:**
- [x] Login step appears in onboarding
- [x] Can complete onboarding with username
- [x] Can skip and complete without username
- [x] Username persists after onboarding complete
- [x] Sync works immediately after login

**Testing Instructions:**
- Test full onboarding flow with login
- Test skip functionality
- Verify username state after each path

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

feat(frontend): add login step to onboarding flow

- Add username entry screen to onboarding
- Allow skip for local-only mode
- Sync immediately on login completion
```

---

### Task 6: Add Username Management to Settings

**Goal:** Allow users to view, switch, or set username from Settings screen.

**Files to Modify:**
- `src/features/settings/screens/SettingsScreen.tsx`

**Prerequisites:**
- Tasks 3-4 complete (store sync state, LoginPrompt)

**Implementation Steps:**
- Add "Account" section to Settings (or equivalent)
- If username is set:
  - Show current username
  - Show last sync time (if available)
  - "Switch Account" button → opens LoginPrompt (without skip)
  - "Sync Now" button → triggers fullSync
- If username is not set:
  - Show "Set up cloud sync" option
  - Tapping opens LoginPrompt with skip option
- Show sync status indicator (syncing spinner, success check, error icon)
- Display lastSyncError if present

**UI Layout:**
```
Account
├── Username: @{username}  (or "Not set up")
├── Last synced: {time}    (or "Never")
├── [Sync Now] button      (if username set)
└── [Switch Account] or [Set Up Sync] button
```

**Verification Checklist:**
- [x] Username displayed when set
- [x] "Not set up" shown when no username
- [x] Switch Account opens LoginPrompt
- [x] Set Up Sync opens LoginPrompt with skip
- [x] Sync Now triggers fullSync
- [x] Sync status/errors displayed
- [x] Last sync time shown

**Testing Instructions:**
- Test Settings with username set
- Test Settings without username
- Test Switch Account flow
- Test Set Up Sync flow
- Test Sync Now button

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

feat(frontend): add account management to Settings

- Show current username and sync status
- Add Switch Account and Sync Now buttons
- Add Set Up Sync option for users without account
- Display sync errors when present
```

---

### Task 7: Implement Auto-Sync Triggers

**Goal:** Automatically sync progress on key events without user intervention.

**Files to Create:**
- `src/shared/hooks/useAutoSync.ts`

**Files to Modify:**
- `src/features/quiz/screens/GraduationScreen.tsx` (quiz completion screen)
- `app/_layout.tsx` (root layout for app state listeners)

**Prerequisites:**
- Task 3 complete (store has sync actions)

**Implementation Steps:**

**useAutoSync hook:**
- Accept options: `{ enabled?: boolean, intervalMs?: number }`
- Default interval: 5 minutes (300000ms)
- On mount (if enabled and username set):
  - Trigger initial sync
  - Set up interval for periodic sync
- On app state change (AppState API):
  - When app comes to foreground → trigger sync
- Clean up interval on unmount
- Return `{ syncNow: () => void, isSyncing: boolean }`

**Quiz completion sync:**
- In GraduationScreen.tsx, after achievements are checked (around line 75-79)
- Call `syncToCloud` after progress is updated
- Don't block UI on sync (fire and forget with error handling)

**App foreground sync:**
- Use React Native's AppState
- On `active` state (coming from background) → trigger sync
- Debounce to prevent rapid syncs

**Verification Checklist:**
- [x] Hook sets up periodic sync interval
- [x] App foreground triggers sync
- [x] Quiz completion triggers sync
- [x] No sync when username not set
- [x] Interval cleaned up on unmount
- [x] Debouncing prevents rapid consecutive syncs

**Testing Instructions:**
- Mock AppState and timers
- Test periodic sync triggers at interval
- Test foreground sync trigger
- Test cleanup on unmount
- Test no-op when username is null

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

feat(frontend): implement automatic sync triggers

- Create useAutoSync hook with periodic sync
- Add app foreground sync trigger
- Add quiz completion sync trigger
- Debounce rapid sync attempts
- Include hook tests
```

---

### Task 8: Add Sync Status Indicator

**Goal:** Show sync status in the app UI so users know their data is backed up.

**Files to Create:**
- `src/shared/ui/SyncStatusIndicator.tsx`

**Files to Modify:**
- `src/features/progress/screens/StatsScreen.tsx` (or appropriate location)

**Prerequisites:**
- Task 3 complete (store has syncStatus)

**Implementation Steps:**

**SyncStatusIndicator component:**
- Subscribe to progressStore syncStatus
- Render based on status:
  - `idle`: nothing or subtle cloud icon
  - `syncing`: spinning indicator with "Syncing..."
  - `success`: check icon, briefly shown then fade
  - `error`: error icon with tap to see details
- Compact design (fits in header or status bar area)
- Tapping on error shows lastSyncError in alert/snackbar

**Placement:**
- Add to StatsScreen header (progress is the sync-relevant data)
- Optionally add to app header for global visibility

**Verification Checklist:**
- [x] Indicator shows syncing state
- [x] Success state shows briefly
- [x] Error state is tappable for details
- [x] Idle state is unobtrusive
- [x] Indicator updates reactively from store

**Testing Instructions:**
- Test each sync status renders correctly
- Test error tap shows alert
- Test reactive updates when status changes

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

feat(frontend): add sync status indicator component

- Create SyncStatusIndicator with status-based rendering
- Show syncing spinner, success check, error icon
- Tap error to see details
- Add to StatsScreen header
```

---

### Task 9: Add Tests for Sync Integration

**Goal:** Ensure comprehensive test coverage for all sync-related functionality.

**Files to Create:**
- `src/shared/services/__tests__/syncService.test.ts`
- `src/shared/utils/__tests__/mergeProgress.test.ts`
- `src/shared/hooks/__tests__/useAutoSync.test.ts`
- `src/shared/ui/__tests__/LoginPrompt.test.tsx`
- `src/shared/ui/__tests__/SyncStatusIndicator.test.tsx`

**Prerequisites:**
- All previous tasks complete

**Implementation Steps:**
- Ensure all test files use mocked fetch (no real API calls)
- Test files should cover:
  - Happy paths for all operations
  - Error handling and edge cases
  - State transitions
  - Component rendering and interactions
- Update existing progressStore tests to cover sync state
- Verify tests pass in CI environment

**Coverage Targets:**
- syncService: 90%+ (critical path)
- mergeProgress: 95%+ (pure functions, easy to test)
- useAutoSync: 80%+ (hook logic)
- UI components: 70%+ (render and interaction tests)

**Verification Checklist:**
- [x] All test files created
- [x] No real API calls in tests
- [x] Coverage meets targets
- [x] All tests pass locally
- [x] CI pipeline passes

**Testing Instructions:**
- Run `npm test` and verify all pass
- Run `npm test -- --coverage` and check coverage report
- Push and verify CI passes

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

test(frontend): add comprehensive sync feature tests

- Add syncService tests with mocked fetch
- Add mergeProgress unit tests for all merge cases
- Add useAutoSync hook tests
- Add LoginPrompt and SyncStatusIndicator component tests
- Achieve target coverage levels
```

---

### Task 10: Update Environment Configuration

**Goal:** Document and configure environment variables for sync feature.

**Files to Create:**
- `.env.example` (does not currently exist)

**Files to Modify:**
- `app.json` (Expo config)

**Prerequisites:**
- All previous tasks complete

**Implementation Steps:**
- Create `.env.example` with `EXPO_PUBLIC_SYNC_API_URL` placeholder
- Verify Expo already exposes `EXPO_PUBLIC_*` env vars (standard Expo behavior)
- Add documentation comments explaining the variable
- Verify the variable is accessible at runtime via `process.env.EXPO_PUBLIC_SYNC_API_URL`

**.env.example:**
```
# Cloud Sync API URL (set by backend deploy script)
# Leave empty to disable cloud sync
EXPO_PUBLIC_SYNC_API_URL=
```

**Verification Checklist:**
- [x] .env.example created with documented variable
- [x] Variable accessible in app via process.env.EXPO_PUBLIC_SYNC_API_URL
- [x] App works without the variable (local-only mode)
- [x] Backend deploy script updates .env correctly

**Testing Instructions:**
- Remove EXPO_PUBLIC_SYNC_API_URL from .env
- Verify app starts without errors
- Verify sync features gracefully disabled
- Add URL back and verify sync works

**Commit Message Template:**
```
Author & Committer: HatmanStack
Email: 82614182+HatmanStack@users.noreply.github.com

chore(frontend): create .env.example with sync API variable

- Create .env.example documenting EXPO_PUBLIC_SYNC_API_URL
- Document variable purpose and behavior
- Ensure graceful degradation when not set
```

---

## Phase Verification

**Phase 2 is complete when:**
- [ ] `npm test` passes all frontend tests
- [ ] App builds without errors (`npx expo export`)
- [ ] Login flow works in onboarding (new user, existing user, skip)
- [ ] Settings shows account info and allows switching
- [ ] Auto-sync triggers on quiz completion and app foreground
- [ ] Sync status indicator shows correct state
- [ ] Manual "Sync Now" works from Settings
- [ ] Progress persists after logout/login on different device

**End-to-End Manual Testing:**

1. **New User Flow:**
   - Fresh install, complete onboarding with new username
   - Complete a quiz, verify progress syncs
   - Check Settings shows username and last sync time

2. **Existing User Flow:**
   - Fresh install, enter existing username in onboarding
   - Confirm "Is this you?" dialog
   - Verify previous progress appears

3. **Cross-Device Sync:**
   - On Device A: complete quizzes, accumulate progress
   - On Device B: login with same username
   - Verify Device B has Device A's progress
   - Complete quiz on Device B
   - Force sync on Device A
   - Verify Device A has Device B's new progress

4. **Offline Behavior:**
   - Disable network
   - Complete quiz (should work, sync fails gracefully)
   - Enable network
   - Verify sync occurs (foreground trigger or manual)

5. **Switch Account:**
   - Login as User A, make progress
   - Switch to User B in Settings
   - Verify User B's progress loads
   - Switch back to User A
   - Verify User A's progress preserved

**Known Limitations:**
- No real-time sync (eventual consistency)
- No conflict notification to user (silent merge)
- No account deletion mechanism
- No password protection (username only)

**Future Enhancements (not in scope):**
- Real-time sync with WebSockets
- Account linking with social providers
- Progress export/backup to file
- Sync conflict resolution UI
