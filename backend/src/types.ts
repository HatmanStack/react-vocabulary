// NOTE: These types mirror src/shared/types/progress.ts in the frontend.
// If you change types here, update the frontend types to match.

// Progress action types
export type ProgressAction = 'get' | 'save' | 'check-username';

// Request types
export interface ProgressRequest {
  action: ProgressAction;
  username: string;
  progressData?: UserProgress;
}

// Response types
export interface CheckUsernameResponse {
  exists: boolean;
}

export interface GetProgressResponse {
  progressData: UserProgress;
  lastSyncedAt: string;
}

export interface SaveProgressResponse {
  success: true;
  lastSyncedAt: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
}

export type ProgressResponse =
  | CheckUsernameResponse
  | GetProgressResponse
  | SaveProgressResponse
  | ErrorResponse;

// Error codes
export const ErrorCodes = {
  INVALID_ACTION: 'INVALID_ACTION',
  INVALID_USERNAME: 'INVALID_USERNAME',
  MISSING_PROGRESS_DATA: 'MISSING_PROGRESS_DATA',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_PROGRESS_DATA: 'INVALID_PROGRESS_DATA',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Word state: 0=new, 1=learning, 2=reviewing, 3=mastered
export type WordState = 0 | 1 | 2 | 3;

export interface WordProgress {
  state: WordState;
  hintsUsed: number;
  wrongAttempts: number;
  correctAttempts: number;
  lastAttemptDate: string;
  firstAttemptDate: string;
  masteredDate?: string;
}

export interface BestScore {
  hints: number;
  wrong: number;
  completedAt: string;
}

export interface ListLevelProgress {
  listId: string;
  levelId: string;
  wordProgress: Record<string, WordProgress>;
  bestScore?: BestScore;
}

export interface GlobalStats {
  allTimeHints: number;
  allTimeWrong: number;
  allTimeCorrect: number;
  totalWordsLearned: number;
  listsCompleted: string[];
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
  globalStats: GlobalStats;
  achievements?: Achievement[];
  dailyProgress?: Record<string, number>;
}

// DynamoDB item structure
export interface UserProgressItem {
  username: string;
  progressData: UserProgress;
  lastSyncedAt: string;
  createdAt: string;
}
