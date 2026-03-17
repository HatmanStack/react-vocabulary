---
type: repo-health
date: 2026-03-17
goal: General health check — scan all 4 vectors equally
---

# Codebase Health Audit: react-vocabulary

## Configuration

- **Goal:** General health check — scan all 4 vectors equally
- **Deployment Target:** Serverless (Lambda, Cloud Functions)
- **Scope:** Full repo, no constraints
- **Existing Tooling:** Full setup — linters, CI pipeline, pre-commit hooks, type checking
- **Known Pain Points:** None — fresh eyes scan

## Summary

- Overall health: **FAIR**
- Biggest structural risk: The `progressStore.ts` (738 lines) is a god object combining persistence, cloud sync orchestration, achievement checking, session management, and progress calculations into a single Zustand store
- Biggest operational risk: No authentication on the cloud sync API — anyone who knows a username can read or overwrite another user's entire progress data
- Total findings: 2 critical, 5 high, 8 medium, 7 low (1 critical + 1 high accepted as intentional design)

## Tech Debt Ledger

### CRITICAL

1. ~~**[Operational Debt]** `backend/src/index.ts:33-83` + `backend/src/validation.ts:1-80`~~ **ACCEPTED — Intentional architectural decision.**
   - **The Design:** The cloud sync API uses username-only identification with no passwords, tokens, or sessions. This is a deliberate trade-off to minimize friction for a vocabulary learning app. Users are advised to choose a unique username for privacy.
   - **Mitigations added:** Privacy notice in LoginPrompt UI, inline `ARCHITECTURAL DECISION` comments in `backend/src/index.ts`, `backend/src/validation.ts`, `src/shared/services/syncService.ts`, and `src/shared/ui/LoginPrompt.tsx` to document this choice for future auditors.

2. **[Operational Debt]** `backend/src/validation.ts:66-73`
   - **The Debt:** The `save` action validates that `progressData` exists and is an object, but performs no schema validation on its contents. The entire payload is written directly to DynamoDB via `PutCommand` at `backend/src/db.ts:82-87`. There is no size limit check on the request body.
   - **The Risk:** A malicious or buggy client can store arbitrarily large or malformed JSON in DynamoDB, leading to storage cost escalation, data corruption on downstream reads, or DynamoDB item size limit (400KB) errors that are unhandled.

3. **[Operational Debt]** `backend/src/db.ts:60-90`
   - **The Debt:** The `saveProgress` function performs a `GetCommand` to check `createdAt` before every `PutCommand` — two separate DynamoDB operations with no conditional write (no `ConditionExpression`). This is a read-then-write race condition.
   - **The Risk:** Concurrent saves from two devices can cause one to silently overwrite the other's data. The merge logic only runs client-side, so if two clients save simultaneously, the last writer wins and data is lost.

### HIGH

1. (4) **[Structural Debt]** `src/shared/store/progressStore.ts:1-738`
   - **The Debt:** 738-line god object serving as persistence layer, cloud sync coordinator, achievement engine, session manager, and progress calculator. The interface (`ProgressState`) has 25+ methods. The `Omit<>` type at lines 123-154 lists 30 excluded keys to define initial state.
   - **The Risk:** Any change to sync, achievements, or progress calculation risks breaking the other concerns. Testing requires mocking the entire 25-method interface.

1. (5) **[Architectural Debt]** `src/shared/store/progressStore.ts:620-624` and `693-704`
   - **The Debt:** The store uses `setTimeout(() => set(...), 2000)` to reset `syncStatus` from `'success'` to `'idle'` after 2 seconds in both `syncToCloud` and `syncFromCloud`. These timers are not cancelled on unmount or re-invocation.
   - **The Risk:** Stale timer can reset status incorrectly if a new sync starts within the 2-second window. On fast re-mounts or rapid navigation, orphaned timers modify store state unexpectedly.

1. (6) **[Architectural Debt]** `src/shared/store/vocabularyStore.ts:124`
   - **The Debt:** `useVocabularyStore.getState().loadVocabularyLists()` executes at module import time. This eagerly loads all 18 JSON vocabulary files (with all 5 difficulty levels each) into memory the moment any file imports this store.
   - **The Risk:** On serverless/SSR context, this runs on every cold start even if vocabulary data is never needed. For the React Native app, this loads all data into memory before the first render regardless of whether the user navigates to vocabulary features.

1. (7) **[Operational Debt]** `src/shared/store/progressStore.ts:176-199`
   - **The Debt:** The `saveStateToStorage` function uses a module-level `let saveDebounceTimer` variable. If `saveStateToStorage` is called and then the app is force-closed within the 500ms debounce window, the pending save is lost.
   - **The Risk:** User progress can be silently lost on app force-close or crash. No flush-on-exit mechanism exists.

