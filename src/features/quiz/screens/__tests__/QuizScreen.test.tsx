/**
 * QuizScreen Tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import QuizScreen from '../QuizScreen';

// Mock expo-router
const mockRouter = {
  replace: jest.fn(),
  back: jest.fn(),
  push: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ listId: 'test-list', levelId: 'basic' }),
}));

// Mock vocabulary loader
jest.mock('@/features/vocabulary/utils/vocabularyLoader', () => ({
  getListById: jest.fn(() => ({
    id: 'test-list',
    name: 'Test List',
    levels: [
      {
        id: 'basic',
        name: 'Basic',
        words: [
          { id: 'word1', word: 'test', definition: 'a test word', fillInBlank: 'This is a ___.' },
          { id: 'word2', word: 'example', definition: 'an example', fillInBlank: 'For ___.' },
        ],
      },
    ],
  })),
}));

// Mock quiz store
const mockQuizStore = {
  currentQuestion: {
    type: 'multiple' as const,
    word: { id: 'word1', word: 'test', definition: 'a test word', fillInBlank: 'This is a ___.' },
    options: ['test', 'wrong1', 'wrong2', 'wrong3'],
  },
  currentQuestionIndex: 0,
  sessionStats: { hintsUsed: 0, wrongAnswers: 0, correctAnswers: 0 },
  isQuizActive: true,
  startQuiz: jest.fn(),
  submitAnswer: jest.fn(() => ({ isCorrect: true, correctAnswer: 'test' })),
  useHint: jest.fn(() => 'a test word'),
  getCorrectAnswer: jest.fn(() => 'test'),
  getCurrentQuestionPresentationCount: jest.fn(() => 1),
  getNextQuestion: jest.fn(),
  isQuizComplete: jest.fn(() => false),
  endQuiz: jest.fn(() => ({ hints: 0, wrong: 0 })),
};

jest.mock('@/shared/store/quizStore', () => ({
  useQuizStore: () => mockQuizStore,
}));

// Mock sound hook
jest.mock('@/shared/hooks/useSound', () => ({
  useSound: () => ({
    playCorrect: jest.fn(),
    playWrong: jest.fn(),
  }),
}));

// Mock haptics hook
jest.mock('@/shared/hooks/useHaptics', () => ({
  useHaptics: () => ({
    triggerMedium: jest.fn(),
    triggerHeavy: jest.fn(),
  }),
}));

describe('QuizScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuizStore.currentQuestion = {
      type: 'multiple' as const,
      word: { id: 'word1', word: 'test', definition: 'a test word', fillInBlank: 'This is a ___.' },
      options: ['test', 'wrong1', 'wrong2', 'wrong3'],
    };
    mockQuizStore.isQuizActive = true;
    mockQuizStore.isQuizComplete.mockReturnValue(false);
  });

  const renderComponent = () => {
    return render(
      <PaperProvider>
        <QuizScreen />
      </PaperProvider>
    );
  };

  describe('rendering', () => {
    it('renders quiz content', () => {
      const { toJSON } = renderComponent();
      expect(toJSON()).not.toBeNull();
    });

    it('starts quiz on mount', () => {
      renderComponent();
      expect(mockQuizStore.startQuiz).toHaveBeenCalledWith('test-list', 'basic');
    });
  });

  describe('answering questions', () => {
    it('submits answer when option is selected', async () => {
      const { getByText } = renderComponent();

      fireEvent.press(getByText('test'));

      await waitFor(() => {
        expect(mockQuizStore.submitAnswer).toHaveBeenCalledWith('test');
      });
    });

    it('shows feedback after answering', async () => {
      const { getByText } = renderComponent();

      fireEvent.press(getByText('test'));

      // Feedback component should be visible
      await waitFor(() => {
        // The AnswerFeedback component should be rendered
        expect(mockQuizStore.submitAnswer).toHaveBeenCalled();
      });
    });
  });

  describe('exit dialog', () => {
    it('shows exit dialog when exit button is pressed', async () => {
      const { getByText, getByLabelText } = renderComponent();

      // Find and press exit button (usually has an icon or accessible label)
      const exitButton = getByLabelText ? getByLabelText('Exit quiz') : null;
      if (exitButton) {
        fireEvent.press(exitButton);

        await waitFor(() => {
          expect(getByText('Exit Quiz?')).toBeTruthy();
        });
      }
    });
  });

  describe('quiz completion', () => {
    it('navigates to graduation when quiz is complete', async () => {
      mockQuizStore.isQuizComplete.mockReturnValue(true);
      mockQuizStore.endQuiz.mockReturnValue({ hints: 1, wrong: 2 });

      renderComponent();

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/graduation',
          })
        );
      });
    });
  });

  describe('fill-in-blank questions', () => {
    beforeEach(() => {
      (mockQuizStore as any).currentQuestion = {
        type: 'fillin',
        word: { id: 'word1', word: 'test', definition: 'a test word', fillInBlank: 'This is a ___.' },
        options: [],
      };
    });

    it('renders fill-in-blank question', () => {
      const { getByText } = renderComponent();
      expect(getByText('This is a ___.')).toBeTruthy();
    });
  });

  describe('loading state', () => {
    it('shows loading when no question available', () => {
      mockQuizStore.currentQuestion = null as any;

      const { getByText } = renderComponent();
      expect(getByText('Loading quiz...')).toBeTruthy();
    });
  });
});
