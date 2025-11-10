/**
 * Onboarding Slide Component
 *
 * Individual slide for the onboarding carousel.
 */

import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Icon } from 'react-native-paper';
import { Typography, Spacer } from '@/shared/ui';

interface OnboardingSlideProps {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
}

export function OnboardingSlide({ icon, iconColor, title, description }: OnboardingSlideProps) {
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <Icon source={icon} size={80} color={iconColor} />
        </View>

        <Spacer size="xl" />

        {/* Title */}
        <Typography variant="heading1" align="center" style={styles.title}>
          {title}
        </Typography>

        <Spacer size="md" />

        {/* Description */}
        <Typography variant="body" align="center" color="secondary" style={styles.description}>
          {description}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold' as const,
  },
  description: {
    lineHeight: 24,
  },
});
