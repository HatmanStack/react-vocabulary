---
type: repo-eval
target: 9
role_level: Senior Developer
date: 2026-03-17
pillar_overrides:
  git_hygiene: accept
---

# Repo Evaluation: react-vocabulary

## Configuration
- **Role Level:** Senior Developer — production: defensive coding, observability, performance awareness, type rigor
- **Focus Areas:** None — balanced evaluation across all pillars
- **Exclusions:** Standard exclusions (vendor, generated, node_modules, __pycache__)

## Combined Scorecard

| # | Lens | Pillar | Score | Target | Status |
|---|------|--------|-------|--------|--------|
| 1 | Hire | Problem-Solution Fit | 8/10 | 9 | NEEDS WORK |
| 2 | Hire | Architecture | 8/10 | 9 | NEEDS WORK |
| 3 | Hire | Code Quality | 7/10 | 9 | NEEDS WORK |
| 4 | Hire | Creativity | 7/10 | 9 | NEEDS WORK |
| 5 | Stress | Pragmatism | 7/10 | 9 | NEEDS WORK |
| 6 | Stress | Defensiveness | 6/10 | 9 | NEEDS WORK |
| 7 | Stress | Performance | 7/10 | 9 | NEEDS WORK |
| 8 | Stress | Type Rigor | 5/10 | 9 | NEEDS WORK |
| 9 | Day 2 | Test Value | 8/10 | 9 | NEEDS WORK |
| 10 | Day 2 | Reproducibility | 7/10 | 9 | NEEDS WORK |
| 11 | Day 2 | Git Hygiene | 5/10 | N/A | ACCEPTED |
| 12 | Day 2 | Onboarding | 8/10 | 9 | NEEDS WORK |

**Pillars at target (>=9):** 0/12
**Pillars needing work (<9):** 11/12 (Git Hygiene accepted)

## Hire Evaluation — The Pragmatist

### VERDICT
- **Decision:** HIRE
- **Overall Grade:** B+
- **One-Line:** "A well-organized port of an Android vocabulary app that solves a real problem with appropriate technology and demonstrates thoughtful domain modeling."

### SCORECARD
| Pillar | Score | Evidence |
|--------|-------|----------|
| Problem-Solution Fit | 8/10 | `package.json:24-47` — Expo + Zustand + React Native Paper is a proportional stack for a cross-platform vocabulary quiz app. No over-engineering; 18 dependencies are all justified. `src/shared/services/syncService.ts:1-260` — Cloud sync is optional (gated by env var), showing restraint. |
| Architecture | 8/10 | `src/features/quiz/utils/answerValidator.ts:1-114` — Clean feature module separation with co-located utils/components/screens. `src/shared/store/progressStore.ts:1-738` — The progress store is the largest file at 738 lines; it handles too many concerns (persistence, sync, achievements, stats) but the damage is contained by Zustand's flat API. |
| Code Quality | 7/10 | `src/features/vocabulary/screens/HomeScreen.tsx:23,27` — Debug `console.log` statements left in production code. `src/features/settings/utils/progressExport.ts:16,104,106` — `any` types used in data processing. `src/shared/ui/Typography.tsx:82` — `as any` cast with eslint-disable, a pragmatic workaround for Paper's variant typing but still a smell. |
| Creativity | 7/10 | `src/shared/utils/mergeProgress.ts:19-38` — The "higher wins" merge strategy for cloud sync conflict resolution is a thoughtful design choice that avoids complex CRDTs. `src/shared/store/adaptiveDifficultyStore.ts:78-121` — Adaptive difficulty biasing question types based on accuracy thresholds (80%/50%) shows genuine domain thinking beyond a naive implementation. |

### HIGHLIGHTS
- **Brilliance:**
  - `src/shared/utils/mergeProgress.ts:19-38` — The `mergeWordProgress` function implements a clean, deterministic merge strategy (max state, earliest first attempt, latest last attempt, earliest mastered date). Well-thought-out conflict resolution without over-engineering.
  - `src/shared/services/syncService.ts:120-156` — The retry logic correctly distinguishes transient vs. non-transient errors (no retry on 4xx, retry on 5xx/network/timeout) with linear backoff. The `SyncError` class with error codes is a clean pattern.
  - `src/shared/hooks/useReducedMotion.ts:1-32` — Accessibility-conscious design: respects `prefers-reduced-motion` system setting.
  - `src/shared/hooks/useSound.ts:30-71` — Proper cleanup pattern with `isMounted` guard and `unloadAsync` on unmount.
  - `src/features/quiz/utils/answerValidator.ts:47-74` — Levenshtein-based typo tolerance combined with morphological variations (plurals, tenses) is a creative answer validation approach.

