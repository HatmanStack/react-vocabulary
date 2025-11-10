import { VocabularyWord } from './vocabulary';

// Quiz Types

export type QuestionType = 'multiple' | 'fillin';
export type WordState = 0 | 1 | 2 | 3;

export interface QuizQuestion {
  word: VocabularyWord;
  type: QuestionType;
  options?: string[]; // For multiple choice (4 options)
}

export interface QuizSession {
  listId: string;
  levelId: string;
  words: VocabularyWord[];
  currentQuestionIndex: number;
  sessionStats: {
    hintsUsed: number;
    wrongAnswers: number;
    correctAnswers: number;
  };
  startedAt: string;
}
