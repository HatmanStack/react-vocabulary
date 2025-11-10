import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { LoadingIndicator } from '../LoadingIndicator';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('LoadingIndicator', () => {
  it('renders without crashing', () => {
    const { root } = renderWithProvider(<LoadingIndicator />);
    expect(root).toBeTruthy();
  });

  it('displays text when provided', () => {
    const { getByText } = renderWithProvider(<LoadingIndicator text="Loading..." />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders with overlay', () => {
    const { root } = renderWithProvider(<LoadingIndicator overlay />);
    expect(root).toBeTruthy();
  });

  it('renders with custom size', () => {
    const { root } = renderWithProvider(<LoadingIndicator size="small" />);
    expect(root).toBeTruthy();
  });
});
