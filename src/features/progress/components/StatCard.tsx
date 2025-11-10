import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';
import { Card, Typography, Spacer } from '@/shared/ui';

/**
 * StatCard Component
 *
 * Displays a single metric with an icon, label, and value
 * in a visually appealing card format.
 *
 * @example
 * ```tsx
 * <StatCard
 *   icon="book-outline"
 *   label="Words Learned"
 *   value="0"
 *   iconColor="#4CAF50"
 * />
 * ```
 */

interface StatCardProps {
  /** Icon name from Material Community Icons */
  icon: string;
  /** Label/description of the metric */
  label: string;
  /** Value to display */
  value: string | number;
  /** Optional icon color */
  iconColor?: string;
}

export function StatCard({ icon, label, value, iconColor = '#2196F3' }: StatCardProps) {
  return (
    <Card elevation="medium" style={styles.card}>
      <Card.Content>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
            <Icon source={icon} size={32} color={iconColor} />
          </View>
          <Spacer size="sm" />
          <Typography variant="heading2" align="center">
            {value}
          </Typography>
          <Spacer size="xs" />
          <Typography variant="caption" color="secondary" align="center">
            {label}
          </Typography>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 0,
    minHeight: 120,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
