# Phase 3 — [FORTIFIER] Guardrails

## Phase Goal

Add pre-commit hooks, CI hardening, and configuration fixes that prevent regressions. This phase introduces Husky + lint-staged for local enforcement, removes the `--passWithNoTests` footgun, and adds a devcontainer for reproducibility.

**Success criteria:** Pre-commit hooks run lint and type-check on staged files. `--passWithNoTests` removed from Jest config. Devcontainer configuration exists. `npm run check` passes.

**Estimated tokens:** ~12,000

## Prerequisites

- Phase 2 complete (code fixes in place — hooks should guard the fixed state)
- `npm run check` passes on current state

## Tasks

---

### Task 1: Add Husky + lint-staged Pre-commit Hooks

**Goal:** Install Husky and lint-staged to enforce lint and type-check on every commit locally.

**Findings addressed:** Eval Reproducibility (7/10), Eval Red Flag "No pre-commit hooks"

**Files to Create:**

- `.husky/pre-commit` — Hook script
- `.lintstagedrc.json` (or equivalent config in `package.json`) — lint-staged configuration

**Files to Modify:**

- `package.json` — Add husky and lint-staged as dev dependencies; add `prepare` script

**Prerequisites:** None

**Implementation Steps:**

1. Install Husky and lint-staged:

   ```bash
   npm install --save-dev husky lint-staged
   ```

2. Initialize Husky:

   ```bash
   npx husky init
   ```

   This creates `.husky/` directory and adds a `prepare` script to `package.json`.

3. Configure the pre-commit hook. Edit `.husky/pre-commit` to contain:

   ```bash
   npx lint-staged
   ```

4. Add lint-staged configuration to `package.json` (or create `.lintstagedrc.json`):

   ```json
   "lint-staged": {
     "*.{ts,tsx}": [
       "eslint --fix",
       "prettier --write"
     ],
     "*.{js,jsx}": [
       "eslint --fix",
       "prettier --write"
     ],
     "*.{json,md}": [
       "prettier --write"
     ]
   }
   ```

5. Test the hook by making a small change and committing:
   ```bash
   git add -A && git commit -m "test: verify pre-commit hook"
   ```
   (Then amend or reset if this was just a test.)

**Verification Checklist:**

- [x] `.husky/pre-commit` exists and runs `lint-staged`
- [x] `lint-staged` configuration exists (in `package.json` or `.lintstagedrc.json`)
- [x] `husky` and `lint-staged` are in `devDependencies`
- [x] `prepare` script exists in `package.json`: `"prepare": "husky"`
- [x] A test commit triggers the hook successfully
- [x] `npm run check` passes

**Testing Instructions:**

- Make a deliberate lint error in a `.ts` file, stage it, and try to commit. The hook should catch and fix it (or block the commit).
- Run: `npm run check`

**Commit Message Template:**

```text
ci: add husky and lint-staged pre-commit hooks
```

---

### Task 2: Remove --passWithNoTests from Jest Config

**Goal:** Remove the `--passWithNoTests` flag so Jest fails explicitly when test files are missing or excluded, preventing silent test gaps.

**Findings addressed:** Eval Red Flag "`--passWithNoTests` in `package.json:11`"

**Files to Modify:**

- `package.json` — Remove `--passWithNoTests` from the test script

**Prerequisites:** Phase 1 complete (unused files removed, so no orphaned test references)

**Implementation Steps:**

1. In `package.json`, change:

   ```json
   "test": "jest --passWithNoTests"
   ```

   To:

   ```json
   "test": "jest"
   ```

2. Run `npm test` to verify all tests still pass without the flag.

3. If any test run fails because a test pattern matches no files, investigate:
   - Is there a test file that was renamed or deleted?
   - Is there a Jest `testMatch` or `testPathPattern` configuration that no longer matches files?
     Fix the root cause rather than restoring the flag.

**Verification Checklist:**

- [x] `--passWithNoTests` is not in `package.json`
- [x] `npm test` passes
- [x] `npm run check` passes

**Testing Instructions:**

