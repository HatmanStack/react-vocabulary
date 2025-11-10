/**
 * Adaptive Difficulty Store
 *
 * Tracks user performance separately for multiple choice and fill-in-blank questions.
 * Adjusts question type probability based on accuracy to provide personalized learning.
 *
 * Enhancement over Android app which uses fixed question type selection.
 */

import { create } from 'zustand';
import { QuestionType, WordState } from '@/shared/types';

interface AdaptiveDifficultyState {
  // Performance metrics
  multipleChoiceAccuracy: number; // 0-1 ratio
  fillInBlankAccuracy: number; // 0-1 ratio
  multipleChoiceAttempts: number;
  fillInBlankAttempts: number;
  multipleChoiceCorrect: number;
  fillInBlankCorrect: number;

  // Actions
  updatePerformance: (questionType: QuestionType, isCorrect: boolean) => void;
  getOptimalQuestionType: (wordState: WordState) => QuestionType;
  resetPerformance: () => void;
  getPerformanceMetrics: () => {
    multipleChoiceAccuracy: number;
    fillInBlankAccuracy: number;
    multipleChoiceAttempts: number;
    fillInBlankAttempts: number;
  };
}

// Minimum attempts before applying adaptive logic
const MIN_ATTEMPTS_THRESHOLD = 5;

// Accuracy thresholds for biasing
const HIGH_ACCURACY_THRESHOLD = 0.8; // 80%
const LOW_ACCURACY_THRESHOLD = 0.5; // 50%

export const useAdaptiveDifficultyStore = create<AdaptiveDifficultyState>((set, get) => ({
  // Initial state
  multipleChoiceAccuracy: 0,
  fillInBlankAccuracy: 0,
  multipleChoiceAttempts: 0,
  fillInBlankAttempts: 0,
  multipleChoiceCorrect: 0,
  fillInBlankCorrect: 0,

  // Update performance after each answer
  updatePerformance: (questionType: QuestionType, isCorrect: boolean) => {
    const state = get();

    if (questionType === 'multiple') {
      const newAttempts = state.multipleChoiceAttempts + 1;
      const newCorrect = state.multipleChoiceCorrect + (isCorrect ? 1 : 0);
      const newAccuracy = newCorrect / newAttempts;

      set({
        multipleChoiceAttempts: newAttempts,
        multipleChoiceCorrect: newCorrect,
        multipleChoiceAccuracy: newAccuracy,
      });
    } else if (questionType === 'fillin') {
      const newAttempts = state.fillInBlankAttempts + 1;
      const newCorrect = state.fillInBlankCorrect + (isCorrect ? 1 : 0);
      const newAccuracy = newCorrect / newAttempts;

      set({
        fillInBlankAttempts: newAttempts,
        fillInBlankCorrect: newCorrect,
        fillInBlankAccuracy: newAccuracy,
      });
    }
  },

  // Get optimal question type based on word state and performance
  getOptimalQuestionType: (wordState: WordState): QuestionType => {
    // Word state 1: always fill-in-blank
    if (wordState === 1) {
      return 'fillin';
    }

    // Word state 2: always multiple choice
    if (wordState === 2) {
      return 'multiple';
    }

    // Word state 0 or 3: adaptive logic
    const state = get();
    const {
      multipleChoiceAccuracy,
      fillInBlankAccuracy,
      multipleChoiceAttempts,
      fillInBlankAttempts,
    } = state;

    // Don't apply adaptive logic until we have enough data
    if (
      multipleChoiceAttempts < MIN_ATTEMPTS_THRESHOLD ||
      fillInBlankAttempts < MIN_ATTEMPTS_THRESHOLD
    ) {
      // Random 50/50 split before threshold
      return Math.random() < 0.5 ? 'multiple' : 'fillin';
    }

    // User is excelling at multiple choice (>80% accuracy)
    // Bias toward harder fill-in-blank questions (70% fillin, 30% multiple)
    if (multipleChoiceAccuracy > HIGH_ACCURACY_THRESHOLD) {
      return Math.random() < 0.7 ? 'fillin' : 'multiple';
    }

    // User is struggling with fill-in-blank (<50% accuracy)
    // Bias toward easier multiple choice questions (70% multiple, 30% fillin)
    if (fillInBlankAccuracy < LOW_ACCURACY_THRESHOLD) {
      return Math.random() < 0.7 ? 'multiple' : 'fillin';
    }

    // Balanced performance: 50/50 split
    return Math.random() < 0.5 ? 'multiple' : 'fillin';
  },

  // Reset all performance stats
  resetPerformance: () => {
    set({
      multipleChoiceAccuracy: 0,
      fillInBlankAccuracy: 0,
      multipleChoiceAttempts: 0,
      fillInBlankAttempts: 0,
      multipleChoiceCorrect: 0,
      fillInBlankCorrect: 0,
    });
  },

  // Get performance metrics for stats display
  getPerformanceMetrics: () => {
    const {
      multipleChoiceAccuracy,
      fillInBlankAccuracy,
      multipleChoiceAttempts,
      fillInBlankAttempts,
    } = get();

    return {
      multipleChoiceAccuracy,
      fillInBlankAccuracy,
      multipleChoiceAttempts,
      fillInBlankAttempts,
    };
  },
}));
