import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { ProgressBar } from '../ProgressBar';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('ProgressBar', () => {
  it('renders correctly', () => {
    const { root } = renderWithProvider(<ProgressBar progress={5} max={10} />);
    expect(root).toBeTruthy();
  });

  it('displays label when provided', () => {
    const { getByText } = renderWithProvider(<ProgressBar progress={3} max={10} label="3 / 10" />);
    expect(getByText('3 / 10')).toBeTruthy();
  });

  it('handles zero progress', () => {
    const { root } = renderWithProvider(<ProgressBar progress={0} max={10} />);
    expect(root).toBeTruthy();
  });

  it('handles full progress', () => {
    const { root } = renderWithProvider(<ProgressBar progress={10} max={10} />);
    expect(root).toBeTruthy();
  });

  it('handles progress exceeding max', () => {
    const { root } = renderWithProvider(<ProgressBar progress={15} max={10} />);
    expect(root).toBeTruthy();
  });
});
