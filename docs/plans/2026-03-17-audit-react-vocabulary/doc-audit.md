---
type: doc-health
date: 2026-03-17
prevention_scope: Markdown linting (markdownlint) + link checking (lychee)
ci_platform: GitHub Actions
language_stack: JS/TS and Python
---

# Documentation Audit: react-vocabulary

## Configuration
- **Prevention Scope:** Markdown linting (markdownlint) + link checking (lychee)
- **CI Platform:** GitHub Actions
- **Language Stack:** JS/TS and Python (both)
- **Constraints:** None — all docs audited

## Summary
- Docs scanned: 7 files (README.md, CLAUDE.md, CHANGELOG.md, docs/README.md, docs/BACKEND-API.md, docs/DEPLOYMENT.md, docs/SOUNDS.md)
- Code modules scanned: 6 features, 7 shared subdirectories, 1 backend module
- Findings: 6 drift, 3 gaps, 0 stale, 0 broken links

## Findings

### DRIFT (doc exists, doesn't match code)

1. **`README.md:10` + `docs/README.md:7,10` + `CHANGELOG.md:13` + `app/_layout.tsx:125`** — Word count claim "360+ words"
   - Doc says: "360+ words" (across all four docs)
   - Code says: 350 total words across 18 JSON files in `src/assets/vocabulary/`
   - Actual count is 350, which does not satisfy "360+"

2. **`docs/README.md:50`** — Quiz flow description
   - Doc says: "8 questions per session (4 multiple-choice + 4 fill-in-blank)"
   - Code says: Questions are 2 per word (1 multiple-choice + 1 fill-in-blank), with the number of words being however many are in the selected level — not a fixed "4 words per session". The quiz store at `src/shared/store/quizStore.ts:92-95` generates questions from `words` (all words in the level), not a fixed subset of 4.
   - CLAUDE.md's claim of "4 words per session" is also not enforced in code — the store uses all words from `getWordsByListLevel()`.

3. **`docs/README.md:111` + `CLAUDE.md:34`** — Store listing omission
   - Doc says (docs/README.md): 4 stores listed: `vocabularyStore`, `quizStore`, `progressStore`, `settingsStore`
   - Code says: 5 stores exist. `adaptiveDifficultyStore` at `src/shared/store/adaptiveDifficultyStore.ts` is missing from the docs/README.md store table.
   - CLAUDE.md correctly lists all 5 stores.

4. **`docs/README.md:67-98`** — Project structure tree for `app/` directory
   - Doc says: Lists 8 screens: `_layout.tsx`, `home.tsx`, `difficulty.tsx`, `quiz.tsx`, `graduation.tsx`, `stats.tsx`, `settings.tsx`, `help.tsx`
   - Code says: `app/` directory has 10 files. Missing from the tree: `index.tsx` (entry/splash screen), `onboarding.tsx` (onboarding flow), `+html.tsx` (HTML template for web)

5. **`docs/README.md:83-84`** — Feature modules listing
   - Doc says: 5 feature modules listed: `vocabulary/`, `quiz/`, `progress/`, `settings/`, `help/`
   - Code says: 6 feature modules exist. `onboarding/` at `src/features/onboarding/` is missing from the docs structure tree.

6. **`docs/README.md:87-91`** — Shared directory structure
   - Doc says: 5 subdirectories listed: `store/`, `types/`, `ui/`, `hooks/`, `services/`
   - Code says: 7 subdirectories exist. Missing from the tree: `lib/` (theme, storage, constants, levenshtein) and `utils/` (mergeProgress). Both are correctly documented in CLAUDE.md but absent from docs/README.md's tree.

### GAPS (code exists, no doc)

1. **`src/shared/utils/mergeProgress.ts`** — Exported `mergeProgress()` utility used by `progressStore.ts` for cloud sync conflict resolution. Not documented anywhere. The `docs/DEPLOYMENT.md:184-185` vaguely mentions "timestamp-based merge" but the actual utility and its merge strategy are undocumented.

2. **`src/shared/lib/constants.ts`** — Exists in the `lib/` directory but is empty (just `export {}`). Placeholder file with no documentation or purpose.

3. **`src/features/settings/utils/progressExport.ts`** — Exported progress export/import functionality. Not documented in any user-facing docs (import/export feature is not mentioned in docs/README.md features list).

### STALE (doc exists, code doesn't)

None found.

### BROKEN LINKS

None found. All internal relative links resolve correctly:
- `README.md` → `docs/README.md`, `docs/DEPLOYMENT.md`, `docs/BACKEND-API.md`, `LICENSE`, `public/og-image.jpg` — all exist
- `docs/` inter-document links all resolve
- `docs/README.md` → `../README.md` resolves

### STALE CODE EXAMPLES

1. **`docs/BACKEND-API.md:17-20`** — Quick start example
   - Shows `npm install && npm run deploy` from backend directory
   - Backend `package.json` has no `deploy` script; deploy is root-level only

2. **`docs/DEPLOYMENT.md:18-20` and `docs/DEPLOYMENT.md:32-36`** — Same issue
   - Shows `cd backend && npm install && npm run deploy`
   - Should be `npm run deploy` from project root

3. **`tsconfig.json:8`** — Path alias `@/app/*` maps to `./src/app/*`
   - The directory `src/app/` does not exist
   - No code imports use `@/app/*`
   - Dead path alias

### CONFIG DRIFT

No config drift found:
- `.env.example` correctly documents `EXPO_PUBLIC_SYNC_API_URL`
- Backend env vars `TABLE_NAME` and `ALLOWED_ORIGINS` correctly documented in `docs/BACKEND-API.md:111-114`

### STRUCTURE ISSUES

1. **`docs/README.md` project structure tree is incomplete** — Missing `index.tsx`, `onboarding.tsx`, `+html.tsx` from app directory; missing `onboarding/` from features; missing `lib/` and `utils/` from shared. The tree gives an incomplete picture of the actual codebase.

2. **CLAUDE.md vs docs/README.md consistency** — CLAUDE.md is more accurate than docs/README.md in several areas (lists all 5 stores, mentions `lib/` directory). These two documents describe the same architecture but have drifted from each other.

3. **`docs/SOUNDS.md:42-44`** — Attribution section has placeholder text: `[Source and License]` for all three sound files. The sound files exist (`src/assets/sounds/correct.mp3`, `wrong.mp3`, `complete.mp3`) but have no actual attribution recorded.
