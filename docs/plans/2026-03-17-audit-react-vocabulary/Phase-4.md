# Phase 4 — [DOC-ENGINEER] Documentation Fixes

## Phase Goal

Fix all documentation drift findings, fill documentation gaps, correct stale code examples, and add documentation prevention tooling (markdownlint in CI). Update docs to reflect the changes made in Phases 1-3.

**Success criteria:** All doc-audit drift findings resolved. Stale code examples fixed. `CONTRIBUTING.md` and PR template exist. Word count is accurate. Structure trees match actual codebase. markdownlint runs in CI.

**Estimated tokens:** ~15,000

## Prerequisites

- Phases 1-3 complete (documentation must reflect the final state of the codebase)
- `npm run check` passes on current state

## Tasks

---

### Task 1: Fix Word Count Claims

**Goal:** Correct the "360+ words" claim across all docs to the actual count of 350 words.

**Findings addressed:** Doc Drift #1

**Files to Modify:**
- `README.md` — Line ~10: Change "360+" to "350"
- `docs/README.md` — Lines ~7 and ~10: Change "360+" to "350"
- `CHANGELOG.md` — Line ~13: Change "360+" to "350"
- `app/_layout.tsx` — Line ~125: If there is a word count reference, update it

**Prerequisites:** Verify the actual word count has not changed from 350 during Phases 1-3.

**Implementation Steps:**

1. Verify the current word count:
   ```bash
   node -e "
   const fs = require('fs');
   const path = require('path');
   const dir = './src/assets/vocabulary';
   let total = 0;
   fs.readdirSync(dir).filter(f => f.endsWith('.json')).forEach(f => {
     const data = JSON.parse(fs.readFileSync(path.join(dir, f)));
     if (data.levels) data.levels.forEach(l => { total += l.words.length; });
   });
   console.log(total);
   "
   ```

2. Search for "360" across all docs and code:
   ```bash
   grep -rn "360" README.md docs/ CHANGELOG.md app/ src/ --include="*.md" --include="*.tsx" --include="*.ts"
   ```

3. Replace every instance of "360+" with the actual count (e.g., "350").

**Verification Checklist:**
- [ ] No instance of "360+" remains in documentation or code
- [ ] Word count matches actual vocabulary data count
- [ ] `npm run check` passes

**Testing Instructions:**
- Run: `grep -rn "360" . --include="*.md" --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v docs/plans`
- Should return zero results

**Commit Message Template:**
```text
docs: fix word count from 360+ to actual count of 350
```

---

### Task 2: Fix Quiz Flow Description and Stale Code Examples

**Goal:** Correct the quiz flow description in docs and fix stale deploy command examples.

**Findings addressed:** Doc Drift #2, Doc Stale Examples #1-2

**Files to Modify:**
- `docs/README.md` — Line ~50: Fix quiz flow description
- `docs/BACKEND-API.md` — Lines ~17-20: Fix quick start command
- `docs/DEPLOYMENT.md` — Lines ~18-20 and ~32-36: Fix deploy commands
- `CLAUDE.md` — Verify quiz description accuracy

**Prerequisites:** Phase 2 Task 10 complete (quiz logic may have changed)

**Implementation Steps:**

1. **Fix quiz flow description (docs/README.md line ~50):**
   The doc says "8 questions per session (4 multiple-choice + 4 fill-in-blank)".
   After Phase 2, check the actual quiz behavior. The code generates 2 questions per word (1 MC + 1 fill-in-blank) for all words in the selected level. Update to match actual behavior:
   ```
   3. **Take the Quiz** – 2 questions per word (1 multiple-choice + 1 fill-in-blank)
   ```

2. **Verify CLAUDE.md quiz description:**
   CLAUDE.md says "4 words per session, each gets 2 questions". Check if this was changed in Phase 2. If the code uses all words from the level (not a fixed 4), update CLAUDE.md accordingly.

3. **Fix deploy commands in docs/BACKEND-API.md (lines ~17-20):**
   The doc shows `npm install && npm run deploy` which implies running from the backend directory, but the backend `package.json` has no `deploy` script — deploy is at the root level.
   Fix to:
   ```bash
   cd backend
   npm install
   cd ..
   npm run deploy
   ```
   Or if deploy can be run from root:
   ```bash
   npm run deploy
   ```
   Check `scripts/deploy.js` to understand the correct invocation.

4. **Fix deploy commands in docs/DEPLOYMENT.md (lines ~18-20 and ~32-36):**
   Same issue — `cd backend && npm run deploy` is incorrect. Fix to match the actual deploy process.

**Verification Checklist:**
- [ ] Quiz flow description matches actual code behavior
- [ ] Deploy commands in BACKEND-API.md are correct
- [ ] Deploy commands in DEPLOYMENT.md are correct
- [ ] CLAUDE.md quiz description is accurate
- [ ] `npm run check` passes

