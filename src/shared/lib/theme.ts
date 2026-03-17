import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

// Extend Material Design 3 Light Theme
// Optimized for readability and accessibility (WCAG AA compliant)
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors
    primary: "#5E35B1", // Deep purple - softer than pure purple
    primaryContainer: "#EDE7F6", // Very light purple background
    onPrimary: "#FFFFFF", // White text on primary
    onPrimaryContainer: "#311B92", // Dark purple text on light purple bg

    // Secondary colors
    secondary: "#00897B", // Teal - professional and calming
    secondaryContainer: "#E0F2F1", // Very light teal
    onSecondary: "#FFFFFF",
    onSecondaryContainer: "#004D40",

    // Background & Surface
    background: "#FAFAFA", // Slightly off-white to reduce eye strain
    onBackground: "#1C1B1F", // Near-black for text
    surface: "#FFFFFF", // Pure white for cards/elevated surfaces
    surfaceVariant: "#F5F5F5", // Light gray for subtle elevation
    onSurface: "#1C1B1F",
    onSurfaceVariant: "#49454F",

    // Semantic colors
    error: "#BA1A1A",
    onError: "#FFFFFF",
    errorContainer: "#FFDAD6",
    onErrorContainer: "#410002",

    // Outline & Dividers
    outline: "#E0E0E0",
    outlineVariant: "#F5F5F5",

    // Elevation overlays
    elevation: {
      level0: "transparent",
      level1: "#FFFFFF",
      level2: "#FFFFFF", // Appbar uses level2
      level3: "#F5F5F5",
      level4: "#F2F2F2",
      level5: "#EEEEEE",
    },
  },
};

// Extend Material Design 3 Dark Theme
// Optimized for reduced eye strain and better readability in low light
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors - desaturated for comfort
    primary: "#B39DDB", // Softer purple, less saturated
    primaryContainer: "#4527A0", // Deep purple container
    onPrimary: "#1A0B35", // Dark text on bright purple
    onPrimaryContainer: "#E8DEF8", // Light purple text on dark purple bg

    // Secondary colors
    secondary: "#80CBC4", // Softer teal
    secondaryContainer: "#00695C", // Deep teal container
    onSecondary: "#003731",
    onSecondaryContainer: "#B2DFDB",

    // Background & Surface - using elevated dark theme for better depth
    background: "#1C1B1F", // Softer than pure black to reduce contrast
    onBackground: "#E6E1E5", // Soft white for text
    surface: "#272629", // Elevated base surface for better contrast
    surfaceVariant: "#2B2930", // Elevated surface
    onSurface: "#E6E1E5",
    onSurfaceVariant: "#CAC4D0",

    // Semantic colors
    error: "#F2B8B5",
    onError: "#601410",
    errorContainer: "#8C1D18",
    onErrorContainer: "#F9DEDC",

    // Outline & Dividers
    outline: "#3E3D42",
    outlineVariant: "#2B2930",

    // Elevation overlays - subtle gradations for depth
    elevation: {
      level0: "transparent",
      level1: "#232227",
      level2: "#272629", // Appbar uses level2
      level3: "#2B2A2E",
      level4: "#2E2D31",
      level5: "#323136",
    },
  },
};
