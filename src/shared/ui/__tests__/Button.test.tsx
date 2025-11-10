import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { Button } from '../Button';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PaperProvider>{component}</PaperProvider>);
};

describe('Button', () => {
  it('renders children correctly', () => {
    const { getByText } = renderWithProvider(<Button onPress={jest.fn()}>Test Button</Button>);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = renderWithProvider(<Button onPress={onPressMock}>Press Me</Button>);

    fireEvent.press(getByText('Press Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = renderWithProvider(
      <Button onPress={onPressMock} disabled>
        Disabled
      </Button>
    );

    fireEvent.press(getByText('Disabled'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPressMock = jest.fn();
    const { getByText } = renderWithProvider(
      <Button onPress={onPressMock} loading>
        Loading
      </Button>
    );

    fireEvent.press(getByText('Loading'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('renders with primary variant', () => {
    const { getByText } = renderWithProvider(
      <Button variant="primary" onPress={jest.fn()}>
        Primary
      </Button>
    );
    expect(getByText('Primary')).toBeTruthy();
  });

  it('renders with secondary variant', () => {
    const { getByText } = renderWithProvider(
      <Button variant="secondary" onPress={jest.fn()}>
        Secondary
      </Button>
    );
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('renders with text variant', () => {
    const { getByText } = renderWithProvider(
      <Button variant="text" onPress={jest.fn()}>
        Text
      </Button>
    );
    expect(getByText('Text')).toBeTruthy();
  });
});
