import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Extend Material Design 3 Light Theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    primaryContainer: '#bb86fc',
    secondary: '#03dac6',
    secondaryContainer: '#018786',
    background: '#ffffff',
    surface: '#ffffff',
    error: '#b00020',
  },
};

// Extend Material Design 3 Dark Theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
    primaryContainer: '#3700b3',
    secondary: '#03dac6',
    secondaryContainer: '#03dac6',
    background: '#121212',
    surface: '#121212',
    error: '#cf6679',
  },
};

// Default export for convenience
export default lightTheme;
