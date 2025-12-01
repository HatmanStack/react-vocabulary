import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Animated } from 'react-native';
import { Appbar, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { loadVocabularyLists } from '../utils/vocabularyLoader';
import { ListCard } from '../components/ListCard';
import { Typography, Spacer, SyncStatusIndicator } from '@/shared/ui';
import { useProgressStore } from '@/shared/store/progressStore';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

// Responsive breakpoints
const BREAKPOINTS = {
  sm: 480,   // 1 column
  md: 768,   // 2 columns
  lg: 1024,  // 3 columns
  xl: 1280,  // 4 columns
};

// Gap between grid items
const GRID_GAP = 16;

export default function HomeScreen() {
  console.log('[HomeScreen] Component rendering');
  const router = useRouter();
  const theme = useTheme();
  const vocabularyLists = loadVocabularyLists();
  console.log('[HomeScreen] Loaded', vocabularyLists.length, 'vocabulary lists');
  const { width } = useWindowDimensions();
  const progressStore = useProgressStore();
  const reducedMotion = useReducedMotion();

  // Calculate number of columns based on screen width
  const numColumns = useMemo(() => {
    if (width >= BREAKPOINTS.xl) return 4;
    if (width >= BREAKPOINTS.lg) return 3;
    if (width >= BREAKPOINTS.md) return 2;
    return 1;
  }, [width]);

  // Calculate item width based on columns and gap
  const itemWidth = useMemo(() => {
    const totalGapWidth = GRID_GAP * (numColumns - 1);
    const availableWidth = width - 32 - totalGapWidth; // 32 = padding (16 * 2)
    return availableWidth / numColumns;
  }, [width, numColumns]);

  // Calculate progress for each list
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
    if (reducedMotion) {
      return;
    }

    const animations = fadeAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Vocabulary" />
        <SyncStatusIndicator />
        <Appbar.Action
          icon="chart-bar"
          onPress={() => router.push('/stats')}
          accessibilityLabel="View Statistics"
        />
        <Appbar.Action
          icon="cog"
          onPress={() => router.push('/settings')}
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

        <View style={[styles.grid, { gap: GRID_GAP }]}>
          {vocabularyLists.map((list, index) => (
            <Animated.View
              key={list.id}
              style={[
                { width: itemWidth, opacity: fadeAnims[index] },
              ]}
            >
              <ListCard
                id={list.id}
                name={list.name}
                description={list.description}
                progress={getListProgress(list.id)}
                max={list.levels.reduce((sum, level) => sum + level.words.length, 0)}
                onPress={() => router.push({ pathname: '/difficulty', params: { listId: list.id } })}
              />
            </Animated.View>
          ))}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
