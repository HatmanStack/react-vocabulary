import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, Animated, Alert } from 'react-native';
import { Icon, Dialog, Portal } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Achievement } from '@/shared/types';
import { Card, Typography, Spacer, Button } from '@/shared/ui';
import { useProgressStore } from '@/shared/store/progressStore';
import { useSound } from '@/shared/hooks/useSound';
import { useHaptics } from '@/shared/hooks/useHaptics';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { AchievementUnlockModal } from '@/features/progress/components/AchievementUnlockModal';

type Props = StackScreenProps<RootStackParamList, 'Graduation'>;

export default function GraduationScreen({ navigation, route }: Props) {
  const { listId, levelId, stats } = route.params;
  const progressStore = useProgressStore();
  const { playComplete } = useSound();
  const { triggerSuccess } = useHaptics();
  const reducedMotion = useReducedMotion();
  const [resetDialogVisible, setResetDialogVisible] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);

  // Animation refs (start at final values if reduced motion)
  const fadeAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0.8)).current;

  // Celebration animation on mount
  useEffect(() => {
    // Play completion sound and haptic feedback
    playComplete();
    triggerSuccess();

    // Skip animations if reduced motion is enabled
    if (reducedMotion) {
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, reducedMotion]);

  // Check for achievements on mount
  useEffect(() => {
    const sessionData = stats?.durationMinutes
      ? {
          listId,
          levelId,
          hints: stats.hints,
          wrong: stats.wrong,
          durationMinutes: stats.durationMinutes,
        }
      : undefined;

    const newAchievements = progressStore.checkAndUnlockAchievements(sessionData);
    if (newAchievements.length > 0) {
      setUnlockedAchievements(newAchievements);
    }
  }, []);

  // Get current session stats
  const hintsUsed = stats?.hints || 0;
  const wrongAnswers = stats?.wrong || 0;

  // Get best scores from progressStore
  const bestScore = progressStore.getBestScore(listId, levelId);
  const bestHints = bestScore?.hints ?? 0;
  const bestWrong = bestScore?.wrong ?? 0;

  // Check if this is a new best score
  const isNewBest =
    !bestScore || hintsUsed < bestHints || (hintsUsed === bestHints && wrongAnswers < bestWrong);

  // Get global stats
  const globalStats = progressStore.getGlobalStats();
  const totalWordsLearned = progressStore.getTotalWordsLearned();

  // Handle reset level
  const handleResetLevel = () => {
    setResetDialogVisible(true);
  };

  const confirmResetLevel = () => {
    progressStore.resetListLevelProgress(listId, levelId);
    setResetDialogVisible(false);
    // Navigate to quiz screen with fresh start
    navigation.navigate('Quiz', { listId, levelId });
  };

  // Handle achievement modal dismissal
  const handleDismissAchievement = () => {
    if (currentAchievementIndex < unlockedAchievements.length - 1) {
      // Show next achievement
      setCurrentAchievementIndex(currentAchievementIndex + 1);
    } else {
      // Reset to hide modal
      setCurrentAchievementIndex(0);
      setUnlockedAchievements([]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Spacer size="xl" />

      {/* Celebration Header */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Icon source="trophy" size={80} color="#FFD700" />
        </View>
        <Spacer size="md" />
        <Typography variant="heading1" align="center" style={styles.title}>
          Congratulations!
        </Typography>
        <Spacer size="xs" />
        <Typography variant="body" color="secondary" align="center">
          You've completed this quiz
        </Typography>
      </Animated.View>

      <Spacer size="xl" />

      {/* Current Session Stats */}
      <Card elevation="medium" style={styles.card}>
        <Card.Content>
          <Typography variant="heading3" align="center">
            Your Performance
          </Typography>
          <Spacer size="md" />

          <View style={styles.statRow}>
            <Icon source="lightbulb-outline" size={24} color="#FF9800" />
            <Spacer size="sm" direction="horizontal" />
            <Typography variant="body">Hints used: {hintsUsed}</Typography>
          </View>

          <Spacer size="sm" />

          <View style={styles.statRow}>
            <Icon source="close-circle-outline" size={24} color="#F44336" />
            <Spacer size="sm" direction="horizontal" />
            <Typography variant="body">Wrong answers: {wrongAnswers}</Typography>
          </View>
        </Card.Content>
      </Card>

      <Spacer size="md" />

      {/* Best Scores */}
      <Card elevation="low" style={styles.card}>
        <Card.Content>
          <Typography variant="heading3" align="center">
            Best Score
          </Typography>
          <Spacer size="sm" />
          {isNewBest && (
            <>
              <Typography variant="caption" style={styles.newBestText} align="center">
                🎉 New Best Score! 🎉
              </Typography>
              <Spacer size="sm" />
            </>
          )}
          <Spacer size="md" />

          <View style={styles.statRow}>
            <Icon source="star" size={20} color="#4CAF50" />
            <Spacer size="sm" direction="horizontal" />
            <Typography variant="body">
              Best: {bestHints} hints, {bestWrong} wrong
            </Typography>
          </View>
        </Card.Content>
      </Card>

      <Spacer size="md" />

      {/* All-Time Stats */}
      <Card elevation="low" style={styles.card}>
        <Card.Content>
          <Typography variant="heading3" align="center">
            All-Time Statistics
          </Typography>
          <Spacer size="md" />

          <View style={styles.statRow}>
            <Typography variant="body">Total words learned: {totalWordsLearned}</Typography>
          </View>
          <Spacer size="xs" />
          <View style={styles.statRow}>
            <Typography variant="body">All-time hints: {globalStats.allTimeHints}</Typography>
          </View>
          <Spacer size="xs" />
          <View style={styles.statRow}>
            <Typography variant="body">All-time wrong: {globalStats.allTimeWrong}</Typography>
          </View>
        </Card.Content>
      </Card>

      <Spacer size="xl" />

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          variant="primary"
          onPress={() => navigation.navigate('Quiz', { listId, levelId })}
          fullWidth
        >
          Try Again
        </Button>

        <Spacer size="sm" />

        <Button
          variant="secondary"
          onPress={() => navigation.navigate('Difficulty', { listId })}
          fullWidth
        >
          Choose Another Level
        </Button>

        <Spacer size="sm" />

        <Button variant="text" onPress={handleResetLevel} fullWidth>
          Reset This Level
        </Button>

        <Spacer size="xs" />

        <Button variant="text" onPress={() => navigation.navigate('Home')} fullWidth>
          Back to Home
        </Button>
      </View>

      <Spacer size="xl" />

      {/* Reset Confirmation Dialog */}
      <Portal>
        <Dialog visible={resetDialogVisible} onDismiss={() => setResetDialogVisible(false)}>
          <Dialog.Title>Reset Level Progress?</Dialog.Title>
          <Dialog.Content>
            <Typography variant="body">
              This will reset all progress for this level. Your best score and word states will be
              cleared. This action cannot be undone.
            </Typography>
          </Dialog.Content>
          <Dialog.Actions>
            <Button variant="text" onPress={() => setResetDialogVisible(false)}>
              Cancel
            </Button>
            <Button variant="text" onPress={confirmResetLevel}>
              Reset
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Achievement Unlock Modal */}
      <AchievementUnlockModal
        achievement={unlockedAchievements[currentAchievementIndex] || null}
        visible={unlockedAchievements.length > 0}
        onDismiss={handleDismissAchievement}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    color: '#4CAF50',
  },
  card: {
    marginHorizontal: 0,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  newBestText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
