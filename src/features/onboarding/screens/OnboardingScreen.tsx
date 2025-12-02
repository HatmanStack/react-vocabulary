/**
 * Onboarding Screen
 *
 * First-time user onboarding explaining app features.
 * Includes optional login step for cloud sync.
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { Button, IconButton, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { Spacer, LoginPrompt } from '@/shared/ui';

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

type OnboardingStep = 'slides' | 'login';

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const settingsStore = useSettingsStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<OnboardingStep>('slides');
  const flatListRef = useRef<FlatList>(null);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const completeOnboarding = useCallback(() => {
    settingsStore.setOnboardingCompleted(true);
    router.replace('/');
  }, [settingsStore, router]);

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      // Move to login step after slides
      setStep('login');
    } else {
      // Scroll to next slide
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  }, [isLastSlide, currentIndex]);

  const handleSkip = useCallback(() => {
    // Skip directly to login step
    setStep('login');
  }, []);

  const handleScroll = useCallback(
    (event: any) => {
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const index = Math.round(scrollPosition / width);
      setCurrentIndex(index);
    },
    [width]
  );

  const handleLoginComplete = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const handleLoginSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  // Render login step
  if (step === 'login') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.skipContainer}>
          <IconButton icon="close" size={24} onPress={handleLoginSkip} />
        </View>
        <LoginPrompt onComplete={handleLoginComplete} onSkip={handleLoginSkip} />
      </View>
    );
  }

  // Render slides step
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: theme.colors.outlineVariant },
                index === currentIndex && [
                  styles.activeDot,
                  { backgroundColor: theme.colors.primary },
                ],
              ]}
            />
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
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    paddingVertical: 6,
  },
});
