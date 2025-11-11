import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { lightTheme, darkTheme } from '@/shared/lib/theme';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useProgressStore } from '@/shared/store/progressStore';
import { initializeStorage } from '@/shared/lib/storage';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const systemColorScheme = useColorScheme();
  const theme = useSettingsStore((state) => state.theme);

  console.log('[RootLayout] Component mounted');

  useEffect(() => {
    console.log('[RootLayout] useEffect running');
    async function prepare() {
      try {
        console.log('[RootLayout] Initializing storage...');
        await initializeStorage();
        console.log('[RootLayout] Loading progress from storage...');
        await useProgressStore.getState().loadFromStorage();
        console.log('[RootLayout] Progress loaded, setting isReady to true');
        setIsReady(true);
      } catch (error) {
        console.error('[RootLayout] Failed to initialize app:', error);
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  const getActiveTheme = () => {
    if (theme === 'auto') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return theme === 'dark' ? darkTheme : lightTheme;
  };

  const activeTheme = getActiveTheme();

  console.log('[RootLayout] isReady:', isReady, 'theme:', theme);

  if (!isReady) {
    console.log('[RootLayout] Showing loading screen');
    const loadingTheme = getActiveTheme();
    return (
      <View style={[styles.loadingContainer, { backgroundColor: loadingTheme.colors.background }]}>
        <ActivityIndicator size="large" color={loadingTheme.colors.primary} />
      </View>
    );
  }

  console.log('[RootLayout] Rendering app with Stack navigator');

  return (
    <SafeAreaProvider>
      <PaperProvider theme={activeTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="home" />
          <Stack.Screen name="difficulty" />
          <Stack.Screen name="quiz" />
          <Stack.Screen
            name="graduation"
            options={{
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="stats"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="help"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
