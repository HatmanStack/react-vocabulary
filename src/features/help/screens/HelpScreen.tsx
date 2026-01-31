/**
 * Help Screen
 *
 * Provides in-app help and FAQ for users.
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Pressable } from 'react-native';
import { Appbar, List, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Card, Typography, Spacer } from '@/shared/ui';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: '1',
    question: 'How do I start learning?',
    answer:
      'From the home screen, select a vocabulary list (List A-H). Then choose a difficulty level (Easy, Medium, or Hard). The quiz will start automatically with questions based on your selected level.',
  },
  {
    id: '2',
    question: 'What are the different question types?',
    answer:
      'There are two types: Multiple Choice (choose the correct word from 4 options) and Fill-in-the-Blank (type the missing word in a sentence). Both test your vocabulary knowledge in different ways.',
  },
  {
    id: '3',
    question: 'How does progress tracking work?',
    answer:
      'Your progress is tracked automatically. Each word has a mastery level (0-3) based on your answers. Words you answer correctly multiple times will reach mastery level 3. View your progress in the Statistics screen.',
  },
  {
    id: '4',
    question: 'What are achievements?',
    answer:
      'Achievements are rewards for reaching learning milestones. Complete quizzes, learn words, and maintain streaks to unlock them. View all achievements in the Statistics screen.',
  },
  {
    id: '5',
    question: 'How do I use hints?',
    answer:
      'On fill-in-the-blank questions, tap the "Hint" button to reveal the definition of the word you need. Using hints will be tracked in your statistics.',
  },
  {
    id: '6',
    question: 'Can I reset my progress?',
    answer:
      'Yes! Go to Settings > Data > Danger Zone > Reset All Progress. You can also reset individual levels from the graduation screen after completing a quiz. Be careful - this action cannot be undone!',
  },
  {
    id: '7',
    question: 'How do I change the theme?',
    answer:
      'Go to Settings > Appearance > Theme. Choose between Light, Dark, or Auto (follows your system setting). The theme will update immediately.',
  },
  {
    id: '8',
    question: 'Can I turn off sounds and haptics?',
    answer:
      'Yes! Go to Settings > Audio & Haptics. Toggle Sound Effects and Haptic Feedback on or off. Changes apply immediately.',
  },
  {
    id: '9',
    question: 'How do I export/import my progress?',
    answer:
      'Go to Settings > Data. Tap "Export" to save your progress as JSON data. To import, tap "Import" and paste the exported data. This is useful for backing up or transferring progress between devices.',
  },
  {
    id: '10',
    question: 'What happens if I exit a quiz early?',
    answer:
      'If you exit a quiz before completing it, your progress for that session will be lost. However, your overall word mastery levels from previous sessions will remain unchanged.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handlePress = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Help & FAQ" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Spacer size="md" />

        <View style={styles.header}>
          <Typography variant="heading2">Frequently Asked Questions</Typography>
          <Spacer size="xs" />
          <Typography variant="body" color="secondary">
            Tap a question to view the answer
          </Typography>
        </View>

        <Spacer size="lg" />

        <Card elevation="low" style={styles.card}>
          <List.Section>
            {FAQ_ITEMS.map((item, index) => (
              <React.Fragment key={item.id}>
                <List.Accordion
                  title={item.question}
                  expanded={expandedId === item.id}
                  onPress={() => handlePress(item.id)}
                  titleStyle={styles.questionText}
                >
                  <View style={[styles.answerContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Typography variant="body" style={styles.answerText}>
                      {item.answer}
                    </Typography>
                  </View>
                </List.Accordion>
                {index < FAQ_ITEMS.length - 1 && <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />}
              </React.Fragment>
            ))}
          </List.Section>
        </Card>

        <Spacer size="lg" />

        <View style={styles.section}>
          <Typography variant="heading3">Need More Help?</Typography>
          <Spacer size="sm" />
          <Card elevation="low" style={styles.card}>
            <Card.Content>
              <Typography variant="body">
                If you have questions not covered here, check out the app settings for more options.
              </Typography>
              <Spacer size="md" />
              <Pressable
                style={[styles.contactButton, { backgroundColor: theme.colors.primaryContainer }]}
                onPress={() => Linking.openURL('https://gemenielabs.hatstack.fun')}
              >
                <Typography variant="body" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '600' }}>
                  Contact the Makers
                </Typography>
              </Pressable>
            </Card.Content>
          </Card>
        </View>

        <Spacer size="xl" />
      </ScrollView>
    </View>
  );
}

const MAX_CONTENT_WIDTH = 800;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxWidth: MAX_CONTENT_WIDTH,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
  },
  card: {
    marginHorizontal: 0,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  answerText: {
    lineHeight: 22,
  },
  divider: {
    height: 1,
  },
  section: {
    width: '100%',
  },
  contactButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
});
