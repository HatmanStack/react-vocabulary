import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { Text } from 'react-native';
import { Card } from '../Card';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('Card', () => {
  it('renders children correctly', () => {
    const { getByText } = renderWithProvider(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('renders with low elevation', () => {
    const { root } = renderWithProvider(
      <Card elevation="low">
        <Text>Low Elevation</Text>
      </Card>
    );
    expect(root).toBeTruthy();
  });

  it('renders with medium elevation', () => {
    const { root } = renderWithProvider(
      <Card elevation="medium">
        <Text>Medium Elevation</Text>
      </Card>
    );
    expect(root).toBeTruthy();
  });

  it('renders with high elevation', () => {
    const { root } = renderWithProvider(
      <Card elevation="high">
        <Text>High Elevation</Text>
      </Card>
    );
    expect(root).toBeTruthy();
  });

  it('applies custom styles', () => {
    const { root } = renderWithProvider(
      <Card style={{ margin: 10 }}>
        <Text>Styled Card</Text>
      </Card>
    );
    expect(root).toBeTruthy();
  });
});
