# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-17

### Fixed

- Imported progress no longer lost on force-close — persistence flush added after import
- "New personal best" detection on GraduationScreen now compares against previous best score instead of the already-updated one
- Backend payload size check uses `Buffer.byteLength` for accurate UTF-8 byte counting
- Backend and frontend validators reject arrays where plain objects are expected (`listLevelProgress`, `globalStats`)
- `syncFromCloud` persists merged state immediately instead of relying on debounced save
- `syncToCloud` persists `lastCloudSyncAt` immediately to survive crash within debounce window
- Sync guards moved to store level to prevent duplicate concurrent syncs
- `listLevelKey` uses unambiguous JSON encoding instead of hyphen delimiter
- `getAllWords` returns a shallow copy to protect the module-level cache from mutation
- `importProgress` validates data structure before computing preview stats
- Stale "8 questions" comments removed from quizStore — actual count is `words.length * 2`

### Changed

- Backend `saveProgress` uses single atomic `UpdateCommand` with `if_not_exists` instead of read-then-write
- Extracted cloud sync orchestration from progressStore into `syncOrchestrator.ts`
- Vocabulary store uses lazy initialization instead of module-level side effect
- Quiz completion logic deduplicated into single `navigateToGraduation` callback
- Word state progression enforced (0→1→2→3) instead of jumping straight to mastered
- Levenshtein distance optimized to rolling two-row DP
- `getAllWords` result cached at module level
- Schema validation added to all `JSON.parse` deserialization paths
- `eslint-disable` suppressions reviewed and annotated with rationale
- Duplicate types consolidated; `listLevelKey` helper extracted as single source of truth
- `any` types and unsafe casts eliminated from production code
- ErrorBoundary uses theme colors instead of hardcoded values
- Debounce flush on app background via `flushPendingSave` in root layout
- Stale timers for sync status reset tracked and cleared properly
- Non-atomic reset+apply in progress import fixed with awaited reset
- CORS default changed from `'*'` to `''` (secure by default, set via env var)
- Dead `resetStats` method removed from quizStore

### Added

- Husky + lint-staged pre-commit hooks for lint and format enforcement
- Devcontainer configuration for reproducible dev environments
- `no-console` ESLint rule to prevent debug log regression
- Markdownlint in CI pipeline for documentation quality
- `CONTRIBUTING.md` with development setup, conventions, and architecture pointers
- Pull request template (`.github/pull_request_template.md`)
- Quiz flow integration test with word state progression verification
- Backend tests for array rejection, oversized payloads, and atomic write assertions
- Frontend tests for array rejection in all state validators
- Cloud sync merge strategy documented in `docs/README.md` (deterministic `mergeProgress` rules)
- Progress export/import feature documented
- `adaptiveDifficultyStore` added to docs store table
- `INVALID_PROGRESS_DATA` error code added to backend API docs

### Removed

- Unused files: `storage.ts` wrapper, `constants.ts` placeholder, `testUtils.tsx`, data migration scripts
- Unused dependencies: `@react-navigation/stack`, `expo-constants`, `expo-linking`, `expo-status-bar`
- Unused barrel files and exports
- Dead `@/app/*` path alias from tsconfig
- `--passWithNoTests` flag from Jest config
- Debug `console.log` statements from HomeScreen and quizStore

## [1.0.0] - 2026-02-05

### Added

- Interactive vocabulary quiz app with Expo Router and React Native
- 18 themed word lists with 350 words across 5 difficulty levels
- Quiz sessions with multiple-choice and fill-in-the-blank questions
- Levenshtein distance-based typo tolerance for fill-in-the-blank answers
- Word progress tracking (not started → seen → partial → mastered)
- Achievement system and progress statistics with charts
- Adaptive difficulty engine
- Sound effects and haptic feedback
- Light/dark/auto theme support (Material Design 3 via React Native Paper)
- Onboarding flow with optional cloud sync login
- Cloud sync service with retry logic and throttled 5-minute sync intervals
- Zustand stores with debounced AsyncStorage persistence
- AWS SAM Lambda backend with DynamoDB for cloud sync
- Interactive deployment script for backend
- Comprehensive SEO metadata for web
- Responsive grid layout for vocabulary lists
- Comprehensive test suite with Jest and jest-expo
- ESLint, Prettier, and TypeScript strict mode configuration

### Changed

- Simplified SEO implementation in +html.tsx
- Added consistent maxWidth constraints to screens and dialogs
- Simplified CORS configuration for backend
- Moved deploy script to root with .env.deploy pattern

### Fixed

- CORS and API URL issues in backend
- Consistent local timezone date formatting in achievement tests
- Lint errors in settings screen
- Help screen styling for large screens and dark theme
- Production readiness improvements from code audit

[1.1.0]: https://github.com/HatmanStack/react-vocabulary/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/HatmanStack/react-vocabulary/releases/tag/v1.0.0
