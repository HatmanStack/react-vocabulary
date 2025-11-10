import React from 'react';
import { render } from '@testing-library/react-native';
import { Spacer } from '../Spacer';

describe('Spacer', () => {
  it('renders without crashing', () => {
    const { root } = render(<Spacer />);
    expect(root).toBeTruthy();
  });

  it('renders with default size', () => {
    const { root } = render(<Spacer />);
    expect(root).toBeTruthy();
  });

  it('renders with custom size', () => {
    const { root } = render(<Spacer size="lg" />);
    expect(root).toBeTruthy();
  });

  it('renders with horizontal direction', () => {
    const { root } = render(<Spacer direction="horizontal" />);
    expect(root).toBeTruthy();
  });

  it('renders with vertical direction', () => {
    const { root } = render(<Spacer direction="vertical" />);
    expect(root).toBeTruthy();
  });
});