1. (8) **[Structural Debt]** `src/features/settings/utils/progressExport.ts:128-148`
   - **The Debt:** `applyImportedProgress` calls `resetAllProgress()` (which is async — it calls `AsyncStorage.removeItem`) and then immediately calls `setState` synchronously. The reset and apply are not atomic.
   - **The Risk:** If the `resetAllProgress` async operation interleaves with the `setState` call, state can be corrupted — the reset callback may fire after the import data has been applied, wiping the just-imported data.

1. (9) ~~**[Architectural Debt]** `src/shared/ui/LoginPrompt.tsx:38-101`~~ **ACCEPTED — Part of the no-auth design.**
   - **The Design:** The "Is this you?" username claim flow is intentional. Without authentication, this is the expected way for users to access existing data across devices. Privacy relies on username uniqueness. See Finding #1.

### MEDIUM

1. (10) **[Code Hygiene]** `src/features/vocabulary/screens/HomeScreen.tsx:23,27`
    - **The Debt:** Debug `console.log` statements left in production code: `console.log('[HomeScreen] Component rendering')` and `console.log('[HomeScreen] Loaded', vocabularyLists.length, 'vocabulary lists')`.
    - **The Risk:** Performance noise on every render. These execute on every component re-render and pollute production logs.

1. (11) **[Structural Debt]** `src/features/quiz/screens/QuizScreen.tsx:60-83` and `128-155`
    - **The Debt:** Quiz completion check logic is duplicated in two places: the `useEffect` at line 60 and the `handleFeedbackEnd` callback at line 128. Both independently check `isQuizComplete()`, call `endQuiz()`, and navigate to graduation with identical params construction.
    - **The Risk:** If navigation params or completion logic changes, both locations must be updated in lockstep.

1. (12) **[Code Hygiene]** `src/features/settings/utils/progressExport.ts:16`
    - **The Debt:** `listLevelProgress: Record<string, any>` uses `any` type in the exported `ProgressExportData` interface. Additional `any` casts at lines 104 and 106.
    - **The Risk:** Bypasses type safety for the most important data structure in the export/import flow. Malformed import data will not be caught at compile time.

1. (13) **[Operational Debt]** `src/shared/store/progressStore.ts:217`
    - **The Debt:** `JSON.parse(stored)` in `loadFromStorage` has no schema validation. The parsed object is spread directly into Zustand state via `set({...data})`.
    - **The Risk:** Corrupted or tampered AsyncStorage data will silently corrupt the entire store state. No defensive validation like the `validateProgressData` function used in `syncService.ts`.

1. (14) **[Code Hygiene]** Multiple files (12 instances)
    - **The Debt:** 12 `eslint-disable-next-line react-hooks/exhaustive-deps` suppressions across: `QuizScreen.tsx:56,82`, `GraduationScreen.tsx:61,85`, `AnswerFeedback.tsx:90`, `StatsScreen.tsx:21`, `AchievementUnlockModal.tsx:58`, `DifficultyScreen.tsx:50`, `HomeScreen.tsx:90`, `ListCard.tsx:70`, `ProgressBar.tsx:55`.
    - **The Risk:** Suppressed dependency warnings can mask real bugs where effects don't re-run when dependencies change, leading to stale closures.

1. (15) **[Structural Debt]** `src/shared/store/quizStore.ts:64-120` and `src/shared/store/progressStore.ts:241-303`
    - **The Debt:** Both stores independently construct `listLevelProgress` key as `${listId}-${levelId}` (quizStore line ~198 via progressStore, progressStore lines 243, 319, 345, 381, 431, 474). This key format is a de facto schema but has no single source of truth or named helper.
    - **The Risk:** Key format inconsistency between stores would silently corrupt progress lookups. A dash in a listId or levelId would create ambiguous keys.

1. (16) **[Operational Debt]** `src/shared/store/quizStore.ts:180-224`
    - **The Debt:** `submitAnswer` always marks a correct answer as word state `3` (mastered) regardless of the word's current state. The progression model defined in CLAUDE.md (0->1->2->3) is bypassed.
    - **The Risk:** The word state progression model is not enforced — a single correct answer on any question type immediately "masters" the word, contradicting the documented 4-stage learning model.

1. (17) **[Code Hygiene]** `src/shared/ui/ErrorBoundary.tsx:112-118`
    - **The Debt:** Hardcoded colors (`#f5f5f5`, `#fee`, `#c00`) in the ErrorBoundary component instead of using the theme system.
    - **The Risk:** Error screen ignores dark mode, creating a jarring white flash for dark theme users.

### LOW

