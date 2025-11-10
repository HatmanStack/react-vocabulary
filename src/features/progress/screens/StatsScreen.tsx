import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Appbar, SegmentedButtons } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList, Achievement } from '@/shared/types';
import { loadVocabularyLists } from '@/features/vocabulary/utils/vocabularyLoader';
import { StatCard } from '../components/StatCard';
import { Card, Typography, ProgressBar, Spacer } from '@/shared/ui';
import { useProgressStore } from '@/shared/store/progressStore';
import { AchievementBadge } from '../components/AchievementBadge';
import { getAchievementCompletionPercentage } from '../utils/achievements';
import { ProgressChart } from '../components/ProgressChart';
import { WordMasteryHeatmap } from '../components/WordMasteryHeatmap';

type Props = StackScreenProps<RootStackParamList, 'Stats'>;

export default function StatsScreen({ navigation }: Props) {
  const vocabularyLists = loadVocabularyLists();
  const { width } = useWindowDimensions();
  const progressStore = useProgressStore();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [chartView, setChartView] = useState<'progress' | 'heatmap'>('progress');

  // Determine number of columns for stat cards
  // 2 columns on mobile, 3-4 on tablet/web
  const numStatColumns = width >= 900 ? 4 : width >= 600 ? 3 : 2;

  // Get real stats from progressStore
  const globalStats = progressStore.getGlobalStats();
  const stats = {
    wordsLearned: progressStore.getTotalWordsLearned(),
    listsCompleted: globalStats.listsCompleted.length,
    allTimeHints: globalStats.allTimeHints,
    allTimeWrong: globalStats.allTimeWrong,
  };

  // Get achievements
  const achievements = progressStore.getAchievements();
  const achievementPercentage = getAchievementCompletionPercentage(achievements);

  // Empty state check
  const hasProgress = stats.wordsLearned > 0;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Your Progress" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Typography variant="heading2">Overall Statistics</Typography>
          <Spacer size="xs" />
          <Typography variant="caption" color="secondary">
            Track your learning journey
          </Typography>
        </View>

        <Spacer size="lg" />

        {/* Key Metrics Grid */}
        <View style={[styles.statsGrid, { gap: 12 }]}>
          <View
            style={[
              styles.statItem,
              { width: numStatColumns === 2 ? '48%' : `${100 / numStatColumns - 2}%` },
            ]}
          >
            <StatCard
              icon="book-outline"
              label="Words Learned"
              value={stats.wordsLearned}
              iconColor="#4CAF50"
            />
          </View>

          <View
            style={[
              styles.statItem,
              { width: numStatColumns === 2 ? '48%' : `${100 / numStatColumns - 2}%` },
            ]}
          >
            <StatCard
              icon="check-circle-outline"
              label="Lists Completed"
              value={`${stats.listsCompleted} / ${vocabularyLists.length}`}
              iconColor="#2196F3"
            />
          </View>

          <View
            style={[
              styles.statItem,
              { width: numStatColumns === 2 ? '48%' : `${100 / numStatColumns - 2}%` },
            ]}
          >
            <StatCard
              icon="lightbulb-outline"
              label="Total Hints"
              value={stats.allTimeHints}
              iconColor="#FF9800"
            />
          </View>

          <View
            style={[
              styles.statItem,
              { width: numStatColumns === 2 ? '48%' : `${100 / numStatColumns - 2}%` },
            ]}
          >
            <StatCard
              icon="close-circle-outline"
              label="Wrong Answers"
              value={stats.allTimeWrong}
              iconColor="#F44336"
            />
          </View>
        </View>

        <Spacer size="xl" />

        {/* Learning Progress Chart Section */}
        <View style={styles.section}>
          <Typography variant="heading3">Learning Progress</Typography>
          <Spacer size="sm" />

          {/* View Toggle */}
          <SegmentedButtons
            value={chartView}
            onValueChange={(value) => setChartView(value as 'progress' | 'heatmap')}
            buttons={[
              { value: 'progress', label: 'Progress Chart' },
              { value: 'heatmap', label: 'Word Mastery' },
            ]}
            style={styles.segmentedButtons}
          />

          <Spacer size="md" />

          {/* Chart Display */}
          <Card elevation="low" style={styles.card}>
            {chartView === 'progress' ? (
              <ProgressChart dailyProgress={progressStore.dailyProgress || {}} />
            ) : (
              <WordMasteryHeatmap listLevelProgress={progressStore.listLevelProgress} />
            )}
          </Card>
        </View>

        <Spacer size="xl" />

        {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="heading3">Achievements</Typography>
            <Typography variant="caption" color="secondary">
              {Math.round(achievementPercentage)}% Complete
            </Typography>
          </View>
          <Spacer size="sm" />
          <ProgressBar progress={achievementPercentage} max={100} />
          <Spacer size="md" />

          {/* Achievement Grid */}
          <View style={styles.achievementGrid}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <AchievementBadge
                  achievement={achievement}
                  onPress={() => setSelectedAchievement(achievement)}
                />
              </View>
            ))}
          </View>
        </View>

        <Spacer size="xl" />

        {/* Lists Overview Section */}
        <View style={styles.section}>
          <Typography variant="heading3">Lists Progress</Typography>
          <Spacer size="md" />

          {vocabularyLists.map((list) => {
            const totalWords = list.levels.reduce((sum, level) => sum + level.words.length, 0);

            // Calculate words completed for this list
            const listLevelProgress = Object.values(progressStore.listLevelProgress).filter(
              (llp) => llp.listId === list.id
            );

            let wordsCompleted = 0;
            listLevelProgress.forEach((llp) => {
              Object.values(llp.wordProgress).forEach((wp) => {
                if (wp.state === 3) {
                  wordsCompleted++;
                }
              });
            });

            return (
              <View key={list.id} style={styles.listItem}>
                <View style={styles.listHeader}>
                  <Typography variant="body">{list.name}</Typography>
                  <Typography variant="caption" color="secondary">
                    {wordsCompleted} / {totalWords} words
                  </Typography>
                </View>
                <Spacer size="xs" />
                <ProgressBar progress={wordsCompleted} max={totalWords} />
                <Spacer size="md" />
              </View>
            );
          })}
        </View>

        <Spacer size="lg" />

        {/* Empty State or Recent Activity */}
        {!hasProgress && (
          <Card elevation="low" style={styles.emptyStateCard}>
            <Card.Content>
              <Typography variant="body" align="center" color="secondary">
                Start learning to see your progress here!
              </Typography>
              <Spacer size="sm" />
              <Typography variant="caption" align="center" color="secondary">
                Complete quizzes to track your vocabulary journey
              </Typography>
            </Card.Content>
          </Card>
        )}

        <Spacer size="xl" />
      </ScrollView>
    </View>
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
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    marginBottom: 12,
  },
  section: {
    width: '100%',
  },
  card: {
    marginHorizontal: 0,
  },
  segmentedButtons: {
    marginHorizontal: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  achievementItem: {
    width: '30%',
    minWidth: 100,
    maxWidth: 140,
  },
  listItem: {
    marginBottom: 8,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyStateCard: {
    marginHorizontal: 0,
  },
});
