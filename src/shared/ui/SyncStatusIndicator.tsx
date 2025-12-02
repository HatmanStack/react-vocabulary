/**
 * SyncStatusIndicator Component
 *
 * A small visual indicator showing the current sync status.
 * Can be placed in headers, footers, or floating.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon, ActivityIndicator, useTheme, Tooltip } from 'react-native-paper';
import { useProgressStore, SyncStatus } from '@/shared/store/progressStore';

interface SyncStatusIndicatorProps {
  size?: number;
  showWhenIdle?: boolean;
}

export function SyncStatusIndicator({
  size = 20,
  showWhenIdle = false,
}: SyncStatusIndicatorProps) {
  const theme = useTheme();
  const username = useProgressStore((state) => state.username);
  const syncStatus = useProgressStore((state) => state.syncStatus);
  const lastSyncError = useProgressStore((state) => state.lastSyncError);

  // Don't show if not logged in
  if (!username) {
    return null;
  }

  // Don't show idle state unless explicitly requested
  if (syncStatus === 'idle' && !showWhenIdle) {
    return null;
  }

  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'syncing':
        return {
          icon: null,
          loading: true,
          color: theme.colors.primary,
          tooltip: 'Syncing...',
        };
      case 'success':
        return {
          icon: 'cloud-check',
          loading: false,
          color: '#4CAF50',
          tooltip: 'Synced',
        };
      case 'error':
        return {
          icon: 'cloud-alert',
          loading: false,
          color: theme.colors.error,
          tooltip: lastSyncError || 'Sync failed',
        };
      case 'idle':
      default:
        return {
          icon: 'cloud-outline',
          loading: false,
          color: theme.colors.onSurfaceVariant,
          tooltip: 'Cloud sync enabled',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={styles.container}>
      {config.loading ? (
        <ActivityIndicator size={size} color={config.color} />
      ) : (
        <Icon source={config.icon || 'cloud'} size={size} color={config.color} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
