# Vocabulary Learning App

[← Back to Project](../README.md)

---

Comprehensive cross-platform vocabulary learning application. Master 360+ curated words through interactive quizzes, track progress with detailed statistics, and earn achievements.

## Features

- **360+ Words**: 18 themed lists across 5 difficulty levels (Basic → Professional)
- **Dual Quiz Formats**: Multiple-choice and fill-in-the-blank questions
- **Contextual Learning**: Definitions and memorable example sentences for each word
- **Progress Tracking**: Statistics on correct/wrong answers, hints, and learning streaks
- **Achievement System**: Unlock badges for milestones, performance, and consistency
- **Cloud Sync**: Optional account-based progress synchronization
- **Cross-Platform**: Single codebase for iOS, Android, and Web

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React Native + Expo |
| Language | TypeScript |
| Navigation | Expo Router |
| UI Library | React Native Paper |
| State | Zustand |
| Storage | AsyncStorage (local) + DynamoDB (cloud) |
| Backend | AWS SAM Lambda |
| Testing | Jest + React Native Testing Library |

## Installation

```bash
# Clone and install
git clone https://github.com/HatmanStack/react-vocabulary.git
cd react-vocabulary
npm install

# Start development server
npm start
```

## Usage

### Quiz Flow

1. **Select a List** – Choose from 18 themed vocabulary lists (Aurora, Cascade, Catalyst, etc.)
2. **Pick Difficulty** – Basic, Intermediate, Advanced, Expert, or Professional
3. **Take the Quiz** – 8 questions per session (4 multiple-choice + 4 fill-in-blank)
4. **Review Results** – See your score and track word mastery

### Cloud Sync (Optional)

1. Open **Settings** → tap **Sign In**
2. Enter a username (3-30 chars, alphanumeric + underscore/hyphen)
3. Progress syncs automatically on app resume

### Viewing Progress

- Tap the **Stats** icon to view charts, heatmaps, and achievements
- Track words mastered, accuracy rates, and learning streaks

## Project Structure

```
react-vocabulary/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout (theme, sync)
│   ├── home.tsx           # Vocabulary list browser
│   ├── difficulty.tsx     # Level selection
│   ├── quiz.tsx           # Quiz session
│   ├── graduation.tsx     # Completion screen
│   ├── stats.tsx          # Progress analytics
│   ├── settings.tsx       # App settings
│   └── help.tsx           # FAQ
│
├── src/
│   ├── features/          # Feature modules
│   │   ├── vocabulary/    # List browsing, word loading
│   │   ├── quiz/          # Question generation, validation
│   │   ├── progress/      # Stats, charts, achievements
│   │   ├── settings/      # Preferences, export
│   │   └── help/          # FAQ content
│   │
│   ├── shared/
│   │   ├── store/         # Zustand stores
│   │   ├── types/         # TypeScript definitions
│   │   ├── ui/            # Reusable components
│   │   ├── hooks/         # Custom hooks (sound, haptics)
│   │   └── services/      # Cloud sync client
│   │
│   └── assets/
│       ├── vocabulary/    # 18 JSON word lists
│       └── sounds/        # Audio feedback files
│
├── backend/               # AWS SAM Lambda API
└── assets/                # App icons, splash screen
```

## Architecture

### State Management (Zustand)

| Store | Purpose |
|-------|---------|
| `vocabularyStore` | Word lists, selected list/level |
| `quizStore` | Current quiz session, questions, scoring |
| `progressStore` | Word progress, achievements, cloud sync |
| `settingsStore` | Theme, sound, haptics preferences |

### Word Progress States

Words progress through 4 states as users learn:

| State | Meaning |
|-------|---------|
| 0 | Not started |
| 1 | Seen/attempted |
| 2 | Partially known |
| 3 | Mastered (correct answer) |

### Quiz Question Generation

- 4 words selected per quiz session
- Each word gets 2 questions (1 multiple-choice + 1 fill-in-blank)
- Multiple-choice: 1 correct + 3 random options from same difficulty
- Fill-in-blank: Fuzzy matching using Levenshtein distance

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Type checking
npm run type-check

# Linting
npm run lint

# All checks
npm run check
```

**Test Coverage:**
- Unit tests for question generation, answer validation, achievements
- Component tests for UI elements
- Store tests for state management
- Backend tests for API handlers

## Development Commands

```bash
npm start           # Start Expo dev server
npm run android     # Run on Android emulator
npm run ios         # Run on iOS simulator
npm run web         # Run in browser
npm test            # Run Jest tests
npm run lint        # ESLint check
npm run type-check  # TypeScript check
npm run check       # All checks (lint + type-check + test)
```

## Related Docs

- [Deployment Guide](./DEPLOYMENT.md) – Backend deployment, environment setup, troubleshooting
- [Backend API](./BACKEND-API.md) – API endpoint documentation
- [Sound Assets](./SOUNDS.md) – Audio file requirements and attribution
