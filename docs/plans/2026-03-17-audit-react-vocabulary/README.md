# Unified Audit Remediation Plan: react-vocabulary

## Overview

This plan remediates findings from three concurrent audits of the `react-vocabulary` codebase: a codebase health audit (22 active findings), a 12-pillar evaluation (11 pillars needing work), and a documentation audit (6 drift findings, 3 gaps). The audits revealed a codebase in FAIR health with solid architecture but significant gaps in type rigor, defensive coding, and documentation accuracy.

The remediation is organized into four sequential role-based phases: cleanup first (remove dead code, unused deps), then structural fixes (architecture, error handling, performance, type safety), then guardrails (pre-commit hooks, CI hardening), and finally documentation corrections. This ordering ensures we remove noise before fixing structure, and fix structure before documenting it.

Two findings are explicitly **ACCEPTED** and excluded from remediation: Finding #1 (no auth on sync API) and Finding #9 (username claim flow) are intentional architectural decisions. Git Hygiene (pillar 11, score 5/10) is also accepted per pillar override and receives no remediation.

## Prerequisites

- Node.js (version compatible with Expo SDK 54)
- npm (with `package-lock.json` committed)
- Access to the repository at its current state
- Familiarity with: React Native, Expo, Zustand, TypeScript, Jest

## Phase Summary

| Phase | Tag | Goal | Token Estimate |
|-------|-----|------|----------------|
| 0 | — | Foundation: architecture decisions, conventions, testing strategy | ~2,000 |
| 1 | [HYGIENIST] | Subtractive cleanup: dead code, unused deps, unused files, console.log removal | ~15,000 |
| 2 | [IMPLEMENTER] | Code fixes: type rigor, defensive coding, architecture, performance, quiz logic | ~40,000 |
| 3 | [FORTIFIER] | Guardrails: pre-commit hooks, CI hardening, lint rule tightening | ~12,000 |
| 4 | [DOC-ENGINEER] | Documentation fixes: drift correction, gap filling, prevention tooling | ~15,000 |

## Navigation

- [Phase 0 — Foundation](./Phase-0.md)
- [Phase 1 — Hygienist: Cleanup](./Phase-1.md)
- [Phase 2 — Implementer: Code Fixes](./Phase-2.md)
- [Phase 3 — Fortifier: Guardrails](./Phase-3.md)
- [Phase 4 — Doc-Engineer: Documentation](./Phase-4.md)
- [Feedback](./feedback.md)

## Audit Sources

- [Health Audit](./health-audit.md) — 2 critical, 5 high, 8 medium, 7 low findings
- [12-Pillar Evaluation](./eval.md) — 0/12 pillars at target (1 accepted)
- [Documentation Audit](./doc-audit.md) — 6 drift, 3 gaps, 3 stale code examples
