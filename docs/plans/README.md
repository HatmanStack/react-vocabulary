# Cloud Progress Sync - Implementation Plan

## Feature Overview

This feature adds cloud-based progress synchronization to the React Vocabulary app, allowing users to persist their learning progress across devices. The implementation uses a simple username-based identity system (no passwords) with AWS SAM for the backend infrastructure.

The backend consists of a single DynamoDB table storing full progress blobs per user, accessed through an API Gateway HTTP API with a single Lambda endpoint. The frontend adds a login flow during onboarding, a username switcher in Settings, and automatic sync on key events (quiz completion, app foreground, periodic).

The architecture follows a local-first approach: AsyncStorage remains the source of truth during active use, with cloud acting as a backup. On login, cloud data merges with local data using a "higher wins" strategy per field, ensuring users never lose progress.

## Prerequisites

### Development Environment
- Node.js v20+ (matches Lambda runtime)
- AWS CLI configured with valid credentials
- SAM CLI installed (`sam --version`)
- Expo CLI (`npx expo`)

### AWS Resources (created by deployment)
- DynamoDB table (PAY_PER_REQUEST billing)
- Lambda function (Node.js 20.x)
- API Gateway HTTP API

### Required Knowledge
- TypeScript/React Native with Expo
- Zustand state management
- AWS SAM templates
- Jest testing

## Phase Summary

| Phase | Goal | Token Estimate |
|-------|------|----------------|
| 0 | Foundation: Architecture decisions, deployment scripts, testing strategy | ~15,000 |
| 1 | Backend: SAM template, Lambda handler, DynamoDB operations, deploy script | ~45,000 |
| 2 | Frontend: Sync service, login UI, Settings integration, auto-sync hooks | ~40,000 |

**Total Estimated Tokens: ~100,000** (fits in single context window if needed)

## Navigation

- [Phase 0: Foundation](./Phase-0.md) - Architecture decisions, patterns, deployment strategy
- [Phase 1: Backend Implementation](./Phase-1.md) - SAM infrastructure and Lambda API
- [Phase 2: Frontend Implementation](./Phase-2.md) - Sync service, login UI, auto-sync

## Quick Start

After all phases are complete:

```bash
# Deploy backend
cd backend
npm install
npm run deploy

# Start frontend dev server
cd ..
npx expo start
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Expo)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ progressStore│←→│  syncService │←→│ API Gateway (CORS)  │  │
│  │ (Zustand)    │  │              │  │                     │  │
│  └──────┬───────┘  └─────────────┘  └──────────┬──────────┘  │
│         │                                       │            │
│         ▼                                       │            │
│  ┌─────────────┐                               │            │
│  │ AsyncStorage │                               │            │
│  │ (local-first)│                               │            │
│  └─────────────┘                               │            │
└─────────────────────────────────────────────────┼────────────┘
                                                  │
                         ┌────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (AWS SAM)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐        ┌──────────────────────────┐    │
│  │  Lambda Handler  │───────→│  DynamoDB (UserProgress) │    │
│  │  POST /progress  │        │  PK: username            │    │
│  │                  │        │  Attr: progressData      │    │
│  │  Actions:        │        │  Attr: lastSyncedAt      │    │
│  │  - get           │        └──────────────────────────┘    │
│  │  - save          │                                        │
│  │  - check-username│                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

1. **Single endpoint** - All operations via `POST /progress` with action in body
2. **Full state blob** - Entire progressStore synced as one document (simple, atomic)
3. **Local-first** - AsyncStorage is source of truth; cloud is backup
4. **Higher wins merge** - On conflict, take higher value per field
5. **Claim-based usernames** - First user to enter username claims it
6. **No auth** - CORS + API Gateway throttling only (no Cognito/passwords)