**Testing Instructions:**
- Manually verify the deploy script path: `cat scripts/deploy.js | head -5`
- Verify the backend package.json scripts: `cat backend/package.json | grep deploy`

**Commit Message Template:**
```text
docs: fix quiz flow description and stale deploy commands
```

---

### Task 3: Fix Project Structure Trees and Store Table

**Goal:** Update the project structure trees in docs to match the actual codebase, including missing directories, files, and stores.

**Findings addressed:** Doc Drift #3, #4, #5, #6

**Files to Modify:**
- `docs/README.md` — Update the project structure tree (lines ~67-98) and store table (line ~111)

**Prerequisites:** Phases 1-3 complete (file deletions and additions are finalized)

**Implementation Steps:**

1. **Update the `app/` directory tree (Drift #4):**
   Add the missing files to the tree:
   - `index.tsx` — Entry/splash screen
   - `onboarding.tsx` — Onboarding flow
   - `+html.tsx` — HTML template for web

2. **Update the features listing (Drift #5):**
   Add the missing feature module:
   - `onboarding/` — Onboarding flow screens

3. **Update the shared directory listing (Drift #6):**
   Add the missing subdirectories:
   - `lib/` — Theme, levenshtein (note: `storage.ts` and `constants.ts` were removed in Phase 1)
   - `utils/` — mergeProgress, listLevelKey (added in Phase 2)

4. **Update the store table (Drift #3):**
   Add the missing store:
   ```
   | `adaptiveDifficultyStore` | Adaptive difficulty biasing |
   ```

5. **Verify against actual directory listing:**
   ```bash
   ls app/
   ls src/features/
   ls src/shared/
   ls src/shared/store/
   ```
   Make sure the tree matches reality after all Phase 1-3 changes.

**Verification Checklist:**
- [ ] `app/` tree includes `index.tsx`, `onboarding.tsx`, `+html.tsx`
- [ ] Features list includes `onboarding/`
- [ ] Shared list includes `lib/` and `utils/`
- [ ] Store table includes `adaptiveDifficultyStore`
- [ ] Tree matches actual `ls` output

**Testing Instructions:**
- Compare the documented tree against `find app/ -name "*.tsx" | sort` and `find src/ -type d | sort`

**Commit Message Template:**
```text
docs: update project structure tree and store table to match codebase
```

---

### Task 4: Fill Documentation Gaps

**Goal:** Document previously undocumented features and fill the doc gaps identified in the audit.

**Findings addressed:** Doc Gaps #1, #3, Doc Stale #3 (sound attribution)

**Files to Modify:**
- `docs/README.md` — Add mention of progress export/import feature, document mergeProgress utility
- `docs/SOUNDS.md` — Fix placeholder attribution (or document that attribution is unknown)

**Prerequisites:** None

**Implementation Steps:**

1. **Document mergeProgress (Gap #1):**
   Add a subsection under the Architecture section in `docs/README.md`:
   ```markdown
   ### Cloud Sync Merge Strategy

   When syncing progress between devices, conflicts are resolved by `src/shared/utils/mergeProgress.ts` using a deterministic "higher wins" strategy:
   - Word state: keeps the higher state value
   - First attempt date: keeps the earliest
   - Last attempt date: keeps the latest
   - Mastered date: keeps the earliest
   ```

2. **Document export/import (Gap #3):**
   Add to the Features section in `docs/README.md`:
   ```markdown
   - **Progress Export/Import**: Backup and restore progress data via JSON export
   ```

3. **Fix sound attribution placeholders (docs/SOUNDS.md lines ~42-44):**
   The attribution section has `[Source and License]` placeholders. If the actual sources are unknown, replace with:
   ```markdown
   - correct.mp3: Source unknown — needs attribution research
   - wrong.mp3: Source unknown — needs attribution research
   - complete.mp3: Source unknown — needs attribution research
   ```
   Or if the sounds were created for this project:
   ```markdown
   - correct.mp3: Custom sound effect, no attribution required
   ```

4. **Doc Gap #2 (`src/shared/lib/constants.ts`):** This file was deleted in Phase 1, so the gap no longer applies.

**Verification Checklist:**
- [ ] mergeProgress strategy is documented in docs/README.md
- [ ] Export/import feature is mentioned in docs/README.md
- [ ] Sound attribution placeholders are resolved in docs/SOUNDS.md
- [ ] No `[Source and License]` placeholders remain

**Testing Instructions:**
- Read through the updated docs to verify accuracy
- `grep -rn "\[Source and License\]" docs/` should return zero results

**Commit Message Template:**
```text
docs: document mergeProgress strategy, export/import feature, and sound attribution
```

---

### Task 5: Add CONTRIBUTING.md and PR Template

**Goal:** Add contributor guidelines and a pull request template to improve onboarding.

**Findings addressed:** Eval Onboarding (8/10)

**Files to Create:**
- `CONTRIBUTING.md`
- `.github/pull_request_template.md`

**Prerequisites:** Phase 3 complete (Husky setup should be documented in contributing guide)

**Implementation Steps:**

1. **Create `CONTRIBUTING.md`:**
   Include:
   - Development setup (clone, install, start)
   - Branch naming convention: `<type>/<short-description>` (e.g., `fix/quiz-completion`, `feat/dark-mode`)
   - Commit message format: conventional commits (reference Phase 0 conventions)
   - Pre-commit hooks: mention Husky runs automatically
   - Running checks: `npm run check` (type-check + lint + test)
   - PR process: create PR against `main`, fill in the template, wait for CI
   - Architecture overview: brief pointer to `docs/README.md` and `CLAUDE.md`
   - State management: note that the project uses Zustand (not Redux/Context) for its flat API and minimal boilerplate — this was a deliberate choice for a small-to-medium app

2. **Create `.github/pull_request_template.md`:**
   ```markdown
   ## What

   <!-- Brief description of changes -->

   ## Why

   <!-- Motivation and context -->

   ## How

   <!-- Implementation approach -->

   ## Testing

   - [ ] `npm run check` passes
   - [ ] New tests added for new functionality
   - [ ] Manual testing completed

   ## Screenshots (if applicable)

   <!-- Add screenshots for UI changes -->
   ```

**Verification Checklist:**
- [ ] `CONTRIBUTING.md` exists at repo root
- [ ] `.github/pull_request_template.md` exists
- [ ] Contributing guide mentions conventional commits, Husky, and `npm run check`
- [ ] Zustand decision is documented
- [ ] PR template has testing checklist

**Testing Instructions:**
- Verify markdown renders correctly: open in a markdown viewer

**Commit Message Template:**
```text
docs: add CONTRIBUTING.md and pull request template
```

---

### Task 6: Add Markdownlint to CI

**Goal:** Add markdown linting to the CI pipeline to prevent future documentation drift from formatting issues.

**Findings addressed:** Doc Audit prevention scope (markdownlint)

**Files to Create:**
- `.markdownlint.json` (or `.markdownlint-cli2.jsonc`) — Configuration file

**Files to Modify:**
- `package.json` — Add `markdownlint-cli2` as dev dependency and script
- `.github/workflows/ci.yml` — Add markdown lint step (or include in existing `check` job)

**Prerequisites:** Tasks 1-5 complete (fix docs before linting them)

**Implementation Steps:**

1. Install markdownlint:
   ```bash
   npm install --save-dev markdownlint-cli2
   ```

2. Create `.markdownlint.json` with sensible defaults:
   ```json
   {
     "default": true,
     "MD013": false,
     "MD033": false,
     "MD041": false
   }
   ```
   - `MD013: false` — Disable line length (too noisy for existing docs)
   - `MD033: false` — Allow inline HTML (README uses HTML for badges)
   - `MD041: false` — Don't require first line to be H1 (some docs start with badges or front matter)

3. Add script to `package.json`:
   ```json
   "lint:md": "markdownlint-cli2 '**/*.md' '#node_modules' '#backend'"
   ```

4. Run `npm run lint:md` and fix any violations in the docs updated in Tasks 1-5.

5. Add to CI. Either:
   - Add `npm run lint:md` to the existing `check` script: `"check": "npm run type-check && npm run lint && npm run lint:md && npm run test"`
   - Or add it as a separate step in `.github/workflows/ci.yml` after `npm run check`

**Verification Checklist:**
- [ ] `markdownlint-cli2` is in devDependencies
- [ ] `.markdownlint.json` configuration exists
- [ ] `npm run lint:md` passes on all markdown files
- [ ] CI runs markdown linting
- [ ] `npm run check` passes

**Testing Instructions:**
- Run: `npm run lint:md`
- Verify CI config includes the markdown lint step

**Commit Message Template:**
```text
ci(docs): add markdownlint to CI pipeline for documentation quality
```

---

## Phase Verification

After completing all tasks in this phase:

1. Run `npm run check` — must pass
2. Run `npm run lint:md` — must pass
3. Verify no "360+" word count references remain: `grep -rn "360" . --include="*.md" | grep -v node_modules | grep -v docs/plans`
4. Verify no `[Source and License]` placeholders remain: `grep -rn "\[Source and License\]" docs/`
5. Verify project structure trees in `docs/README.md` match `ls` output
6. Verify `CONTRIBUTING.md` and `.github/pull_request_template.md` exist
7. Verify store table in `docs/README.md` lists all 5 stores
