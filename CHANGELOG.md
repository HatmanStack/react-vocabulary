# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-05

### Added

- Interactive vocabulary quiz app with Expo Router and React Native
- 18 themed word lists with 350 words across 5 difficulty levels
- Quiz sessions: 4 words per session, multiple-choice and fill-in-the-blank questions
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

[1.0.0]: https://github.com/HatmanStack/react-vocabulary/releases/tag/v1.0.0
