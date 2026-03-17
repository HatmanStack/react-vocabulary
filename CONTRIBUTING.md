# Contributing

Thank you for your interest in contributing to the Vocabulary Learning App.

## Development Setup

```bash
git clone https://github.com/HatmanStack/react-vocabulary.git
cd react-vocabulary
npm install
npm start
```

Press `w` for web, `a` for Android, or `i` for iOS.

## Branch Naming

Use the format `<type>/<short-description>`:

- `fix/quiz-completion`
- `feat/dark-mode`
- `docs/update-readme`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): brief description
```

**Types:** `chore`, `fix`, `refactor`, `test`, `docs`, `ci`, `perf`, `feat`

**Scopes:** `store`, `quiz`, `backend`, `deps`, `ci`, `docs`, `types`, `ui`

Examples:

```
fix(quiz): prevent duplicate completion events
feat(store): add adaptive difficulty biasing
docs: update project structure tree
```

## Pre-commit Hooks

Husky runs `lint-staged` automatically on each commit. This formats staged files with Prettier and runs ESLint. You do not need to run these manually.

## Running Checks

Before submitting a PR, verify all checks pass:

```bash
npm run check    # type-check + lint + test
```

Individual checks:

```bash
npm run type-check   # TypeScript strict mode
npm run lint         # ESLint
npm test             # Jest tests
```

## Pull Request Process

1. Create a branch from `main` using the naming convention above.
2. Make your changes with atomic, well-described commits.
3. Run `npm run check` and confirm all checks pass.
4. Push your branch and open a PR against `main`.
5. Fill in the PR template.
6. Wait for CI to pass before requesting review.

## Architecture Overview

The app uses **Expo Router** with file-based routing. Screens in `app/` are thin wrappers that render feature screens from `src/features/`.

State management uses **Zustand** (not Redux or Context). This was a deliberate choice for its flat API, minimal boilerplate, and suitability for a small-to-medium application. Each store is a self-contained module in `src/shared/store/`.

For detailed architecture documentation, see:

- [`docs/README.md`](./docs/README.md) — full project documentation
- [`CLAUDE.md`](./CLAUDE.md) — codebase guide for AI-assisted development
