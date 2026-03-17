# Phase 0 — Foundation

This phase documents architecture decisions, shared conventions, and testing strategy that apply across all subsequent phases.

## Architecture Decisions

### ADR-1: Accepted Findings (No Remediation)

The following findings are **intentional architectural decisions** and must NOT be remediated:

- **Health Audit Finding #1** — No authentication on sync API. Username-only identification is a deliberate friction trade-off. Inline `ARCHITECTURAL DECISION` comments already exist in `backend/src/index.ts`, `backend/src/validation.ts`, `src/shared/services/syncService.ts`, and `src/shared/ui/LoginPrompt.tsx`.
- **Health Audit Finding #9** — Username claim flow in `LoginPrompt.tsx`. The "Is this you?" flow is part of the no-auth design.
- **Eval Pillar 11: Git Hygiene** — Score 5/10, accepted via `pillar_overrides: git_hygiene: accept`. No remediation required.

### ADR-2: Cleanup Before Structure

We clean up dead code and unused dependencies first (Phase 1) so that subsequent phases work with a smaller, cleaner codebase. This avoids fixing code that should be deleted and reduces noise in type-checking and linting.

### ADR-3: No New Dependencies Unless Required

Phases 1-2 should not introduce new npm dependencies. Phase 3 introduces `husky` and `lint-staged` for pre-commit hooks — these are the only planned new dependencies. Phase 4 may introduce `markdownlint-cli2` and `lychee` if the doc-engineer determines they are needed for CI.

### ADR-4: Backend Changes Are In-Scope

The backend (`backend/`) has active findings (validation gaps, race conditions, CORS defaults). These are remediated in Phase 2 since they affect production safety.

### ADR-5: Storage Wrapper Decision

`src/shared/lib/storage.ts` is unused — all stores call `AsyncStorage` directly. Rather than adopting this wrapper (which would be a large refactor), Phase 1 removes it. The stores' direct `AsyncStorage` usage is fine; the real gap (unvalidated `JSON.parse`) is fixed in Phase 2 with inline validation.

## Shared Conventions

### Commit Messages

All commits use conventional commit format:

```text
type(scope): brief description
```

Types: `chore`, `fix`, `refactor`, `test`, `docs`, `ci`, `perf`
Scopes: `store`, `quiz`, `backend`, `deps`, `ci`, `docs`, `types`, `ui`

### File Organization

- Feature code stays in `src/features/<feature>/`
- Shared code stays in `src/shared/`
- Tests are co-located in `__tests__/` directories next to source
- No new barrel files (`index.ts`) — existing unused ones are removed in Phase 1

### TypeScript

- `strict: true` is already enabled
- No new `any` types allowed; existing ones are removed in Phase 2
- No new `eslint-disable` comments; existing ones are reviewed in Phase 2

## Testing Strategy

### Test Runner

- Jest via `jest-expo` preset
- Run: `npm test` (all tests), `npm test -- --testPathPattern='<name>'` (single file)
- Run with coverage: `npm test -- --coverage`

### Mocking

- `jest.setup.js` already mocks: `AsyncStorage`, `expo-av`, `expo-haptics`, `react-native-chart-kit`
- When adding new tests, check `jest.setup.js` for existing mocks before creating local ones
- Prefer testing behavior over implementation; avoid mocking internal modules when possible

### Test File Naming

- Tests go in `__tests__/<moduleName>.test.ts` (or `.test.tsx` for components)
- Follow existing patterns: `answerValidator.test.ts`, `mergeProgress.test.ts`

### Verification After Each Phase

After completing each phase, run:

```bash
npm run check    # type-check + lint + test
```

All three must pass before the phase is considered complete.

## Deployment Strategy

This is a remediation plan — no deployment changes are required. The app deploys via Expo and the backend via AWS SAM (`sam deploy`). The CI pipeline (`.github/workflows/ci.yml`) runs `npm run check` on push.

## Cross-Reference: Audit Findings to Plan Tasks

| Finding Source | ID | Phase | Task | Summary |
|---|---|---|---|---|
| Health | #2 (CRITICAL) | 2 | 7 | Backend payload validation |
| Health | #3 (CRITICAL) | 2 | 8 | Backend race condition |
| Health | #4 (HIGH) | 2 | 9 | progressStore god object extraction |
| Health | #5 (HIGH) | 2 | 5 | Stale setTimeout in sync status |
| Health | #6 (HIGH) | 2 | 6 | Module-level side effect in vocabularyStore |
| Health | #7 (HIGH) | 2 | 5 | Debounced save flush mechanism |
| Health | #8 (HIGH) | 2 | 5 | Non-atomic import in progressExport |
| Health | #10 (MED) | 1 | 1 | Remove console.log |
| Health | #11 (MED) | 2 | 10 | Quiz completion duplication |
| Health | #12 (MED) | 2 | 2 | Fix `any` types in progressExport |
| Health | #13 (MED) | 2 | 4 | Unvalidated JSON.parse in progressStore |
| Health | #14 (MED) | 2 | 3 | Review eslint-disable suppressions |
| Health | #15 (MED) | 2 | 11 | listLevelProgress key helper |
| Health | #16 (MED) | 2 | 10 | Word state progression model |
| Health | #17 (MED) | 2 | 1 | ErrorBoundary hardcoded colors |
| Health | #18 (LOW) | 1 | 3 | Unused dependencies |
| Health | #19 (LOW) | 1 | 4 | npm vulnerabilities |
| Health | #20 (LOW) | 1 | 2 | Unused files |
| Health | #21 (LOW) | 1 | 2 | Unused exports |
| Health | #22 (LOW) | 2 | 2 | Duplicated types frontend/backend |
| Health | #23 (LOW) | 2 | 2 | Duplicate Achievement type |
| Health | #24 (LOW) | 2 | 1 | Typography `as any` cast |
| Eval | Type Rigor | 2 | 1-2 | Replace `any` types, add validation |
| Eval | Defensiveness | 2 | 4-5 | Schema validation, flush mechanism |
| Eval | Performance | 2 | 12 | Cache getAllWords, optimize Levenshtein |
| Eval | Pragmatism | 2 | 7-8 | Backend fixes |
| Eval | Reproducibility | 3 | 1-3 | Husky, devcontainer, passWithNoTests |
| Eval | Test Value | 2 | 13 | Quiz integration test |
| Eval | Onboarding | 4 | 5 | CONTRIBUTING.md, PR template |
| Doc | Drift 1-6 | 4 | 1-3 | Fix doc inaccuracies |
| Doc | Gaps 1-3 | 4 | 3-4 | Fill doc gaps |
| Doc | Stale examples | 4 | 2 | Fix stale code examples |
