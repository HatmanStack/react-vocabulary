import { Stack } from 'expo-router';
import { useColorScheme, AppState, AppStateStatus } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { lightTheme, darkTheme } from '@/shared/lib/theme';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useProgressStore } from '@/shared/store/progressStore';
import { initializeStorage } from '@/shared/lib/storage';

// Minimum time between app resume syncs (5 minutes)
const SYNC_THROTTLE_MS = 5 * 60 * 1000;

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const systemColorScheme = useColorScheme();
  const theme = useSettingsStore((state) => state.theme);
  const lastSyncTimeRef = useRef<number>(0);

  console.log('[RootLayout] Component mounted');

  // Initialize app
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

        // Attempt initial sync if user is logged in
        const progressStore = useProgressStore.getState();
        if (progressStore.username) {
          console.log('[RootLayout] User logged in, triggering initial sync');
          progressStore.syncFromCloud();
          lastSyncTimeRef.current = Date.now();
        }
      } catch (error) {
        console.error('[RootLayout] Failed to initialize app:', error);
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  // App state change handler for background->foreground sync
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const progressStore = useProgressStore.getState();

        // Only sync if:
        // 1. User is logged in
        // 2. Not currently syncing
        // 3. Enough time has passed since last sync
        if (
          progressStore.username &&
          progressStore.syncStatus !== 'syncing' &&
          Date.now() - lastSyncTimeRef.current > SYNC_THROTTLE_MS
        ) {
          console.log('[RootLayout] App resumed, triggering sync');
          progressStore.fullSync();
          lastSyncTimeRef.current = Date.now();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
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
