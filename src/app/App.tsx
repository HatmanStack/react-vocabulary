import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Providers from './providers';
import Navigation from './navigation';
import { useProgressStore } from '@/shared/store/progressStore';
import { initializeStorage } from '@/shared/lib/storage';

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const hydrated = useProgressStore((state) => state._hydrated);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize storage and wait for progress store to hydrate
        await initializeStorage();

        // Wait a bit to ensure Zustand persist has time to hydrate
        await new Promise((resolve) => setTimeout(resolve, 100));

        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsReady(true); // Continue anyway
      }
    }

    prepare();
  }, []);

  // Show loading indicator while waiting for hydration
  if (!isReady || !hydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return <Navigation />;
}

export default function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});
