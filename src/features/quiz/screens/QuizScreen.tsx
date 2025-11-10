import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Portal, Dialog, Button as PaperButton } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/shared/types';
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

type Props = StackScreenProps<RootStackParamList, 'Quiz'>;

export default function QuizScreen({ navigation, route }: Props) {
  const { listId, levelId } = route.params;
  const list = getListById(listId);

  // Quiz store
  const {
    currentQuestion,
    currentQuestionIndex,
    sessionStats,
    isQuizActive,
    startQuiz,
    submitAnswer,
    useHint,
    getNextQuestion,
    calculateProgress,
    isQuizComplete,
    endQuiz,
  } = useQuizStore();

  // Sound effects
  const { playCorrect, playWrong } = useSound();

  // Haptic feedback
  const { triggerLight, triggerMedium, triggerHeavy } = useHaptics();

  // Local state
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);

  // Start quiz on mount
  useEffect(() => {
    startQuiz(listId, levelId);
    setQuizStartTime(Date.now());
  }, [listId, levelId]);

  // Check for quiz completion
  useEffect(() => {
    if (isQuizActive && isQuizComplete()) {
      // Calculate quiz duration
      const durationMinutes = quizStartTime
        ? (Date.now() - quizStartTime) / (1000 * 60)
        : undefined;

      // Navigate to graduation screen with stats
      const finalStats = endQuiz();
      navigation.replace('Graduation', {
        listId,
        levelId,
        stats: {
          hints: finalStats.hints,
          wrong: finalStats.wrong,
          bestHints: 0, // Placeholder for Phase 4
          bestWrong: 0, // Placeholder for Phase 4
          durationMinutes,
        },
      });
    }
  }, [currentQuestionIndex, quizStartTime]);

  if (!list || !currentQuestion) {
    return (
      <View style={styles.container}>
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
    navigation.goBack();
  };

  const handleCancelExit = () => {
    setShowExitDialog(false);
  };

  const handleSelectAnswer = (answer: string) => {
    const result = submitAnswer(answer);
    setIsCorrect(result.isCorrect);
    setCorrectAnswer(result.correctAnswer);
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

  const handleSubmitAnswer = (answer: string) => {
    const result = submitAnswer(answer);
    setIsCorrect(result.isCorrect);
    setCorrectAnswer(result.correctAnswer);
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
    const definition = useHint();
    // Show hint in an alert or dialog
    alert(`Hint: ${definition}`);
  };

  const handleFeedbackEnd = () => {
    setShowFeedback(false);
    // Move to next question after feedback
    setTimeout(() => {
      getNextQuestion();
    }, 300);
  };

  const totalWords = list.levels.find((l) => l.id === levelId)?.words.length || 0;
  const progress = totalWords > 0 ? calculateProgress() / (totalWords * 3) : 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <QuizHeader
        listName={list.name}
        levelName={levelId.charAt(0).toUpperCase() + levelId.slice(1)}
        currentIndex={currentQuestionIndex - 1} // Adjust for 0-based indexing
        totalWords={totalWords}
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
            onSelectAnswer={handleSelectAnswer}
          />
        ) : (
          <FillInBlankQuestion
            sentence={currentQuestion.word.fillInBlank}
            onSubmitAnswer={handleSubmitAnswer}
            onUseHint={handleUseHint}
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
        <Dialog visible={showExitDialog} onDismiss={handleCancelExit}>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
