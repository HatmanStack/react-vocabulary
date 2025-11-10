import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Animated } from 'react-native';
import { Appbar } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/shared/types';
import { loadVocabularyLists } from '../utils/vocabularyLoader';
import { ListCard } from '../components/ListCard';
import { Typography, Spacer } from '@/shared/ui';
import { useProgressStore } from '@/shared/store/progressStore';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const vocabularyLists = loadVocabularyLists();
  const { width } = useWindowDimensions();
  const progressStore = useProgressStore();
  const reducedMotion = useReducedMotion();

  // Determine number of columns based on screen width
  // Breakpoint: 600px (common tablet breakpoint)
  const numColumns = width >= 600 ? 2 : 1;

  // Calculate progress for each list (memoized to prevent unnecessary recalculations)
  const getListProgress = useCallback(
    (listId: string) => {
      const listLevelProgress = Object.values(progressStore.listLevelProgress).filter(
        (llp) => llp.listId === listId
      );

      if (listLevelProgress.length === 0) return 0;

      let masteredWords = 0;
      listLevelProgress.forEach((llp) => {
        Object.values(llp.wordProgress).forEach((wp) => {
          if (wp.state === 3) {
            masteredWords++;
          }
        });
      });

      return masteredWords;
    },
    [progressStore.listLevelProgress]
  );

  // Animation values for fade-in effect (start at 1 if reduced motion)
  const fadeAnims = useRef(
    vocabularyLists.map(() => new Animated.Value(reducedMotion ? 1 : 0))
  ).current;

  // Fade-in animation on mount
  useEffect(() => {
    // Skip animations if reduced motion is enabled
    if (reducedMotion) {
      return;
    }

    const animations = fadeAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 100, // Stagger animations
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Vocabulary Builder" />
        <Appbar.Action
          icon="chart-bar"
          onPress={() => navigation.navigate('Stats')}
          accessibilityLabel="View Statistics"
        />
        <Appbar.Action
          icon="cog"
          onPress={() => navigation.navigate('Settings')}
          accessibilityLabel="Open Settings"
        />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Typography variant="heading1">Choose a List</Typography>
          <Spacer size="xs" />
          <Typography variant="body" color="secondary">
            Select a vocabulary list to begin learning
          </Typography>
        </View>

        <Spacer size="lg" />

        <View style={styles.listsContainer}>
          <View style={styles.grid}>
            {vocabularyLists.map((list, index) => (
              <Animated.View
                key={list.id}
                style={[
                  numColumns === 2 ? styles.gridItemTwoColumn : styles.gridItemOneColumn,
                  { opacity: fadeAnims[index] },
                ]}
              >
                <ListCard
                  id={list.id}
                  name={list.name}
                  description={list.description}
                  progress={getListProgress(list.id)}
                  max={list.levels.reduce((sum, level) => sum + level.words.length, 0)}
                  onPress={() => navigation.navigate('Difficulty', { listId: list.id })}
                />
              </Animated.View>
            ))}
          </View>
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
  listsContainer: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemOneColumn: {
    width: '100%',
    marginBottom: 16,
  },
  gridItemTwoColumn: {
    width: '48%',
    marginBottom: 16,
  },
});
