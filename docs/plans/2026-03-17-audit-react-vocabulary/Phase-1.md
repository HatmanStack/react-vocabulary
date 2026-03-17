# Phase 1 — [HYGIENIST] Subtractive Cleanup

## Phase Goal

Remove dead code, unused dependencies, unused files, unused exports, and debug statements from the codebase. This reduces noise for subsequent phases and ensures we don't spend effort fixing code that should be deleted.

**Success criteria:** All knip-reported unused files, exports, and dependencies are removed. Debug `console.log` statements are removed. `npm run check` passes. No functional behavior changes.

**Estimated tokens:** ~15,000

## Prerequisites

- Phase 0 read and understood
- Repository checked out at current state
- `npm ci` run successfully

## Tasks

---

### Task 1: Remove Debug Console Statements

**Goal:** Remove the two debug `console.log` statements from HomeScreen that fire on every render in production.

**Findings addressed:** Health #10 (MED), Eval Code Quality

**Files to Modify:**
- `src/features/vocabulary/screens/HomeScreen.tsx` — Remove lines 23 and 27

**Prerequisites:** None

**Implementation Steps:**
1. Open `src/features/vocabulary/screens/HomeScreen.tsx`
2. Delete line 23: `console.log('[HomeScreen] Component rendering');`
3. Delete line 27: `console.log('[HomeScreen] Loaded', vocabularyLists.length, 'vocabulary lists');`

**Verification Checklist:**
- [x] No `console.log` statements remain in `HomeScreen.tsx`
- [x] `npm run check` passes

**Testing Instructions:**
- No new tests needed. Existing tests should still pass.
- Run: `npm test`

**Commit Message Template:**
```text
chore(ui): remove debug console.log statements from HomeScreen
```

---

### Task 2: Remove Unused Files

**Goal:** Delete files flagged as unused by knip to reduce cognitive load and maintenance burden.

**Findings addressed:** Health #20 (LOW), Health #21 (LOW — partial: unused storage wrapper)

**Files to Delete:**
- `scripts/parseXmlToJson.ts` — Data migration script, no longer needed
- `scripts/validateVocabulary.ts` — Validation script, no longer needed
- `src/shared/lib/constants.ts` — Empty placeholder file (just `export {}`)
- `src/shared/lib/storage.ts` — Unused AsyncStorage wrapper (per ADR-5 in Phase 0)
- `src/shared/lib/testUtils.tsx` — Unused test utility file

**Files to Modify:**
- `package.json` — Remove the `migrate-data`, `validate-data`, and `migrate-and-validate` scripts that reference the deleted script files

**Prerequisites:** None

**Implementation Steps:**
1. Delete each file listed above using `rm` or your IDE
2. In `package.json`, remove these three scripts:
   - `"migrate-data": "ts-node scripts/parseXmlToJson.ts"`
   - `"validate-data": "ts-node scripts/validateVocabulary.ts"`
   - `"migrate-and-validate": "npm run migrate-data && npm run validate-data"`
3. Run `npm run check` to verify nothing imported the deleted files

**Important:** Do NOT delete `scripts/deploy.js` — it is referenced by the `deploy` script in `package.json` and may be used for deployments even if knip doesn't detect runtime usage.

**Verification Checklist:**
- [x] All 5 files listed above are deleted
- [x] The 3 package.json scripts are removed
- [x] `npm run check` passes (no broken imports)
- [x] `scripts/deploy.js` still exists

**Testing Instructions:**
- Run: `npm run check`
- If any test file imported `testUtils.tsx`, that test will fail — fix by removing the import or inlining what it provided

**Commit Message Template:**
```text
chore: remove unused files and dead scripts
```

---

### Task 3: Remove Unused Dependencies

**Goal:** Remove unused npm dependencies to reduce bundle size and install time.

**Findings addressed:** Health #18 (LOW)

**Files to Modify:**
- `package.json` — Remove unused dependencies

**Prerequisites:** Task 2 complete (removing `parseXmlToJson.ts` may make `@types/xml2js` removable)

**Implementation Steps:**

1. Remove these **production** dependencies one at a time, running `npm run check` after each removal to verify nothing breaks:
   - `@react-navigation/stack` — App uses expo-router, not React Navigation stack navigator
   - `expo-constants` — Not imported anywhere in src/
   - `expo-linking` — Not imported anywhere in src/
   - `expo-status-bar` — Not imported anywhere in src/

2. Remove these **dev** dependencies:
   - `@types/xml2js` — Only needed by the deleted `parseXmlToJson.ts`
   - `@types/react-test-renderer` — If `react-test-renderer` is not used in any test file