- **Concerns:**
  - `src/features/vocabulary/screens/HomeScreen.tsx:23,27` — `console.log` debug statements fire on every render in production.
  - `src/shared/store/progressStore.ts:1-738` — Monolith handling persistence, cloud sync, achievement checking, session management, and progress calculation.
  - `src/features/quiz/screens/QuizScreen.tsx:60-83` — Quiz completion check in `useEffect` with `eslint-disable-next-line react-hooks/exhaustive-deps` suppresses a legitimate dependency warning. Dual completion check is a code smell.
  - `src/shared/store/vocabularyStore.ts:124` — `useVocabularyStore.getState().loadVocabularyLists()` called at module evaluation time (top-level side effect).
  - `src/shared/store/progressStore.ts:34` — Module-level mutable state (`let saveDebounceTimer`) outside the store.

### REMEDIATION TARGETS

- **Code Quality (current: 7/10 → target: 9/10)**
  - Remove debug `console.log` statements from `src/features/vocabulary/screens/HomeScreen.tsx:23,27`
  - Address `any` types in `src/features/settings/utils/progressExport.ts:16,104,106`
  - Fix the `as any` cast in `src/shared/ui/Typography.tsx:82`
  - Estimated complexity: LOW

- **Architecture (current: 8/10 → target: 9/10)**
  - Extract cloud sync logic from `src/shared/store/progressStore.ts` into a dedicated sync module
  - Move the module-level side effect at `src/shared/store/vocabularyStore.ts:124` into explicit initialization
  - Encapsulate the debounce timer (`progressStore.ts:34`) inside the store
  - Estimated complexity: MEDIUM

- **Problem-Solution Fit (current: 8/10 → target: 9/10)**
  - The `adaptiveDifficultyStore` appears disconnected from the actual quiz flow. Either integrate it or remove it.
  - Estimated complexity: LOW

- **Creativity (current: 7/10 → target: 9/10)**
  - Quiz completion flow has duplicated logic (`QuizScreen.tsx:60-83` and `QuizScreen.tsx:128-155`). A state machine pattern would be more elegant.
  - Estimated complexity: MEDIUM

---

## Stress Evaluation — The Oncall Engineer

### VERDICT
- **Decision:** MID-LEVEL
- **Seniority Alignment:** Solid mid-level work with some senior-level patterns (merge strategies, error boundaries, retry logic). Falls short of senior expectations on type rigor and defensive JSON parsing.
- **One-Line:** "Clean architecture, thoughtful merge logic, but the JSON parse paths and `any` usage would bite you in production eventually."

### SCORECARD
| Pillar | Score | Evidence |
|--------|-------|----------|
| Pragmatism | 7/10 | `src/shared/store/progressStore.ts:1-738` — proportional complexity; `src/shared/store/adaptiveDifficultyStore.ts:41-151` — well-scoped adaptive logic |
| Defensiveness | 6/10 | `src/shared/services/syncService.ts:64-115` — good timeout/retry; `src/shared/store/progressStore.ts:217` — unvalidated JSON.parse from storage |
| Performance | 7/10 | `src/shared/lib/levenshtein.ts:28` — O(n*m) full matrix allocation; `src/features/vocabulary/utils/vocabularyLoader.ts:90-99` — getAllWords rebuilds array every call |
| Type Rigor | 5/10 | `src/features/settings/utils/progressExport.ts:16,104,106` — `Record<string, any>` in production code; `src/shared/lib/storage.ts:32` — `JSON.parse() as T` with no validation |

### CRITICAL FAILURE POINTS

1. **Unvalidated deserialization from AsyncStorage** — `src/shared/store/progressStore.ts:217`: `JSON.parse(stored)` feeds directly into `set({...data})` with zero schema validation. If storage is corrupted, the entire progress store hydrates with garbage. The settings store at `src/shared/store/settingsStore.ts:70` has the same pattern.

2. **Module-level side effect on import** — `src/shared/store/vocabularyStore.ts:124`: Fires synchronously at module load time. If any imported JSON file is malformed, the entire store initialization throws before the app renders, bypassing the ErrorBoundary.

3. **Race condition in debounced save** — `src/shared/store/progressStore.ts:176-199`: Module-level `let` variable. If the user triggers rapid state changes then closes the app within the 500ms debounce window, the pending save is lost.

4. **Unvalidated import data applied directly to store** — `src/features/settings/utils/progressExport.ts:128-148`: `applyImportedProgress` calls `JSON.parse` and immediately sets store state with minimal validation.

