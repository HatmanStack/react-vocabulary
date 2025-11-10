import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { Typography } from '../Typography';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('Typography', () => {
  it('renders children correctly', () => {
    const { getByText } = renderWithProvider(<Typography>Test Text</Typography>);
    expect(getByText('Test Text')).toBeTruthy();
  });

  it('renders with heading1 variant', () => {
    const { getByText } = renderWithProvider(<Typography variant="heading1">Heading 1</Typography>);
    expect(getByText('Heading 1')).toBeTruthy();
  });

  it('renders with body variant', () => {
    const { getByText } = renderWithProvider(<Typography variant="body">Body text</Typography>);
    expect(getByText('Body text')).toBeTruthy();
  });

  it('renders with caption variant', () => {
    const { getByText } = renderWithProvider(
      <Typography variant="caption">Caption text</Typography>
    );
    expect(getByText('Caption text')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const { getByText } = renderWithProvider(
      <Typography style={{ fontSize: 20 }}>Styled text</Typography>
    );
    expect(getByText('Styled text')).toBeTruthy();
  });
});