3. **Do NOT remove** these dependencies even though knip flags them — they are implicit peer dependencies or required by Expo:
   - `react-dom` — Required by Expo web platform
   - `react-native-gesture-handler` — Required by expo-router
   - `react-native-reanimated` — Required by expo-router
   - `react-native-screens` — Required by expo-router
   - `react-native-svg` — Required by react-native-chart-kit
   - `react-native-web` — Required by Expo web platform

4. After all removals, run `npm install` to update `package-lock.json`

**Verification Checklist:**
- [x] Removed dependencies are gone from `package.json`
- [x] `npm install` completes without errors
- [x] `npm run check` passes
- [x] `react-dom`, `react-native-web`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-screens`, `react-native-svg` are still present

**Testing Instructions:**
- Run: `npm run check`

**Commit Message Template:**
```text
chore(deps): remove unused dependencies
```

---

### Task 4: Run npm audit fix

**Goal:** Fix known npm vulnerabilities where possible without breaking changes.

**Findings addressed:** Health #19 (LOW)

**Files to Modify:**
- `package-lock.json` — Updated by npm audit fix

**Prerequisites:** Task 3 complete

**Implementation Steps:**
1. Run `npm audit` to see current state
2. Run `npm audit fix` (without `--force`) to apply safe fixes
3. Run `npm run check` to verify nothing broke
4. If vulnerabilities remain, note them but do NOT run `npm audit fix --force` as it may introduce breaking changes

**Verification Checklist:**
- [x] `npm audit fix` ran successfully
- [x] `npm run check` passes
- [x] Remaining vulnerabilities (if any) are documented in the commit message body

**Testing Instructions:**
- Run: `npm run check`

**Commit Message Template:**
```text
chore(deps): fix npm audit vulnerabilities
```

---

### Task 5: Remove Unused Barrel Exports

**Goal:** Remove barrel files (`index.ts`) that export nothing consumed, and remove unused individual exports.

**Findings addressed:** Health #21 (LOW — unused exports)

**Files to Evaluate for Deletion (barrel files):**
- Check each feature's `index.ts` barrel file. If it exports symbols that are not imported by any other file, delete the barrel file.
- Likely candidates: feature-level `index.ts` files in `src/features/*/`

**Files to Modify (unused exports):**
- `src/shared/services/syncService.ts` — Remove the `export` keyword from `isOnline` at line ~44 if it is only used internally within the same file (change `export function isOnline` to `function isOnline`)
- `src/shared/lib/theme.ts` — If `lightTheme` is a duplicate export of the `default` export, remove the named `lightTheme` export

**Prerequisites:** Tasks 1-2 complete

**Implementation Steps:**
1. For each feature directory, check if an `index.ts` barrel file exists and whether its exports are imported elsewhere. If not imported, delete the file.
2. In `syncService.ts`, find the `isOnline` function. If it is only called within the same file, remove the `export` keyword.
3. In `theme.ts`, check if both `lightTheme` and a default export point to the same object. If so, remove the `lightTheme` named export and update any imports that use it.
4. Run `npm run check` after each change.

**Verification Checklist:**
- [ ] Unused barrel files are deleted
- [ ] `isOnline` is no longer exported (if only used internally)
- [ ] Duplicate `lightTheme` export is resolved
- [ ] `npm run check` passes

**Testing Instructions:**
- Run: `npm run check`

**Commit Message Template:**
```text
chore: remove unused exports and empty barrel files
```

---

### Task 6: Remove Dead Path Alias

**Goal:** Remove the dead `@/app/*` path alias from tsconfig.json that maps to a nonexistent directory.

**Findings addressed:** Doc Audit — Stale Code Example #3

**Files to Modify:**
- `tsconfig.json` — Remove the `@/app/*` path alias entry

**Prerequisites:** None

**Implementation Steps:**
1. Open `tsconfig.json`
2. Remove this line from the `paths` object: `"@/app/*": ["./src/app/*"],`
3. Run `npm run type-check` to confirm no code uses this alias

**Verification Checklist:**
- [ ] `@/app/*` alias is removed from `tsconfig.json`
- [ ] `npm run type-check` passes

**Testing Instructions:**
- Run: `npm run type-check`

**Commit Message Template:**
```text
chore: remove dead @/app/* path alias from tsconfig
```

---

## Phase Verification

After completing all tasks in this phase:

1. Run `npm run check` — must pass (type-check + lint + test)
2. Verify the following files no longer exist:
   - `scripts/parseXmlToJson.ts`
   - `scripts/validateVocabulary.ts`
   - `src/shared/lib/constants.ts`
   - `src/shared/lib/storage.ts`
   - `src/shared/lib/testUtils.tsx`
3. Verify no `console.log` statements in `HomeScreen.tsx`
4. Verify `package.json` has fewer dependencies than before
5. Verify `tsconfig.json` no longer has `@/app/*` alias
