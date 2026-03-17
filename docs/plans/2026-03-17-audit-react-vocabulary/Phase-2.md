# Phase 2 — [IMPLEMENTER] Code Fixes

## Phase Goal

Fix structural, architectural, and operational issues across the codebase: type rigor, defensive coding (schema validation), performance optimizations, architecture improvements (progressStore decomposition, vocabulary store lazy loading), backend safety fixes, and quiz logic corrections.

**Success criteria:** All `any` types eliminated from production code. All `JSON.parse` paths validated. Backend race condition fixed. Levenshtein optimized. Quiz completion logic deduplicated. Word state progression enforced. `npm run check` passes. No regressions in existing tests.

**Estimated tokens:** ~40,000

## Prerequisites

- Phase 1 complete (dead code removed, unused deps cleaned)
- `npm run check` passes on current state

## Tasks

---

### Task 1: Fix Type Safety Issues (`any` types and `as any` casts)

**Goal:** Eliminate `any` types and unsafe casts from production code to improve type rigor.

**Findings addressed:** Health #12 (MED), Health #24 (LOW), Eval Type Rigor (5/10)

**Files to Modify:**
- `src/features/settings/utils/progressExport.ts` — Replace `Record<string, any>` with proper type at line 16; remove `any` casts at lines 104, 106
- `src/shared/ui/Typography.tsx` — Fix `as any` cast at line 82
- `src/shared/ui/ErrorBoundary.tsx` — Replace hardcoded colors with theme (Health #17)

**Prerequisites:** None

**Implementation Steps:**

1. **progressExport.ts (line 16):** Replace `listLevelProgress: Record<string, any>` with:

   ```typescript
   listLevelProgress: Record<string, {
     listId: string;
     levelId: string;
     wordProgress: Record<string, {
       state: number;
       hintsUsed: number;
       wrongAttempts: number;
       correctAttempts: number;
       lastAttemptDate: string;
       firstAttemptDate: string;
       masteredDate?: string;
     }>;
     bestScore?: {
       hints: number;
       wrong: number;
       completedAt: string;
     };
   }>;
   ```

   Alternatively, import `ListLevelProgress` from `@/shared/types` and use `Record<string, ListLevelProgress>`.

2. **progressExport.ts (lines 104, 106):** Replace `any` casts with proper type assertions or remove them by structuring the code to not need them. Review the context of each cast — they likely involve accessing properties from parsed JSON. Since Task 4 adds validation to the import flow, the casts can be replaced with validated types.

3. **Typography.tsx (line 82):** The `VARIANT_MAP[variant] as any` cast exists because the custom variant names don't match react-native-paper's `TextProps['variant']` type. Fix by:
   - Defining the return type of `VARIANT_MAP` lookup as `React.ComponentProps<typeof PaperText>['variant']`
   - Or using a type assertion to the specific union type instead of `any`:

     ```typescript
     variant={VARIANT_MAP[variant] as React.ComponentProps<typeof PaperText>['variant']}
     ```

   - Remove the `eslint-disable-next-line` comment above it

4. **ErrorBoundary.tsx (lines 112-118):** The hardcoded colors (`#f5f5f5`, `#fee`, `#c00`) ignore the theme system. Since `ErrorBoundary` is a class component and cannot use hooks, the fix is:
   - Accept a `theme` prop or use react-native-paper's `withTheme` HOC, OR
   - Use react-native-paper's semantic color tokens via a wrapper. The simplest approach: replace the hardcoded colors with react-native-paper's theme-compatible defaults. Since ErrorBoundary is a class component, wrap it with `withTheme` from `react-native-paper` to inject the theme as a prop, then use `this.props.theme.colors.background`, `this.props.theme.colors.error`, `this.props.theme.colors.errorContainer` etc.

**Verification Checklist:**
- [x] No `any` type annotations remain in `progressExport.ts`
- [x] No `as any` cast remains in `Typography.tsx`
- [x] No `eslint-disable @typescript-eslint/no-explicit-any` remains in `Typography.tsx`
- [x] ErrorBoundary uses theme colors instead of hardcoded hex values
- [x] `npm run type-check` passes
- [x] `npm run check` passes

**Testing Instructions:**
- Run: `npm run check`
- If ErrorBoundary has existing tests, verify they still pass (they may need a theme provider wrapper)

**Commit Message Template:**

```text
fix(types): eliminate any types and unsafe casts from production code
```

---

### Task 2: Create Shared Type Definitions and listLevelProgress Key Helper

**Goal:** Consolidate duplicated types between frontend and backend, and create a single source of truth for the `listLevelProgress` composite key.

**Findings addressed:** Health #15 (MED), Health #22 (LOW), Health #23 (LOW), Eval Type Rigor

**Files to Create:**
- `src/shared/utils/listLevelKey.ts` — Helper to construct and parse `${listId}-${levelId}` keys

**Files to Modify:**
- `src/shared/store/progressStore.ts` — Import and use `makeListLevelKey` helper
- `src/shared/store/quizStore.ts` — Import and use `makeListLevelKey` helper
- `src/shared/types/progress.ts` — Ensure `Achievement` is the single canonical type
- `src/features/progress/utils/achievements.ts` — Import `Achievement` from `@/shared/types` instead of defining it locally

**Prerequisites:** None

**Implementation Steps:**

1. **Create `src/shared/utils/listLevelKey.ts`:**

   ```typescript
   /**
    * Constructs the composite key for listLevelProgress lookups.
    * Single source of truth for the key format used across stores.
    */
   export function makeListLevelKey(listId: string, levelId: string): string {
     return `${listId}-${levelId}`;
   }
   ```

2. **Update progressStore.ts:** Find every instance of `` `${listId}-${levelId}` `` (approximately lines 243, 319, 345, 381, 431, 474) and replace with `makeListLevelKey(listId, levelId)`. Add the import at the top.

3. **Update quizStore.ts:** Find the composite key construction and replace with `makeListLevelKey`.

4. **Fix Achievement type duplication:**
   - Open `src/features/progress/utils/achievements.ts` and find the local `Achievement` interface (lines ~9-19)
   - Delete it and add `import { Achievement } from '@/shared/types';` at the top
   - Verify the imported type matches what was there (it should — both have the same fields)

5. **Backend types:** The backend has its own `types.ts` with duplicated types. Since the backend is separately deployed and has its own `tsconfig.json`, creating a shared types package would be over-engineering. Instead, add a comment at the top of `backend/src/types.ts`:

   ```typescript
   // NOTE: These types mirror src/shared/types/progress.ts in the frontend.
   // If you change types here, update the frontend types to match.
   ```

**Verification Checklist:**
- [x] `makeListLevelKey` is used everywhere a composite key is constructed
- [x] No local `Achievement` interface in `achievements.ts`
- [x] `backend/src/types.ts` has a sync-note comment
- [x] `npm run check` passes

**Testing Instructions:**
- Run: `npm run check`
- The key helper is simple enough that a dedicated test is optional, but if you want to add one:
  - Create `src/shared/utils/__tests__/listLevelKey.test.ts`
  - Test: `makeListLevelKey('list1', 'level2')` returns `'list1-level2'`

**Commit Message Template:**

```text
refactor(types): consolidate duplicate types and extract listLevelKey helper
```

---

### Task 3: Review and Fix eslint-disable Suppressions

**Goal:** Review the 12 `eslint-disable-next-line react-hooks/exhaustive-deps` suppressions and fix the ones that mask real bugs. Keep suppressions only where intentional (e.g., "run effect only on mount").

**Findings addressed:** Health #14 (MED)

**Files to Modify (review each):**
- `src/features/quiz/screens/QuizScreen.tsx` — lines 56, 82
- `src/features/quiz/screens/GraduationScreen.tsx` — lines 61, 85
- `src/features/quiz/components/AnswerFeedback.tsx` — line 90
- `src/features/progress/screens/StatsScreen.tsx` — line 21
- `src/features/progress/components/AchievementUnlockModal.tsx` — line 58
- `src/features/vocabulary/screens/DifficultyScreen.tsx` — line 50
- `src/features/vocabulary/screens/HomeScreen.tsx` — line 90
- `src/features/vocabulary/components/ListCard.tsx` — line 70
- `src/shared/ui/ProgressBar.tsx` — line 55

**Prerequisites:** None

**Implementation Steps:**

For each suppression:

1. Remove the `eslint-disable` comment
2. Run `npm run lint` to see what dependency ESLint wants added
3. Evaluate whether adding the dependency would cause unwanted re-runs:
   - **If the effect is intentionally "mount-only":** Add a comment explaining why (e.g., `// Effect intentionally runs only on mount — deps are stable refs`) and restore the suppression
   - **If the missing dep is a function from a store:** These are typically stable references from Zustand and safe to add to the deps array. Add them.
   - **If adding the dep would cause infinite loops:** Wrap the dep in `useCallback` or `useMemo` to stabilize it, then add it to deps
   - **If the effect truly has a bug (stale closure):** Fix the effect logic

4. For each file, document in a code comment what you decided and why.

**Verification Checklist:**
- [x] Each of the 12 suppressions has been reviewed
- [x] Suppressions that remain have an explanatory comment
- [x] No stale closure bugs remain
- [x] `npm run check` passes

**Testing Instructions:**
- Run: `npm run check`
- Manually verify that remaining suppressions have comments explaining the intent

**Commit Message Template:**

```text
fix(hooks): review and fix eslint-disable exhaustive-deps suppressions
```

---

### Task 4: Add Schema Validation to JSON.parse Deserialization

**Goal:** Add runtime validation to all `JSON.parse` calls that hydrate store state, preventing corrupted storage from crashing the app.

**Findings addressed:** Health #13 (MED), Eval Defensiveness (6/10), Eval Critical Failure Points #1 and #4

**Files to Modify:**
- `src/shared/store/progressStore.ts` — Validate parsed data at line ~217 before spreading into state
- `src/shared/store/settingsStore.ts` — Validate parsed data at line ~70
- `src/features/settings/utils/progressExport.ts` — Validate imported data at line ~130

**Prerequisites:** Task 1 (proper types needed for validation)

**Implementation Steps:**

1. **Define a validation helper.** Create a small validation function (not a full library — YAGNI). Add it inline or in a shared util:

   ```typescript
   // In each store file or in a shared util like src/shared/utils/validateState.ts
   function isValidProgressData(data: unknown): data is Partial<UserProgress> {
     if (typeof data !== 'object' || data === null) return false;
     const d = data as Record<string, unknown>;
     // Check required shape
     if (d.listLevelProgress && typeof d.listLevelProgress !== 'object') return false;
     if (d.globalStats && typeof d.globalStats !== 'object') return false;
     return true;
   }
   ```

2. **progressStore.ts `loadFromStorage` (line ~217):**

   ```typescript
   if (stored) {
     try {
       const data = JSON.parse(stored);
       if (isValidProgressData(data)) {
         set({ ...data, username: storedUsername || null, _hydrated: true });
       } else {
         console.warn('Invalid progress data in storage, using defaults');
         set({ username: storedUsername || null, _hydrated: true });
       }
     } catch {
       console.warn('Corrupted progress data in storage, using defaults');
       set({ _hydrated: true });
     }
   }
   ```

3. **settingsStore.ts `loadFromStorage` (line ~70):**
   Add validation that `data.theme` is one of the expected values ('light', 'dark', 'auto'), `data.soundEnabled` is boolean, etc. Use defaults for invalid fields via nullish coalescing (the existing `??` pattern is good but add a typeof guard around the outer parse).

4. **progressExport.ts `applyImportedProgress` (line ~130):**
   Validate the imported data structure matches `ProgressExportData` before applying. Check `version`, `data.listLevelProgress`, `data.globalStats` shapes.

**Verification Checklist:**
- [x] `progressStore.ts` validates `JSON.parse` output before `set()`
- [x] `settingsStore.ts` validates `JSON.parse` output before `set()`
- [x] `progressExport.ts` validates imported data before applying to store
- [x] Corrupted data falls back to defaults rather than crashing
- [x] `npm run check` passes

**Testing Instructions:**
- Add tests for the validation:
  - Create `src/shared/utils/__tests__/validateState.test.ts` (if you extracted a shared util)
  - Test with valid data, null, non-object, missing fields, extra fields
  - Verify default fallback behavior
- Run: `npm test`

**Commit Message Template:**

```text
fix(store): add schema validation to JSON.parse deserialization paths
```

---

### Task 5: Fix Debounced Save and Stale Timer Issues

**Goal:** Fix the debounced save mechanism to flush on app background, fix stale setTimeout timers in sync status, and fix the non-atomic import in progressExport.

**Findings addressed:** Health #5 (HIGH), Health #7 (HIGH), Health #8 (HIGH), Eval Critical Failure Point #3

**Files to Modify:**
- `src/shared/store/progressStore.ts` — Encapsulate debounce timer, add flush mechanism, fix stale sync status timers
- `app/_layout.tsx` — Register AppState listener to flush on background
- `src/features/settings/utils/progressExport.ts` — Fix non-atomic reset+import

**Prerequisites:** None

**Implementation Steps:**

1. **Encapsulate the debounce timer (progressStore.ts line ~34):**
   Move the module-level `let saveDebounceTimer` inside the store's closure or into an object. The simplest approach: keep it module-level but add a `flushPendingSave` function that clears the timer and immediately executes the save:

   ```typescript
   export const flushPendingSave = async () => {
     if (saveDebounceTimer) {
       clearTimeout(saveDebounceTimer);
       saveDebounceTimer = null;
     }
     const state = useProgressStore.getState();
     // Run the save logic immediately (extract from the setTimeout callback)
     const dataToSave = { /* ... same fields as in saveStateToStorage */ };
     await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
   };
   ```

   Extract the save logic into a named helper to avoid duplication between the debounced path and the flush path.

2. **Register AppState listener in `app/_layout.tsx`:**

   ```typescript
   import { AppState } from 'react-native';
   import { flushPendingSave } from '@/shared/store/progressStore';

   useEffect(() => {
     const subscription = AppState.addEventListener('change', (nextState) => {
       if (nextState === 'background' || nextState === 'inactive') {
         flushPendingSave();
       }
     });
     return () => subscription.remove();
   }, []);
   ```

3. **Fix stale sync status timers (progressStore.ts lines ~620 and ~693):**
   Store the timer ID and clear it before setting a new one:

   ```typescript
   // At module level or in a closure:
   let syncStatusTimer: ReturnType<typeof setTimeout> | null = null;

   // In syncToCloud and syncFromCloud success handlers:
   if (syncStatusTimer) clearTimeout(syncStatusTimer);
   syncStatusTimer = setTimeout(() => {
     set((current) => current.syncStatus === 'success' ? { syncStatus: 'idle' } : {});
     syncStatusTimer = null;
   }, 2000);
   ```

4. **Fix non-atomic import (progressExport.ts lines ~128-148):**
   The issue: `resetAllProgress()` is async but the code doesn't await it properly before setting new state. Fix by awaiting the reset, then applying the import:

   ```typescript
   export async function applyImportedProgress(data: ProgressExportData): Promise<void> {
     const store = useProgressStore.getState();
     // Reset and wait for it to complete
     await store.resetAllProgress();
     // Now apply the imported data
     // ... set state with imported data
   }
   ```

   Verify that `resetAllProgress` actually returns a promise. If it doesn't, make it return one by awaiting its internal `AsyncStorage.removeItem`.

**Verification Checklist:**
- [x] `flushPendingSave` function exists and is exported
- [x] `_layout.tsx` registers an AppState listener that calls `flushPendingSave`
- [x] Sync status timers are properly cleared before new ones are set
- [x] `applyImportedProgress` properly awaits `resetAllProgress` before setting new state
- [x] `npm run check` passes

**Testing Instructions:**
- Test `flushPendingSave` by verifying it calls `AsyncStorage.setItem`
- Test sync status timer cleanup by triggering `syncToCloud` twice in rapid succession
- Run: `npm test`

**Commit Message Template:**

```text
fix(store): fix debounce flush, stale timers, and non-atomic import
```

---

### Task 6: Convert Vocabulary Store to Lazy Initialization

**Goal:** Remove the module-level side effect that eagerly loads all vocabulary data at import time.

**Findings addressed:** Health #6 (HIGH), Eval Critical Failure Point #2

**Files to Modify:**
- `src/shared/store/vocabularyStore.ts` — Remove line 124 (`useVocabularyStore.getState().loadVocabularyLists()`)
- `app/_layout.tsx` — Call `loadVocabularyLists()` explicitly during app initialization
- `src/features/vocabulary/screens/HomeScreen.tsx` — Ensure it triggers loading if not already loaded

**Prerequisites:** None

**Implementation Steps:**

1. **Remove line 124 in vocabularyStore.ts:**
   Delete: `useVocabularyStore.getState().loadVocabularyLists();`

2. **Add a loading state to the store** (if not already present):
   The store should have `isLoaded: boolean` in its state so consumers know when data is ready.

3. **Call loading from `_layout.tsx`:** In the root layout's initialization logic (which already loads progress and settings), add:

   ```typescript
   useVocabularyStore.getState().loadVocabularyLists();
   ```

   This ensures loading happens once during app startup, but within the React lifecycle rather than at module import time.

4. **Guard HomeScreen:** The `HomeScreen` already calls `loadVocabularyLists()` directly (line 26). Verify that after removing the module-level call, the HomeScreen still gets data. If `loadVocabularyLists` is synchronous (returns from a module-level cache), this should work. If it becomes async, add a loading state check.

**Verification Checklist:**
- [x] No module-level side effect in `vocabularyStore.ts`
- [x] Vocabulary data loads during app initialization in `_layout.tsx`
- [x] HomeScreen still displays vocabulary lists
- [x] `npm run check` passes

**Testing Instructions:**
- Run: `npm run check`
- Existing vocabulary store tests should still pass

**Commit Message Template:**

```text
refactor(store): convert vocabulary store to lazy initialization
```

---

### Task 7: Add Backend Payload Validation and Size Limits

**Goal:** Add schema validation and size limits to the backend save endpoint to prevent storage of malformed or oversized data.

**Findings addressed:** Health #2 (CRITICAL), Eval Pragmatism

**Files to Modify:**
- `backend/src/validation.ts` — Add `progressData` schema validation for the save action
- `backend/src/index.ts` — Fix insecure default `ALLOWED_ORIGINS = '*'`

**Prerequisites:** None

**Implementation Steps:**

1. **Add payload size check in `validation.ts`:**
   Before the existing `progressData` check (line ~70), add:

   ```typescript
   // Check payload size (DynamoDB limit is 400KB, leave margin)
   const payloadSize = JSON.stringify(data.progressData).length;
   const MAX_PAYLOAD_SIZE = 350_000; // 350KB, below DynamoDB 400KB limit
   if (payloadSize > MAX_PAYLOAD_SIZE) {
     throw new ValidationError(
       'Progress data exceeds maximum size',
       ErrorCodes.INVALID_PROGRESS_DATA // Add this error code if it doesn't exist
     );
   }
   ```

2. **Add basic schema validation in `validation.ts`:**
   After confirming `progressData` is an object, validate its shape:

   ```typescript
   const pd = data.progressData;
   if (typeof pd.listLevelProgress !== 'undefined' && typeof pd.listLevelProgress !== 'object') {
     throw new ValidationError('Invalid listLevelProgress format', ErrorCodes.INVALID_PROGRESS_DATA);
   }
   if (typeof pd.globalStats !== 'undefined' && typeof pd.globalStats !== 'object') {
     throw new ValidationError('Invalid globalStats format', ErrorCodes.INVALID_PROGRESS_DATA);
   }
   ```

3. **Fix ALLOWED_ORIGINS default (index.ts line 6):**
   Change from:

   ```typescript
   const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';
   ```

   To:

   ```typescript
   const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '';
   ```

   And update the CORS logic to deny requests when no origin is configured, or at minimum log a warning if `ALLOWED_ORIGINS` is empty. This forces explicit configuration in deployment.

**Verification Checklist:**
- [x] Oversized payloads are rejected with an appropriate error
- [x] Malformed `progressData` objects are rejected
- [x] `ALLOWED_ORIGINS` no longer defaults to `'*'`
- [x] Backend `npm run check` passes: `cd backend && npm run check`

**Testing Instructions:**
- Add tests in `backend/src/__tests__/validation.test.ts` (or wherever backend tests live):
  - Test oversized payload rejection
  - Test malformed progressData rejection
  - Test valid payload acceptance
- Run: `cd backend && npm test`

**Commit Message Template:**

```text
fix(backend): add payload validation, size limits, and secure CORS default
```

---

### Task 8: Fix Backend Race Condition with Conditional Write

**Goal:** Replace the read-then-write pattern in `saveProgress` with a DynamoDB conditional expression to prevent concurrent write data loss.

**Findings addressed:** Health #3 (CRITICAL), Eval Pragmatism

**Files to Modify:**
- `backend/src/db.ts` — Replace `GetCommand` + `PutCommand` with a single `PutCommand` using `if_not_exists`

**Prerequisites:** None

**Implementation Steps:**

1. Replace the current `saveProgress` function (lines ~60-90) with:

   ```typescript
   export async function saveProgress(username: string, progressData: UserProgress): Promise<string> {
     const now = new Date().toISOString();

     await docClient.send(
       new PutCommand({
         TableName: TABLE_NAME,
         Item: {
           username,
           progressData,
           lastSyncedAt: now,
           createdAt: now,  // Will be overwritten if item exists, but...
         },
       })
     );

     // Use UpdateCommand instead to preserve createdAt atomically:
     // Actually, the cleanest approach is to use UpdateCommand with SET and if_not_exists:
     return now;
   }
   ```

   The best DynamoDB approach:

   ```typescript
   import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

   export async function saveProgress(username: string, progressData: UserProgress): Promise<string> {
     const now = new Date().toISOString();

     await docClient.send(
       new UpdateCommand({
         TableName: TABLE_NAME,
         Key: { username },
         UpdateExpression: 'SET progressData = :pd, lastSyncedAt = :now, createdAt = if_not_exists(createdAt, :now)',
         ExpressionAttributeValues: {
           ':pd': progressData,
           ':now': now,
         },
       })
     );

     return now;
   }
   ```

   This uses `if_not_exists(createdAt, :now)` to only set `createdAt` if the item doesn't already have one — a single atomic operation instead of read-then-write.

2. Remove the `GetCommand` import if it's no longer used elsewhere in the file.

**Verification Checklist:**
- [x] `saveProgress` uses a single DynamoDB operation (no `GetCommand` before `PutCommand`)
- [x] `createdAt` is preserved for existing items via `if_not_exists`
- [x] Backend `npm run check` passes: `cd backend && npm run check`

**Testing Instructions:**
- Update backend tests for `saveProgress` if they exist
- Run: `cd backend && npm test`

**Commit Message Template:**

```text
fix(backend): replace read-then-write with atomic conditional write
```

---

### Task 9: Extract Cloud Sync Logic from progressStore

**Goal:** Reduce the progressStore god object by extracting cloud sync orchestration into a dedicated module.

**Findings addressed:** Health #4 (HIGH), Eval Architecture (8/10)

**Files to Create:**
- `src/shared/services/syncOrchestrator.ts` — Cloud sync logic extracted from progressStore

**Files to Modify:**
- `src/shared/store/progressStore.ts` — Remove sync methods, delegate to syncOrchestrator

**Prerequisites:** Tasks 4-5 (validation and flush fixes should be in place before moving code)

**Implementation Steps:**

1. **Identify sync-related code in progressStore.ts:**
   - `syncToCloud` method (~lines 580-641)
   - `syncFromCloud` method (~lines 643-704)
   - `checkUsername` method
   - `setUsername` method
   - `logout` method (partially sync-related)
   - `syncStatus`, `lastSyncError`, `lastCloudSyncAt` state fields
   - The sync status timer cleanup from Task 5

2. **Create `src/shared/services/syncOrchestrator.ts`:**
   - Export functions: `syncToCloud(state)`, `syncFromCloud(state)`, `checkUsername(username)`
   - These functions take the current progress state as input and return the new state fields to set
   - They call the existing `syncService` API functions
   - The store keeps `syncStatus` etc. in its state but delegates the orchestration logic

3. **Update progressStore.ts:**
   - Import from `syncOrchestrator`
   - Replace the inline sync method bodies with calls to the orchestrator
   - Keep the store methods as thin wrappers that call the orchestrator and then `set()` the results

4. **This is a refactor — no behavior changes.** The sync flow should work identically before and after.

**Verification Checklist:**
- [x] `syncOrchestrator.ts` exists with extracted sync logic
- [x] `progressStore.ts` is measurably shorter (target: under 500 lines)
- [x] Cloud sync still works (existing sync tests pass)
- [x] `npm run check` passes

**Testing Instructions:**
- Existing `syncService.test.ts` and `progressStore` tests should continue to pass
- Optionally add unit tests for `syncOrchestrator` functions
- Run: `npm test`

**Commit Message Template:**

```text
refactor(store): extract cloud sync orchestration from progressStore
```

---

### Task 10: Fix Quiz Completion Logic and Word State Progression

**Goal:** Deduplicate the quiz completion check and enforce the documented word state progression model (0->1->2->3).

**Findings addressed:** Health #11 (MED), Health #16 (MED), Eval Creativity, Eval Concerns

**Files to Modify:**
- `src/features/quiz/screens/QuizScreen.tsx` — Extract quiz completion into a single helper
- `src/shared/store/quizStore.ts` — Fix word state progression in `submitAnswer`

**Prerequisites:** Task 3 (eslint-disable review may affect QuizScreen)

**Implementation Steps:**

1. **Deduplicate quiz completion (QuizScreen.tsx):**
   The completion check exists in both the `useEffect` (line ~60) and `handleFeedbackEnd` (line ~128). Extract into a single function:

   ```typescript
   const navigateToGraduation = useCallback(() => {
     const durationMinutes = quizStartTime
       ? (Date.now() - quizStartTime) / (1000 * 60)
       : undefined;
     const finalStats = endQuiz();
     router.replace({
       pathname: '/graduation',
       params: {
         listId,
         levelId,
         hints: finalStats.hints.toString(),
         wrong: finalStats.wrong.toString(),
         bestHints: '0',
         bestWrong: '0',
         durationMinutes: durationMinutes?.toString() || '0',
       },
     });
   }, [quizStartTime, endQuiz, router, listId, levelId]);
   ```

   Then call `navigateToGraduation()` from both the useEffect and handleFeedbackEnd.

2. **Clean up the setTimeout in handleFeedbackEnd (line ~131):**
   Store the timer reference and clear it on unmount:

   ```typescript
   const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   // In cleanup:
   useEffect(() => {
     return () => {
       if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
     };
   }, []);

   // In handleFeedbackEnd:
   feedbackTimerRef.current = setTimeout(() => { ... }, 300);
   ```

3. **Fix word state progression (quizStore.ts line ~215):**
   Currently: `3, // Mark as mastered` — always sets state to 3 regardless of current state.
   Fix to implement progressive states:

   ```typescript
   // Get current word state
   const progressStore = useProgressStore.getState();
   const key = makeListLevelKey(currentSession.listId, currentSession.levelId);
   const currentWordProgress = progressStore.listLevelProgress[key]?.wordProgress[word.id];
   const currentState = currentWordProgress?.state ?? 0;

   // Progress to next state (not skip to mastered)
   const nextState = Math.min(currentState + 1, 3) as WordState;

   progressStore.updateWordProgress(
     word.id,
     currentSession.listId,
     currentSession.levelId,
     nextState,
     isCorrect,
     false
   );
   ```

**Verification Checklist:**
- [x] Quiz completion logic exists in only one place (shared function)
- [x] `handleFeedbackEnd` timeout is cleaned up on unmount
- [x] Word state increments by 1 per correct answer (not jumping to 3)
- [x] `npm run check` passes

**Testing Instructions:**
- Update `quizStore.test.ts` to verify word state progression:
  - First correct answer: state 0 -> 1
  - Second correct answer: state 1 -> 2
  - Third correct answer: state 2 -> 3
  - Fourth correct answer: state stays at 3
- Run: `npm test`

**Commit Message Template:**

```text
fix(quiz): deduplicate completion logic and enforce word state progression
```

---

### Task 11: Performance Optimizations

**Goal:** Optimize hot-path functions: cache `getAllWords()`, optimize Levenshtein to single-row DP.

**Findings addressed:** Eval Performance (7/10)

**Files to Modify:**
- `src/features/vocabulary/utils/vocabularyLoader.ts` — Cache `getAllWords()` result
- `src/shared/lib/levenshtein.ts` — Optimize to single-row DP algorithm

**Prerequisites:** None

**Implementation Steps:**

1. **Cache `getAllWords()` (vocabularyLoader.ts lines ~90-99):**
   The function rebuilds the array on every call. Add a module-level cache:

   ```typescript
   let cachedAllWords: VocabularyWord[] | null = null;

   export function getAllWords(): VocabularyWord[] {
     if (cachedAllWords) return cachedAllWords;

     const allWords: VocabularyWord[] = [];
     vocabularyLists.forEach((list) => {
       list.levels.forEach((level) => {
         allWords.push(...level.words);
       });
     });

     cachedAllWords = allWords;
     return cachedAllWords;
   }
   ```

2. **Optimize Levenshtein (levenshtein.ts):**
   Replace the full O(n*m) matrix with a single-row (two-row) DP approach that uses O(min(n,m)) space:

   ```typescript
   export function levenshteinDistance(str1: string, str2: string): number {
     const len1 = str1.length;
     const len2 = str2.length;

     // Ensure str2 is shorter for space optimization
     if (len1 < len2) return levenshteinDistance(str2, str1);

     let prevRow = Array.from({ length: len2 + 1 }, (_, i) => i);

     for (let i = 1; i <= len1; i++) {
       const currRow = [i];
       for (let j = 1; j <= len2; j++) {
         if (str1[i - 1] === str2[j - 1]) {
           currRow[j] = prevRow[j - 1];
         } else {
           currRow[j] = Math.min(
             prevRow[j - 1], // substitution
             prevRow[j],     // deletion
             currRow[j - 1]  // insertion
           ) + 1;
         }
       }
       prevRow = currRow;
     }

     return prevRow[len2];
   }
   ```

**Verification Checklist:**
- [x] `getAllWords()` returns cached result on subsequent calls
- [x] Levenshtein uses O(min(n,m)) space instead of O(n*m)
- [x] Existing Levenshtein tests still pass
- [x] `npm run check` passes

**Testing Instructions:**
- Levenshtein has existing tests — verify they still pass: `npm test -- --testPathPattern='levenshtein'`
- Run: `npm run check`

**Commit Message Template:**

```text
perf: cache getAllWords and optimize Levenshtein to single-row DP
```

---

### Task 12: Add Quiz Flow Integration Test

**Goal:** Add at least one integration-level test for the core quiz flow to improve test value.

**Findings addressed:** Eval Test Value (8/10)

**Files to Create:**
- `src/features/quiz/__tests__/quizFlow.integration.test.ts`

**Prerequisites:** Tasks 10 (quiz logic fixes should be in place)

**Implementation Steps:**

1. Create an integration test that exercises the quiz flow end-to-end through the stores (not rendering components):
   - Initialize the vocabulary store with test data
   - Start a quiz session via the quiz store
   - Submit answers (mix of correct and incorrect)
   - Verify progress is recorded correctly in the progress store
   - Verify quiz completion is detected
   - Verify word state progression follows the 0->1->2->3 model

2. This test should use real store implementations (not mocked), with only external dependencies mocked (AsyncStorage, which is already mocked in jest.setup.js).

3. Follow the pattern in `mergeProgress.test.ts` which is cited as exemplary in the eval.

**Verification Checklist:**
- [x] Integration test file exists
- [x] Test exercises quiz flow through real stores
- [x] Test verifies word state progression
- [x] `npm test` passes

**Testing Instructions:**
- Run: `npm test -- --testPathPattern='quizFlow'`

**Commit Message Template:**

```text
test(quiz): add integration test for quiz flow with word state progression
```

---

## Phase Verification

After completing all tasks in this phase:

1. Run `npm run check` — must pass
2. Run `cd backend && npm run check` — must pass
3. Verify no `any` types remain in production code (search for `: any` and `as any`)
4. Verify `progressStore.ts` is under 500 lines
5. Verify all `JSON.parse` paths have validation
6. Verify Levenshtein tests still pass
7. Verify the new quiz integration test passes
