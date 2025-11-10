// Navigation Types

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Difficulty: { listId: string };
  Quiz: { listId: string; levelId: string };
  Graduation: {
    listId: string;
    levelId: string;
    stats: {
      hints: number;
      wrong: number;
      bestHints: number;
      bestWrong: number;
      durationMinutes?: number;
    };
  };
  Stats: undefined;
  Settings: undefined;
  Help: undefined;
};