- Run: `npm test`
- Run: `npm run check`

**Commit Message Template:**

```text
ci: remove --passWithNoTests flag from jest config
```

---

### Task 3: Add Devcontainer Configuration

**Goal:** Add a VS Code devcontainer configuration for reproducible development environments.

**Findings addressed:** Eval Reproducibility (7/10)

**Files to Create:**

- `.devcontainer/devcontainer.json`

**Prerequisites:** None

**Implementation Steps:**

1. Create `.devcontainer/devcontainer.json`:

   ```json
   {
     "name": "react-vocabulary",
     "image": "mcr.microsoft.com/devcontainers/javascript-node:24",
     "postCreateCommand": "npm ci",
     "customizations": {
       "vscode": {
         "extensions": [
           "dbaeumer.vscode-eslint",
           "esbenp.prettier-vscode",
           "bradlc.vscode-tailwindcss"
         ],
         "settings": {
           "editor.formatOnSave": true,
           "editor.defaultFormatter": "esbenp.prettier-vscode",
           "editor.codeActionsOnSave": {
             "source.fixAll.eslint": "explicit"
           }
         }
       }
     },
     "forwardPorts": [8081]
   }
   ```

2. Remove the Tailwind CSS extension from the list above (this project doesn't use Tailwind). Use only relevant extensions. The correct list:

   ```json
   "extensions": [
     "dbaeumer.vscode-eslint",
     "esbenp.prettier-vscode"
   ]
   ```

3. Port 8081 is the default Expo dev server port. Adjust if different.

**Verification Checklist:**

- [x] `.devcontainer/devcontainer.json` exists
- [x] Node version in the image matches what CI uses (Node 24)
- [x] `postCreateCommand` runs `npm ci`
- [x] No irrelevant VS Code extensions are listed

**Testing Instructions:**

- Validate the JSON is well-formed: `node -e "require('./.devcontainer/devcontainer.json')"`
- If VS Code is available, open the project in a devcontainer to verify

**Commit Message Template:**

```text
ci: add devcontainer configuration for reproducible dev environment
```

---

### Task 4: Add ESLint Rule to Prevent console.log in Production

**Goal:** Add an ESLint rule that warns on `console.log` to prevent debug statements from being reintroduced.

**Findings addressed:** Prevents regression of Health #10 (console.log removal from Phase 1)

**Files to Modify:**

- ESLint config file (`.eslintrc.js`, `.eslintrc.json`, or `eslint.config.js` — check which format the project uses)

**Prerequisites:** Phase 1 Task 1 complete (console.log already removed)

**Implementation Steps:**

1. Find the ESLint config file:

   ```bash
   ls -la .eslintrc* eslint.config.*
   ```

2. Add the `no-console` rule configured to warn on `console.log` but allow `console.warn` and `console.error`:

   ```json
   "rules": {
     "no-console": ["warn", { "allow": ["warn", "error"] }]
   }
   ```

3. Run `npm run lint` to verify no existing violations. If there are violations in production code, they indicate debug statements that should have been caught in Phase 1. Fix them.

4. If there are `console.log` calls in test files or setup files that are legitimate, add an eslint-disable comment for those specific lines.

**Verification Checklist:**

- [ ] `no-console` rule is configured in ESLint config
- [ ] `npm run lint` passes with no new warnings from the rule
- [ ] `console.warn` and `console.error` are still allowed
- [ ] `npm run check` passes

**Testing Instructions:**

- Run: `npm run lint`
- Temporarily add a `console.log` to a `.ts` file and verify lint catches it, then remove it

**Commit Message Template:**

```text
ci: add no-console eslint rule to prevent debug log regression
```

---

## Phase Verification

After completing all tasks in this phase:

1. Run `npm run check` — must pass
2. Verify `.husky/pre-commit` exists and runs lint-staged
3. Verify `--passWithNoTests` is not in `package.json`
4. Verify `.devcontainer/devcontainer.json` exists
5. Verify ESLint has `no-console` rule configured
6. Make a test commit to verify the pre-commit hook fires