5. **No rate limiting on cloud sync retries from client** — `src/shared/services/syncService.ts:129-153`: Linear backoff with no throttle on the settings screen retry button.

### HIGHLIGHTS

- **Brilliance:**
  - `src/shared/utils/mergeProgress.ts:1-252` — Production-quality CRDT-lite thinking.
  - `src/shared/services/syncService.ts:64-156` — Proper AbortController timeout handling, typed error classes.
  - `app/_layout.tsx:14-101` — App-resume sync throttle, loading state gate, Snackbar error display.
  - `backend/src/validation.ts:1-80` — Input validation with length bounds, character pattern enforcement.
  - `src/shared/ui/ErrorBoundary.tsx:38-109` — Proper React error boundary with reset capability.

- **Concerns:**
  - `src/features/settings/utils/progressExport.ts:16` — `Record<string, any>` in a type definition governing import/export.
  - `src/features/quiz/screens/QuizScreen.tsx:131-154` — `setTimeout(() => { ... }, 300)` for quiz completion navigation is a timer-based race condition.
  - `src/shared/store/quizStore.ts:198` — `prevIndex` calculation is fragile, relying on ordering between methods.
  - `src/features/vocabulary/screens/HomeScreen.tsx:23,27` — Debug `console.log` in production.

### REMEDIATION TARGETS

- **Defensiveness (current: 6/10 → target: 9/10)**
  - Add schema validation to all `JSON.parse` deserialization points: `progressStore.ts:217`, `settingsStore.ts:70`, `progressExport.ts:87,130`
  - Add a `flush` mechanism to `saveStateToStorage` that fires on `AppState` change to `background`/`inactive`
  - Clear the `setTimeout` in `QuizScreen.tsx:131` on component unmount
  - Files: `progressStore.ts`, `settingsStore.ts`, `progressExport.ts`, `_layout.tsx`, `QuizScreen.tsx`
  - Estimated complexity: MEDIUM

- **Type Rigor (current: 5/10 → target: 9/10)**
  - Replace `Record<string, any>` in `progressExport.ts:16` with actual `ListLevelProgress` type
  - Replace `as T` casts in `storage.ts:32,103` with runtime validation
  - Move backend `types.ts` to shared location or validate frontend/backend types stay in sync
  - Remove debug `console.log` from `HomeScreen.tsx:23,27`
  - Estimated complexity: MEDIUM

- **Performance (current: 7/10 → target: 9/10)**
  - Cache the result of `getAllWords()` in `vocabularyLoader.ts:90-99`
  - Optimize Levenshtein implementation at `levenshtein.ts:28` to single-row DP
  - Cache `getTotalWordsLearned` in `progressStore.ts:443-457` or maintain running count
  - Estimated complexity: LOW

- **Pragmatism (current: 7/10 → target: 9/10)**
  - Backend `db.ts:67-73` performs extra `GetCommand` per save. Use `if_not_exists` expression instead.
  - `ALLOWED_ORIGINS` default of `'*'` at `backend/src/index.ts:6` is an insecure default.
  - Estimated complexity: LOW

---

## Day 2 Evaluation — The Team Lead

### VERDICT
- **Decision:** COLLABORATOR
- **Collaboration Score:** High
- **One-Line:** "Writes code for the team, with a few rough edges in git history that betray solo-developer origins."

### SCORECARD
| Pillar | Score | Evidence |
|--------|-------|----------|
| Test Value | 8/10 | `src/features/quiz/utils/__tests__/answerValidator.test.ts` — tests behavior (typo tolerance, edge cases, real word variations), not implementation. `src/shared/utils/__tests__/mergeProgress.test.ts` — includes purity assertion (line 397). Zero placeholder tests found. 27 test files across 57 source files (~47% file coverage). |
| Reproducibility | 7/10 | `.github/workflows/ci.yml` — runs lint+type-check+test via `npm run check`. `package-lock.json` committed. `.env.example` present. No Docker, no pre-commit hooks, no `.devcontainer`. |
| Git Hygiene | 5/10 | Early history: `Init`, `README`, `Development fixed`, `Deployed`, `link`. Later history uses conventional commits well. Commit `aea16c2` touches 27 files with 4,456 insertions. Single contributor. |
| Onboarding | 8/10 | `README.md` has 3-step quick start. `docs/README.md` has detailed architecture. `CLAUDE.md` has comprehensive dev instructions. `docs/DEPLOYMENT.md` and `docs/BACKEND-API.md` exist. Missing: `CONTRIBUTING.md`, no PR template. |

### RED FLAGS

