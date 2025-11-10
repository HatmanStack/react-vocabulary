import { WordState } from './quiz';

// Progress Types

export interface WordProgress {
  state: WordState;
  hintsUsed: number;
  wrongAttempts: number;
  correctAttempts: number;
  lastAttemptDate: string;
  firstAttemptDate: string;
  masteredDate?: string;
}

export interface ListLevelProgress {
  listId: string;
  levelId: string;
  wordProgress: Record<string, WordProgress>;
  bestScore?: {
    hints: number;
    wrong: number;
    completedAt: string;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'performance' | 'consistency' | 'completion';
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export interface UserProgress {
  currentListId?: string;
  currentLevelId?: string;
  listLevelProgress: Record<string, ListLevelProgress>;
  globalStats: {
    allTimeHints: number;
    allTimeWrong: number;
    allTimeCorrect: number;
    totalWordsLearned: number;
    listsCompleted: string[];
  };
  achievements?: Achievement[];
  dailyProgress?: Record<string, number>; // date (YYYY-MM-DD) -> words learned that day
}
