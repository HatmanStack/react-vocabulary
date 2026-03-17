import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Portal, Dialog, Button as PaperButton, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getListById } from '@/features/vocabulary/utils/vocabularyLoader';
import { useQuizStore } from '@/shared/store/quizStore';
import { useSound } from '@/shared/hooks/useSound';
import { useHaptics } from '@/shared/hooks/useHaptics';
import { QuizHeader } from '../components/QuizHeader';
import { QuestionDisplay } from '../components/QuestionDisplay';
import { AnswerFeedback } from '../components/AnswerFeedback';
import { MultipleChoiceQuestion } from '../components/MultipleChoiceQuestion';
import { FillInBlankQuestion } from '../components/FillInBlankQuestion';
import { Typography, Spacer } from '@/shared/ui';

export default function QuizScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { listId, levelId } = useLocalSearchParams<{ listId: string; levelId: string }>();
  const list = getListById(listId);

  // Quiz store
  const {
    currentQuestion,
    currentQuestionIndex,
    sessionStats,
    isQuizActive,
    startQuiz,
    submitAnswer,
    useHint: getHint,
    getCorrectAnswer,
    getCurrentQuestionPresentationCount,
    getNextQuestion,
    isQuizComplete,
    endQuiz,
  } = useQuizStore();

  // Sound effects
  const { playCorrect, playWrong } = useSound();

  // Haptic feedback
  const { triggerMedium, triggerHeavy } = useHaptics();

  // Local state
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintDialogVisible, setHintDialogVisible] = useState(false);
  const [hintText, setHintText] = useState('');
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shared quiz completion handler — single source of truth
  const navigateToGraduation = useCallback(() => {
    const durationMinutes = quizStartTime
      ? (Date.now() - quizStartTime) / (1000 * 60)
      : undefined;
    const finalStats = endQuiz();
    router.replace({
      pathname: '/graduation',
      params: {
        listId,
        levelId,
        hints: finalStats.hints.toString(),
        wrong: finalStats.wrong.toString(),
        bestHints: '0',
        bestWrong: '0',
        durationMinutes: durationMinutes?.toString() || '0',
      },
    });
  }, [quizStartTime, endQuiz, router, listId, levelId]);

  // Start quiz on mount
  useEffect(() => {
    startQuiz(listId, levelId);
    setQuizStartTime(Date.now());
    // startQuiz is a stable Zustand store action — safe to include in deps
  }, [listId, levelId, startQuiz]);

  // Check for quiz completion
  useEffect(() => {
    if (isQuizActive && isQuizComplete()) {
      navigateToGraduation();
    }
    // Effect intentionally runs only on question index and start time changes.
    // Store functions (isQuizComplete) and navigateToGraduation are stable references.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, quizStartTime]);

  // Clean up feedback timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  if (!list || !currentQuestion) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Typography variant="body">Loading quiz...</Typography>
      </View>
    );
  }

  const handleExit = () => {
    setShowExitDialog(true);
  };

  const handleConfirmExit = () => {
    endQuiz();
    setShowExitDialog(false);
    router.back();
  };

  const handleCancelExit = () => {
    setShowExitDialog(false);
  };

  const handleAnswer = (answer: string) => {
    const result = submitAnswer(answer);
    setIsCorrect(result.isCorrect);
    setShowFeedback(true);

    // Play sound and haptic feedback based on answer correctness
    if (result.isCorrect) {
      playCorrect();
      triggerMedium();
    } else {
      playWrong();
      triggerHeavy();
    }
  };

  const handleUseHint = () => {
    const definition = getHint();
    setHintText(definition);
    setHintDialogVisible(true);
  };

  const handleFeedbackEnd = () => {
    setShowFeedback(false);
    // Move to next question after feedback
    feedbackTimerRef.current = setTimeout(() => {
      feedbackTimerRef.current = null;
      getNextQuestion();

      // Check if quiz is complete after getting next question
      if (isQuizComplete()) {
        navigateToGraduation();
      }
    }, 300);
  };

  const totalWords = list.levels.find((l) => l.id === levelId)?.words.length || 0;
  const totalQuestions = totalWords * 2; // 2 questions per word (multiple + fillin)

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <QuizHeader
        listName={list.name}
        levelName={levelId.charAt(0).toUpperCase() + levelId.slice(1)}
        currentIndex={currentQuestionIndex}
        totalWords={totalQuestions}
        hintsUsed={sessionStats.hintsUsed}
        wrongAnswers={sessionStats.wrongAnswers}
        onExit={handleExit}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Spacer size="md" />

        <QuestionDisplay
          questionText={
            currentQuestion.type === 'multiple'
              ? currentQuestion.word.definition
              : currentQuestion.word.fillInBlank
          }
          type={currentQuestion.type}
        />

        <Spacer size="lg" />

        {/* Render appropriate question type */}
        {currentQuestion.type === 'multiple' ? (
          <MultipleChoiceQuestion
            options={currentQuestion.options || []}
            onSelectAnswer={handleAnswer}
            presentationCount={showFeedback ? 0 : getCurrentQuestionPresentationCount()}
            correctAnswer={getCorrectAnswer()}
          />
        ) : (
          <FillInBlankQuestion
            sentence={currentQuestion.word.fillInBlank}
            onSubmitAnswer={handleAnswer}
            onUseHint={handleUseHint}
            presentationCount={showFeedback ? 0 : getCurrentQuestionPresentationCount()}
            correctAnswer={getCorrectAnswer()}
          />
        )}

        <Spacer size="xl" />
      </ScrollView>

      <AnswerFeedback
        isCorrect={isCorrect}
        isVisible={showFeedback}
        onAnimationEnd={handleFeedbackEnd}
      />

      {/* Exit confirmation dialog */}
      <Portal>
        <Dialog visible={showExitDialog} onDismiss={handleCancelExit} style={styles.dialog}>
          <Dialog.Title>Exit Quiz?</Dialog.Title>
          <Dialog.Content>
            <Typography variant="body">
              Your progress will be lost if you exit now. Are you sure?
            </Typography>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={handleCancelExit}>Cancel</PaperButton>
            <PaperButton onPress={handleConfirmExit}>Exit</PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Hint dialog */}
      <Portal>
        <Dialog visible={hintDialogVisible} onDismiss={() => setHintDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title>Hint</Dialog.Title>
          <Dialog.Content>
            <Typography variant="body">{hintText}</Typography>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setHintDialogVisible(false)}>Got it</PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const MAX_CONTENT_WIDTH = 800;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  dialog: {
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
});
