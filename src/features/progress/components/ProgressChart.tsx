/**
 * Progress Chart Component
 *
 * Line chart showing words learned over time (last 30 days).
 */

import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { Typography } from '@/shared/ui';

interface ProgressChartProps {
  dailyProgress: Record<string, number>; // date (YYYY-MM-DD) -> words learned
}

export function ProgressChart({ dailyProgress }: ProgressChartProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, 600); // Max width 600px

  // Extract RGB values from theme color for use in rgba()
  const getPrimaryRgb = () => {
    const hex = theme.colors.primary.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  const getTextRgb = () => {
    const hex = theme.colors.onSurface.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  // Get last 30 days of data
  const getLast30Days = () => {
    const days: { date: string; count: number }[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      days.push({
        date: dateStr,
        count: dailyProgress[dateStr] || 0,
      });
    }

    return days;
  };

  const last30Days = getLast30Days();

  // Calculate cumulative progress
  let cumulative = 0;
  const cumulativeData = last30Days.map((day) => {
    cumulative += day.count;
    return cumulative;
  });

  // Format labels (show dates at 5-day intervals)
  const labels = last30Days.map((day, index) => {
    if (index % 5 === 0) {
      const date = new Date(day.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return '';
  });

  // Handle empty data
  if (cumulativeData.every((val) => val === 0)) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="body" color="secondary" align="center">
          Start learning words to see your progress chart!
        </Typography>
      </View>
    );
  }

  const primaryRgb = getPrimaryRgb();
  const textRgb = getTextRgb();

  return (
    <View style={styles.container}>
      <LineChart
        data={{
          labels,
          datasets: [
            {
              data: cumulativeData,
            },
          ],
        }}
        width={chartWidth}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(${primaryRgb}, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(${textRgb}, ${opacity * 0.6})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '3',
            strokeWidth: '2',
            stroke: theme.colors.primary,
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: theme.colors.outlineVariant,
            strokeWidth: 1,
          },
        }}
        bezier
        style={styles.chart}
        withInnerLines
        withOuterLines
        withVerticalLabels
        withHorizontalLabels
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  chart: {
    borderRadius: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
});
