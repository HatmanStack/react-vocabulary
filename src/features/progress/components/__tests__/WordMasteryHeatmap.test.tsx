/**
 * WordMasteryHeatmap Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { WordMasteryHeatmap } from '../WordMasteryHeatmap';
import { ListLevelProgress } from '@/shared/types';

describe('WordMasteryHeatmap', () => {
  it('displays empty state when no progress', () => {
    const { getByText } = render(<WordMasteryHeatmap listLevelProgress={{}} />);

    expect(getByText('Start learning to see your word mastery heatmap!')).toBeTruthy();
  });

  it('renders legend with all mastery states', () => {
    const mockProgress: Record<string, ListLevelProgress> = {
      'list-a-basic': {
        listId: 'list-a',
        levelId: 'basic',
        wordProgress: {
          'word1': {
            wordId: 'word1',
            state: 3,
            attempts: 3,
            correctAttempts: 3,
            lastReviewedAt: '2024-01-01',
          },
        },
      },
    };

    const { getByText } = render(<WordMasteryHeatmap listLevelProgress={mockProgress} />);

    expect(getByText('Not Started')).toBeTruthy();
    expect(getByText('Seen')).toBeTruthy();
    expect(getByText('Learning')).toBeTruthy();
    expect(getByText('Mastered')).toBeTruthy();
  });

  it('renders list and level labels', () => {
    const mockProgress: Record<string, ListLevelProgress> = {
      'list-a-basic': {
        listId: 'list-a',
        levelId: 'basic',
        wordProgress: {
          'word1': {
            wordId: 'word1',
            state: 2,
            attempts: 2,
            correctAttempts: 1,
            lastReviewedAt: '2024-01-01',
          },
        },
      },
    };

    const { getByText } = render(<WordMasteryHeatmap listLevelProgress={mockProgress} />);

    expect(getByText('list-a')).toBeTruthy();
    expect(getByText('basic:')).toBeTruthy();
  });

  it('renders word dots with accessibility labels', () => {
    const mockProgress: Record<string, ListLevelProgress> = {
      'list-a-basic': {
        listId: 'list-a',
        levelId: 'basic',
        wordProgress: {
          'word1': {
            wordId: 'word1',
            state: 0,
            attempts: 0,
            correctAttempts: 0,
            lastReviewedAt: null,
          },
          'word2': {
            wordId: 'word2',
            state: 1,
            attempts: 1,
            correctAttempts: 1,
            lastReviewedAt: '2024-01-01',
          },
          'word3': {
            wordId: 'word3',
            state: 2,
            attempts: 2,
            correctAttempts: 1,
            lastReviewedAt: '2024-01-01',
          },
        },
      },
    };

    const { getByLabelText } = render(<WordMasteryHeatmap listLevelProgress={mockProgress} />);

    expect(getByLabelText('Word 1, state 0')).toBeTruthy();
    expect(getByLabelText('Word 2, state 1')).toBeTruthy();
    expect(getByLabelText('Word 3, state 2')).toBeTruthy();
  });

  it('handles multiple lists and levels', () => {
    const mockProgress: Record<string, ListLevelProgress> = {
      'list-a-basic': {
        listId: 'list-a',
        levelId: 'basic',
        wordProgress: {
          'word1': {
            wordId: 'word1',
            state: 3,
            attempts: 3,
            correctAttempts: 3,
            lastReviewedAt: '2024-01-01',
          },
        },
      },
      'list-a-advanced': {
        listId: 'list-a',
        levelId: 'advanced',
        wordProgress: {
          'word2': {
            wordId: 'word2',
            state: 2,
            attempts: 2,
            correctAttempts: 1,
            lastReviewedAt: '2024-01-01',
          },
        },
      },
      'list-b-expert': {
        listId: 'list-b',
        levelId: 'expert',
        wordProgress: {
          'word3': {
            wordId: 'word3',
            state: 1,
            attempts: 1,
            correctAttempts: 1,
            lastReviewedAt: '2024-01-01',
          },
        },
      },
    };

    const { getByText } = render(<WordMasteryHeatmap listLevelProgress={mockProgress} />);

    // List A should appear
    expect(getByText('list-a')).toBeTruthy();
    expect(getByText('basic:')).toBeTruthy();
    expect(getByText('advanced:')).toBeTruthy();

    // List B should appear
    expect(getByText('list-b')).toBeTruthy();
    expect(getByText('expert:')).toBeTruthy();
  });

  it('organizes words by list and level correctly', () => {
    const mockProgress: Record<string, ListLevelProgress> = {
      'list-a-basic': {
        listId: 'list-a',
        levelId: 'basic',
        wordProgress: {
          'word1': { wordId: 'word1', state: 0, attempts: 0, correctAttempts: 0, lastReviewedAt: null },
          'word2': { wordId: 'word2', state: 1, attempts: 1, correctAttempts: 1, lastReviewedAt: '2024-01-01' },
          'word3': { wordId: 'word3', state: 2, attempts: 2, correctAttempts: 1, lastReviewedAt: '2024-01-01' },
          'word4': { wordId: 'word4', state: 3, attempts: 3, correctAttempts: 3, lastReviewedAt: '2024-01-01' },
        },
      },
    };

    const { getByLabelText } = render(<WordMasteryHeatmap listLevelProgress={mockProgress} />);

    // All 4 words should be rendered
    expect(getByLabelText('Word 1, state 0')).toBeTruthy();
    expect(getByLabelText('Word 2, state 1')).toBeTruthy();
    expect(getByLabelText('Word 3, state 2')).toBeTruthy();
    expect(getByLabelText('Word 4, state 3')).toBeTruthy();
  });

  it('renders with ScrollView for horizontal scrolling', () => {
    const mockProgress: Record<string, ListLevelProgress> = {
      'list-a-basic': {
        listId: 'list-a',
        levelId: 'basic',
        wordProgress: {
          'word1': {
            wordId: 'word1',
            state: 3,
            attempts: 3,
            correctAttempts: 3,
            lastReviewedAt: '2024-01-01',
          },
        },
      },
    };

    const { root } = render(<WordMasteryHeatmap listLevelProgress={mockProgress} />);
    expect(root).toBeTruthy();
  });
});
