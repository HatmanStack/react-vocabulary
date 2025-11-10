import React from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { lightTheme, darkTheme } from '@/shared/lib/theme';
import { useSettingsStore } from '@/shared/store/settingsStore';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const systemColorScheme = useColorScheme();
  const theme = useSettingsStore((state) => state.theme);

  // Determine active theme based on settings
  const getActiveTheme = () => {
    if (theme === 'auto') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return theme === 'dark' ? darkTheme : lightTheme;
  };

  const activeTheme = getActiveTheme();

  return (
    <SafeAreaProvider>
      <PaperProvider theme={activeTheme}>{children}</PaperProvider>
    </SafeAreaProvider>
  );
}
