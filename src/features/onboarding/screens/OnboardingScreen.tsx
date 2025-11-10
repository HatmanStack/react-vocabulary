/**
 * Onboarding Screen
 *
 * First-time user onboarding explaining app features.
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/shared/types';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { Spacer } from '@/shared/ui';

type Props = StackScreenProps<RootStackParamList, 'Onboarding'>;

interface Slide {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'hand-wave',
    iconColor: '#FFB74D',
    title: 'Welcome to Vocabulary!',
    description:
      'Build your vocabulary with interactive quizzes and track your learning progress along the way.',
  },
  {
    id: '2',
    icon: 'school',
    iconColor: '#64B5F6',
    title: 'Two Quiz Types',
    description:
      'Practice with multiple choice questions or fill-in-the-blank exercises. Use hints when you need help!',
  },
  {
    id: '3',
    icon: 'chart-line',
    iconColor: '#4CAF50',
    title: 'Track Your Progress',
    description:
      'Watch your vocabulary grow! View detailed statistics, unlock achievements, and see your learning journey visualized.',
  },
  {
    id: '4',
    icon: 'lightbulb',
    iconColor: '#FF9800',
    title: 'Tips for Success',
    description:
      'Review regularly, use hints wisely, and learn from mistakes. Every quiz brings you closer to mastery!',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const settingsStore = useSettingsStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      // Mark onboarding as completed and navigate to Home
      settingsStore.setOnboardingCompleted(true);
      navigation.replace('Home');
    } else {
      // Scroll to next slide
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  const handleSkip = () => {
    settingsStore.setOnboardingCompleted(true);
    navigation.replace('Home');
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      {!isLastSlide && (
        <View style={styles.skipContainer}>
          <IconButton icon="close" size={24} onPress={handleSkip} />
        </View>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item }) => (
          <OnboardingSlide
            icon={item.icon}
            iconColor={item.iconColor}
            title={item.title}
            description={item.description}
          />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Progress Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View key={index} style={[styles.dot, index === currentIndex && styles.activeDot]} />
          ))}
        </View>

        <Spacer size="lg" />

        {/* Next/Get Started Button */}
        <View style={styles.buttonContainer}>
          <Button mode="contained" onPress={handleNext} style={styles.button}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Button>
        </View>

        <Spacer size="md" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipContainer: {
    position: 'absolute',
    top: 16,
    right: 8,
    zIndex: 10,
  },
  bottomContainer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#6200EE',
    width: 24,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    paddingVertical: 6,
  },
});
