/**
 * OnboardingSlide Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { OnboardingSlide } from '../OnboardingSlide';

describe('OnboardingSlide', () => {
  const defaultProps = {
    icon: 'book-open-variant',
    iconColor: '#6200ee',
    title: 'Learn Vocabulary',
    description: 'Master new words with interactive quizzes',
  };

  it('renders without crashing', () => {
    const { root } = render(<OnboardingSlide {...defaultProps} />);
    expect(root).toBeTruthy();
  });

  it('displays the title text', () => {
    const { getByText } = render(<OnboardingSlide {...defaultProps} />);
    expect(getByText('Learn Vocabulary')).toBeTruthy();
  });

  it('displays the description text', () => {
    const { getByText } = render(<OnboardingSlide {...defaultProps} />);
    expect(getByText('Master new words with interactive quizzes')).toBeTruthy();
  });

  it('renders with different content', () => {
    const customProps = {
      icon: 'trophy',
      iconColor: '#ff5722',
      title: 'Track Progress',
      description: 'Monitor your learning journey',
    };

    const { getByText } = render(<OnboardingSlide {...customProps} />);
    expect(getByText('Track Progress')).toBeTruthy();
    expect(getByText('Monitor your learning journey')).toBeTruthy();
  });

  it('accepts all required props', () => {
    expect(() => render(<OnboardingSlide {...defaultProps} />)).not.toThrow();
  });

  it('renders Typography components for title and description', () => {
    const { getByText } = render(<OnboardingSlide {...defaultProps} />);
    const title = getByText('Learn Vocabulary');
    const description = getByText('Master new words with interactive quizzes');

    expect(title).toBeTruthy();
    expect(description).toBeTruthy();
  });
});
