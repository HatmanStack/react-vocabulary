# Feedback: 2026-03-17-audit-react-vocabulary

## Active Feedback

### [CODE_REVIEW] FB-003: progressStore.ts exceeds 500-line target after sync extraction

- **Phase:** Phase-2
- **Task:** Task 9
- **Severity:** MINOR
- **Details:** The Phase-2 verification checklist (line 854) states "Verify `progressStore.ts` is under 500 lines." After extracting sync orchestration to `syncOrchestrator.ts`, the file is 666 lines -- still above the 500-line target. The extraction was done correctly and moved meaningful logic out, but the store has many methods (word progress, sessions, best scores, global stats, achievements, list completion) that keep it large.
- **Suggested Fix:** This is a non-blocking observation. The extraction achieved its architectural goal of separating concerns. A future phase could further decompose the store (e.g., extract achievement logic), but this is not required for Phase 2 approval.

### [CODE_REVIEW] FB-004: Residual console.log in quizStore.ts

- **Phase:** Phase-2
- **Task:** General
- **Severity:** MINOR
- **Details:** `src/shared/store/quizStore.ts` line 134 contains `console.log('Quiz complete! All questions answered correctly.')`. This debug logging should have been removed in Phase 1 (Health #10) but was missed. It is not a Phase 2 regression since the line was already present before Phase 2.
- **Suggested Fix:** Remove the console.log statement. This is non-blocking for Phase 2 approval since it predates Phase 2 changes.

### [PLAN_REVIEW] FB-002: Cross-reference table in Phase-0 has incorrect task numbers

- **Phase:** Phase-0
- **Task:** Cross-Reference Table (lines 103, 106, 118, 121)
- **Severity:** MINOR
- **Details:** Four rows in the Phase-0 cross-reference table point to wrong task numbers:
  1. Line 103: `Health #12 (MED)` maps to Task 2, but Phase-2 Task 1 lists Health #12 in its findings
  2. Line 106: `Health #15 (MED)` maps to Task 11, but Phase-2 Task 2 lists Health #15 in its findings (Task 11 is Performance)
  3. Line 118: `Eval Performance` maps to Task 12, but it is Phase-2 Task 11
  4. Line 121: `Eval Test Value` maps to Task 13, but it is Phase-2 Task 12 (there is no Task 13)
- **Suggested Fix:** Update the four rows: #12 -> Task 1, #15 -> Task 2, Performance -> Task 11, Test Value -> Task 12

## Resolved Feedback

<!-- Resolved items are moved here with a resolution note. Format:
### [SOURCE] FB-NNN: Title
- **Phase:** Phase-N
- **Task:** Task N
- **Resolution:** What was done to address this
- **Resolved By:** Role that resolved it
- **Date:** YYYY-MM-DD
-->

### [CODE_REVIEW] FB-005: DEPLOYMENT.md "Subsequent Deployments" has incorrect deploy command

- **Phase:** Phase-4
- **Task:** Task 2
- **Resolution:** Removed `cd backend` from the "Subsequent Deployments" code block in `docs/DEPLOYMENT.md`. The section now shows `npm run deploy` from the project root, consistent with the Quick Start and First-Time Setup sections.
- **Resolved By:** Documentation Engineer
- **Date:** 2026-03-17

### [CODE_REVIEW] FB-006: CHANGELOG.md still says "4 words per session"

- **Phase:** Phase-4
- **Task:** Task 2
- **Resolution:** Updated `CHANGELOG.md` line 14 from "Quiz sessions: 4 words per session, multiple-choice and fill-in-the-blank questions" to "Quiz sessions with multiple-choice and fill-in-the-blank questions", removing the inaccurate fixed word count claim.
- **Resolved By:** Documentation Engineer
- **Date:** 2026-03-17

### [PLAN_REVIEW] FB-001: Wrong file path for AchievementUnlockModal in Phase 2 Task 3

- **Phase:** Phase-2
- **Task:** Task 3
- **Resolution:** Changed `src/features/quiz/components/AchievementUnlockModal.tsx — line 58` to `src/features/progress/components/AchievementUnlockModal.tsx — line 58` in the "Files to Modify" list of Phase-2 Task 3 (line 166 of Phase-2.md). Verified the correct path exists in the codebase.
- **Resolved By:** Planning Architect
- **Date:** 2026-03-17
