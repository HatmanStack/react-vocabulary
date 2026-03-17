import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { useColorScheme, AppState, AppStateStatus } from 'react-native';
import { PaperProvider, Snackbar } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { lightTheme, darkTheme } from '@/shared/lib/theme';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { useEffect, useState, useRef, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useProgressStore } from '@/shared/store/progressStore';
import { ErrorBoundary } from '@/shared/ui';

// Minimum time between app resume syncs (5 minutes)
const SYNC_THROTTLE_MS = 5 * 60 * 1000;

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const systemColorScheme = useColorScheme();
  const theme = useSettingsStore((state) => state.theme);
  const syncStatus = useProgressStore((state) => state.syncStatus);
  const lastSyncError = useProgressStore((state) => state.lastSyncError);
  const lastSyncTimeRef = useRef<number>(0);
  const previousSyncStatusRef = useRef(syncStatus);

  // Show snackbar when sync error occurs
  useEffect(() => {
    if (
      syncStatus === 'error' &&
      previousSyncStatusRef.current !== 'error' &&
      lastSyncError
    ) {
      setSnackbarMessage(lastSyncError);
      setSnackbarVisible(true);
    }
    previousSyncStatusRef.current = syncStatus;
  }, [syncStatus, lastSyncError]);

  const handleDismissSnackbar = useCallback(() => {
    setSnackbarVisible(false);
  }, []);

  const handleRetrySync = useCallback(() => {
    setSnackbarVisible(false);
    useProgressStore.getState().fullSync();
  }, []);

  // Initialize app
  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([
          useProgressStore.getState().loadFromStorage(),
          useSettingsStore.getState().loadFromStorage(),
        ]);
        setIsReady(true);

        // Attempt initial sync if user is logged in
        const progressStore = useProgressStore.getState();
        if (progressStore.username) {
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

  if (!isReady) {
    const loadingTheme = getActiveTheme();
    return (
      <View style={[styles.loadingContainer, { backgroundColor: loadingTheme.colors.background }]}>
        <ActivityIndicator size="large" color={loadingTheme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={activeTheme}>
        <Head>
          <title>Vocabulary Learning App - Master 360+ Words with Interactive Quizzes</title>
          <meta name="description" content="Build your vocabulary with 360+ words across 18 themed lists. Interactive quizzes, progress tracking, achievements, and cloud sync. Free vocabulary builder for all ages." />
          <link rel="canonical" href="https://vocabulary.hatstack.fun" />
        </Head>
        <ErrorBoundary>
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
          <Snackbar
            visible={snackbarVisible}
            onDismiss={handleDismissSnackbar}
            duration={5000}
            action={{
              label: 'Retry',
              onPress: handleRetrySync,
            }}
          >
            {snackbarMessage}
          </Snackbar>
        </ErrorBoundary>
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
