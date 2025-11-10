import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { Appbar } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/shared/types';
import { getListById } from '../utils/vocabularyLoader';
import { LevelButton } from '../components/LevelButton';
import { Typography, Spacer } from '@/shared/ui';
import { useProgressStore } from '@/shared/store/progressStore';

type Props = StackScreenProps<RootStackParamList, 'Difficulty'>;

// Map level IDs to difficulty ratings
const LEVEL_DIFFICULTY_MAP: Record<string, 1 | 2 | 3 | 4 | 5> = {
  basic: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
  professional: 5,
};

export default function DifficultyScreen({ navigation, route }: Props) {
  const { listId } = route.params;
  const list = getListById(listId);
  const progressStore = useProgressStore();

  // Calculate mastered words for a level
  const getMasteredCount = (levelId: string, totalWords: number) => {
    const levelProgress = progressStore.getListLevelProgress(listId, levelId);
    if (levelProgress.length === 0) return 0;

    return levelProgress.filter((wp) => wp.state === 3).length;
  };

  // Animation values for staggered slide-in
  const slideAnims = useRef(list?.levels.map(() => new Animated.Value(-100)) || []).current;

  // Staggered slide-in animation on mount
  useEffect(() => {
    if (!list) return;

    const animations = slideAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 0,
        duration: 400,
        delay: index * 100, // Stagger animations
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!list) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="List Not Found" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Typography variant="body">The selected vocabulary list could not be found.</Typography>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={list.name} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Typography variant="heading1">Select Difficulty</Typography>
          <Spacer size="xs" />
          <Typography variant="body" color="secondary">
            Choose a difficulty level to begin your quiz
          </Typography>
        </View>

        <Spacer size="lg" />

        <View style={styles.levelsContainer}>
          {list.levels.map((level, index) => {
            const difficulty = LEVEL_DIFFICULTY_MAP[level.id] || 1;
            const wordCount = level.words.length;
            const masteredCount = getMasteredCount(level.id, wordCount);

            return (
              <Animated.View
                key={level.id}
                style={[
                  styles.levelButtonWrapper,
                  {
                    transform: [{ translateX: slideAnims[index] }],
                  },
                ]}
              >
                <LevelButton
                  levelId={level.id}
                  name={level.name}
                  wordCount={wordCount}
                  difficulty={difficulty}
                  completionStatus={`${masteredCount} / ${wordCount} mastered`}
                  onPress={() => navigation.navigate('Quiz', { listId, levelId: level.id })}
                />
              </Animated.View>
            );
          })}
        </View>

        <Spacer size="xl" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  levelsContainer: {
    width: '100%',
  },
  levelButtonWrapper: {
    width: '100%',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
