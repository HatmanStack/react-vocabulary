/**
 * Word Mastery Heatmap Component
 *
 * Shows a grid of all words colored by their mastery level.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ListLevelProgress } from '@/shared/types';
import { Typography, Spacer } from '@/shared/ui';

interface WordMasteryHeatmapProps {
  listLevelProgress: Record<string, ListLevelProgress>;
}

export function WordMasteryHeatmap({ listLevelProgress }: WordMasteryHeatmapProps) {
  // Get color for word state
  const getStateColor = (state: number): string => {
    switch (state) {
      case 0:
        return '#E0E0E0'; // Not started - light gray
      case 1:
        return '#BBDEFB'; // Seen - light blue
      case 2:
        return '#64B5F6'; // Learning - blue
      case 3:
        return '#4CAF50'; // Mastered - green
      default:
        return '#E0E0E0';
    }
  };

  // Organize words by list and level
  const organizedData: Record<string, Record<string, { wordId: string; state: number }[]>> = {};

  Object.values(listLevelProgress).forEach((llp) => {
    if (!organizedData[llp.listId]) {
      organizedData[llp.listId] = {};
    }
    if (!organizedData[llp.listId][llp.levelId]) {
      organizedData[llp.listId][llp.levelId] = [];
    }

    Object.entries(llp.wordProgress).forEach(([wordId, wp]) => {
      organizedData[llp.listId][llp.levelId].push({
        wordId,
        state: wp.state,
      });
    });
  });

  // Check if there's any progress
  const hasProgress = Object.keys(organizedData).length > 0;

  if (!hasProgress) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="body" color="secondary" align="center">
          Start learning to see your word mastery heatmap!
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#E0E0E0' }]} />
            <Typography variant="caption">Not Started</Typography>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#BBDEFB' }]} />
            <Typography variant="caption">Seen</Typography>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#64B5F6' }]} />
            <Typography variant="caption">Learning</Typography>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Typography variant="caption">Mastered</Typography>
          </View>
        </View>

        <Spacer size="md" />

        {/* Heatmap Grid */}
        {Object.entries(organizedData).map(([listId, levels]) => (
          <View key={listId} style={styles.listSection}>
            <Typography variant="caption" style={styles.listLabel}>
              {listId}
            </Typography>
            <Spacer size="xs" />

            {Object.entries(levels).map(([levelId, words]) => (
              <View key={`${listId}-${levelId}`} style={styles.levelRow}>
                <Typography variant="caption" style={styles.levelLabel}>
                  {levelId}:
                </Typography>
                <View style={styles.wordsRow}>
                  {words.map((word, index) => (
                    <View
                      key={`${word.wordId}-${index}`}
                      style={[styles.wordDot, { backgroundColor: getStateColor(word.state) }]}
                      accessibilityLabel={`Word ${index + 1}, state ${word.state}`}
                    />
                  ))}
                </View>
              </View>
            ))}
            <Spacer size="sm" />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    minWidth: '100%',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  listSection: {
    marginBottom: 8,
  },
  listLabel: {
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  levelLabel: {
    width: 80,
    marginRight: 8,
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
  },
  wordDot: {
    width: 16,
    height: 16,
    borderRadius: 2,
  },
});