- **Mega-commit `aea16c2`**: 27 files changed, 4,456 insertions in a single commit. Makes bisecting impossible.
- **Early git history is unprofessional**: Commits like `Init`, `README`, `Development fixed`, `Deployed`, `link`.
- **No pre-commit hooks or `.husky` config**: The `check` script exists but nothing enforces it locally.
- **No e2e or integration tests for the frontend**: All 27 test files are unit-level. No Detox, Maestro, or Playwright config.
- **`--passWithNoTests` in `package.json:11`**: Jest silently passes when test files are excluded or renamed.

### HIGHLIGHTS

- **Process Win:** `mergeProgress.test.ts` — Exemplary test file with edge cases and mutation safety assertions.
- **Process Win:** `answerValidator.test.ts` — Reads like documentation with semantic describe blocks.
- **Process Win:** `syncService.test.ts` — Tests both "with API configured" and "without API configured" paths.
- **Process Win:** `npm run check` chains type-check, lint, and test in one command.
- **Maintenance Drag:** `quizStore.test.ts` has 4 `jest.mock()` calls and heavy mock wiring (lines 10-38).

### REMEDIATION TARGETS

- **Git Hygiene (current: 5/10 → target: N/A)** — ACCEPTED, no remediation required.

- **Reproducibility (current: 7/10 → target: 9/10)**
  - Add Husky + lint-staged for pre-commit hooks
  - Add `.devcontainer/devcontainer.json`
  - Remove `--passWithNoTests` from test script in `package.json:11`
  - Estimated complexity: LOW

- **Test Value (current: 8/10 → target: 9/10)**
  - Add at least one integration/e2e smoke test for the core quiz flow
  - Reduce mock coupling in `quizStore.test.ts` — test with real modules instead of mocking them
  - Estimated complexity: MEDIUM

- **Onboarding (current: 8/10 → target: 9/10)**
  - Add `CONTRIBUTING.md` with branch naming conventions, PR process
  - Add `.github/pull_request_template.md`
  - Document the decision to use Zustand over Redux/Context
  - Estimated complexity: LOW

---

## Consolidated Remediation Targets

Merged and deduplicated targets from all 3 evaluators, prioritized by lowest score first:

### Priority 1: Type Rigor (5/10 → 9/10)
- Replace `Record<string, any>` in `progressExport.ts:16` with proper types
- Replace `as T` casts in `storage.ts:32,103` with runtime validation
- Sync or share types between `backend/src/types.ts` and `src/shared/types/progress.ts`
- Fix `as any` cast in `Typography.tsx:82`
- **Complexity: MEDIUM**

### Priority 2: Defensiveness (6/10 → 9/10)
- Add schema validation to all `JSON.parse` deserialization: `progressStore.ts:217`, `settingsStore.ts:70`, `progressExport.ts:87,130`
- Add flush-on-background mechanism for debounced save in `progressStore.ts`
- Clear timeouts on unmount in `QuizScreen.tsx:131`
- **Complexity: MEDIUM**

### Priority 3: Code Quality (7/10 → 9/10) + Pragmatism (7/10 → 9/10) + Performance (7/10 → 9/10)
- Remove debug `console.log` in `HomeScreen.tsx:23,27`
- Cache `getAllWords()` in `vocabularyLoader.ts:90-99`
- Optimize `db.ts:67-73` to use `if_not_exists` instead of read-then-write
- Fix insecure `ALLOWED_ORIGINS` default of `'*'` in `backend/src/index.ts:6`
- Cache Levenshtein or optimize to single-row DP
- **Complexity: LOW-MEDIUM**

### Priority 4: Reproducibility (7/10 → 9/10)
- Add Husky + lint-staged pre-commit hooks
- Add `.devcontainer/devcontainer.json`
- Remove `--passWithNoTests` from Jest config
- **Complexity: LOW**

### Priority 5: Architecture (8/10 → 9/10) + Problem-Solution Fit (8/10 → 9/10)
- Extract sync logic from `progressStore.ts` into dedicated module
- Move `vocabularyStore.ts:124` side effect into explicit initialization
- Integrate or remove `adaptiveDifficultyStore`
- Refactor quiz completion flow with state machine pattern
- **Complexity: MEDIUM**

### Priority 6: Test Value (8/10 → 9/10) + Onboarding (8/10 → 9/10) + Creativity (7/10 → 9/10)
- Add integration/e2e smoke test for quiz flow
- Reduce mock coupling in `quizStore.test.ts`
- Add `CONTRIBUTING.md` and PR template
- Document architectural decisions (Zustand choice, etc.)
- **Complexity: MEDIUM**