1. (18) **[Code Hygiene]** `package.json` (knip scan results)
    - **The Debt:** 10 unused production dependencies: `@react-navigation/stack`, `expo-constants`, `expo-linking`, `expo-status-bar`, `react-dom`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-screens`, `react-native-svg`, `react-native-web`. 7 unused dev dependencies.
    - **The Risk:** Inflated bundle size and install time. Some of these may be implicit peer dependencies of expo, but several (e.g., `@react-navigation/stack`) appear genuinely unused.

1. (19) **[Code Hygiene]** `package.json` (npm audit results)
    - **The Debt:** 18 npm vulnerabilities (1 critical, 8 high, 3 moderate, 6 low) primarily in webpack dependency chain.
    - **The Risk:** The webpack vulnerabilities relate to `buildHttp` SSRF which is unlikely to be exploitable in this context, but the critical vulnerability should be assessed.

1. (20) **[Code Hygiene]** knip scan: 12 unused files
    - **The Debt:** Files detected as unused: `scripts/deploy.js`, `scripts/parseXmlToJson.ts`, `scripts/validateVocabulary.ts`, `src/shared/lib/constants.ts`, `src/shared/lib/testUtils.tsx`, and 4 feature `index.ts` barrel files that export nothing consumed.
    - **The Risk:** Dead code increases cognitive load and maintenance burden.

1. (21) **[Code Hygiene]** knip scan: 14 unused exports + 13 unused exported types
    - **The Debt:** The entire `src/shared/lib/storage.ts` module (all 11 exported functions/constants) is unused — stores directly call `AsyncStorage` instead of using this wrapper. `src/shared/services/syncService.ts:44` exports `isOnline` which is only used internally.
    - **The Risk:** The storage wrapper was built but never adopted. Two parallel persistence patterns coexist, causing confusion about which to use.

1. (22) **[Structural Debt]** `backend/src/types.ts` and `src/shared/types/progress.ts`
    - **The Debt:** `Achievement`, `WordProgress`, `WordState`, `ListLevelProgress`, `GlobalStats`, and `UserProgress` types are duplicated between the backend (`backend/src/types.ts`) and frontend (`src/shared/types/progress.ts` + `src/features/progress/utils/achievements.ts`). These are not shared.
    - **The Risk:** Type drift between frontend and backend. If one side adds a field, the other won't know until runtime.

1. (23) **[Structural Debt]** `src/shared/store/progressStore.ts:507-513` and `src/features/progress/utils/achievements.ts:9-19`
    - **The Debt:** The `Achievement` interface is defined in both `achievements.ts:9-19` and re-exported from `src/shared/types/progress.ts`. The progress store imports from `@/shared/types` while other files import directly from `achievements.ts`.
    - **The Risk:** Two canonical sources for the same type create confusion about which to import.

1. (24) **[Code Hygiene]** `src/shared/ui/Typography.tsx:82`
    - **The Debt:** Explicit `as any` cast with `eslint-disable` comment: `variant={VARIANT_MAP[variant] as any}`.
    - **The Risk:** Type mismatch between the custom variant system and react-native-paper's expected variants is papered over rather than properly typed.

## Quick Wins

1. `src/features/vocabulary/screens/HomeScreen.tsx:23,27` — Remove debug `console.log` statements (estimated effort: < 5 minutes)
2. `src/shared/lib/storage.ts` — Either adopt this wrapper in all stores or remove it entirely to eliminate the dead code and dual-pattern confusion (estimated effort: < 1 hour)
3. `src/features/quiz/screens/QuizScreen.tsx:60-83,128-155` — Extract quiz completion logic into a single helper function to eliminate duplication (estimated effort: < 30 minutes)

## Automated Scan Results

**Dead Code (knip):**
- 12 unused files (scripts, barrel exports, test utils)
- 10 unused production dependencies, 7 unused dev dependencies
- 14 unused exports, 13 unused exported types
- 1 duplicate export (`lightTheme`/`default` in `theme.ts`)
- 6 unlisted binaries (resolved via transitive deps but not declared)

**Vulnerability Scan (npm audit):**
- 18 total vulnerabilities: 1 critical, 8 high, 3 moderate, 6 low
- Primary vector: webpack `buildHttp` SSRF vulnerabilities (GHSA-8fgc-7cc6-rx7x, GHSA-38r7-794h-5758)
- All fixable via `npm audit fix` (some require `--force` for breaking changes)

**Secrets Scan:**
- No hardcoded secrets detected
- `.env` properly gitignored
- `.env.example` exists with safe placeholder values
- API URL sourced from `process.env.EXPO_PUBLIC_SYNC_API_URL` (environment variable, not hardcoded)
