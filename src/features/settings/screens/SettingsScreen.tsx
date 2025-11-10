import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert, TextInput } from 'react-native';
import { Appbar, Dialog, Portal, Menu } from 'react-native-paper';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/shared/types';
import { SettingItem } from '../components/SettingItem';
import { Card, Typography, Spacer, Button } from '@/shared/ui';
import { useProgressStore } from '@/shared/store/progressStore';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { exportProgress, importProgress, applyImportedProgress } from '../utils/progressExport';

type Props = StackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const progressStore = useProgressStore();
  const settingsStore = useSettingsStore();

  // Local state for dialogs
  const [resetDialogVisible, setResetDialogVisible] = useState(false);
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const [importData, setImportData] = useState('');
  const [importPreview, setImportPreview] = useState<any>(null);
  const [themeMenuVisible, setThemeMenuVisible] = useState(false);

  // Get settings from store
  const theme = settingsStore.theme;
  const soundEnabled = settingsStore.soundEnabled;
  const hapticsEnabled = settingsStore.hapticsEnabled;

  const handleThemeChange = () => {
    setThemeMenuVisible(true);
  };

  const handleSoundToggle = (value: boolean | string) => {
    settingsStore.setSoundEnabled(value as boolean);
  };

  const handleHapticsToggle = (value: boolean | string) => {
    settingsStore.setHapticsEnabled(value as boolean);
  };

  const handleResetAllProgress = () => {
    setResetDialogVisible(true);
  };

  const confirmResetAllProgress = () => {
    progressStore.resetAllProgress();
    setResetDialogVisible(false);
    navigation.navigate('Home');
  };

  const handleExportProgress = async () => {
    const result = await exportProgress();
    if (result.success) {
      Alert.alert('Success', 'Progress exported successfully!');
    } else {
      Alert.alert('Error', result.error || 'Failed to export progress');
    }
  };

  const handleImportProgress = () => {
    setImportDialogVisible(true);
    setImportData('');
    setImportPreview(null);
  };

  const handleImportDataChange = async (text: string) => {
    setImportData(text);
    if (text.trim()) {
      const result = await importProgress(text);
      if (result.success && result.preview) {
        setImportPreview(result.preview);
      } else {
        setImportPreview(null);
      }
    }
  };

  const confirmImportProgress = () => {
    if (applyImportedProgress(importData)) {
      setImportDialogVisible(false);
      setImportData('');
      setImportPreview(null);
      Alert.alert('Success', 'Progress imported successfully!');
      navigation.navigate('Home');
    } else {
      Alert.alert('Error', 'Failed to import progress');
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Spacer size="md" />

        {/* Appearance Section */}
        <View style={styles.section}>
          <Typography variant="heading3">Appearance</Typography>
          <Spacer size="sm" />

          <Card elevation="low" style={styles.card}>
            <Menu
              visible={themeMenuVisible}
              onDismiss={() => setThemeMenuVisible(false)}
              anchor={
                <SettingItem
                  label="Theme"
                  type="select"
                  value={theme.charAt(0).toUpperCase() + theme.slice(1)}
                  onChange={handleThemeChange}
                  showDivider={false}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  settingsStore.setTheme('light');
                  setThemeMenuVisible(false);
                }}
                title="Light"
              />
              <Menu.Item
                onPress={() => {
                  settingsStore.setTheme('dark');
                  setThemeMenuVisible(false);
                }}
                title="Dark"
              />
              <Menu.Item
                onPress={() => {
                  settingsStore.setTheme('auto');
                  setThemeMenuVisible(false);
                }}
                title="Auto (System)"
              />
            </Menu>
          </Card>
        </View>

        <Spacer size="lg" />

        {/* Audio & Haptics Section */}
        <View style={styles.section}>
          <Typography variant="heading3">Audio & Haptics</Typography>
          <Spacer size="sm" />

          <Card elevation="low" style={styles.card}>
            <SettingItem
              label="Sound Effects"
              type="toggle"
              value={soundEnabled}
              onChange={handleSoundToggle}
              showDivider={Platform.OS !== 'web'}
            />

            {Platform.OS !== 'web' && (
              <SettingItem
                label="Haptic Feedback"
                type="toggle"
                value={hapticsEnabled}
                onChange={handleHapticsToggle}
                showDivider={false}
              />
            )}
          </Card>
        </View>

        <Spacer size="lg" />

        {/* Data Section */}
        <View style={styles.section}>
          <Typography variant="heading3">Data</Typography>
          <Spacer size="sm" />

          <Card elevation="low" style={styles.card}>
            <View style={styles.infoRow}>
              <Typography variant="body">Export Progress</Typography>
              <Button variant="text" onPress={handleExportProgress}>
                Export
              </Button>
            </View>
          </Card>

          <Spacer size="sm" />

          <Card elevation="low" style={styles.card}>
            <View style={styles.infoRow}>
              <Typography variant="body">Import Progress</Typography>
              <Button variant="text" onPress={handleImportProgress}>
                Import
              </Button>
            </View>
          </Card>

          <Spacer size="md" />

          <Card elevation="low" style={styles.card}>
            <View style={styles.dangerZone}>
              <Typography variant="body" style={styles.dangerTitle}>
                Danger Zone
              </Typography>
              <Spacer size="sm" />
              <Typography variant="caption" color="secondary">
                Resetting your progress will delete all saved data including word states, best
                scores, and statistics. This action cannot be undone.
              </Typography>
              <Spacer size="md" />
              <Button variant="text" onPress={handleResetAllProgress}>
                Reset All Progress
              </Button>
            </View>
          </Card>
        </View>

        <Spacer size="lg" />

        {/* About Section */}
        <View style={styles.section}>
          <Typography variant="heading3">About</Typography>
          <Spacer size="sm" />

          <Card elevation="low" style={styles.card}>
            <View style={styles.infoRow}>
              <Typography variant="body">Help & FAQ</Typography>
              <Button variant="text" onPress={() => navigation.navigate('Help')}>
                View
              </Button>
            </View>
          </Card>

          <Spacer size="sm" />

          <Card elevation="low" style={styles.card}>
            <View style={styles.infoRow}>
              <Typography variant="body">App Version</Typography>
              <Typography variant="body" color="secondary">
                2.0.0
              </Typography>
            </View>
          </Card>

          <Spacer size="sm" />

          <Card elevation="low" style={styles.card}>
            <SettingItem
              label="Privacy Policy"
              type="button"
              value=""
              onChange={() => console.log('Privacy policy tapped')}
              showDivider
            />
            <SettingItem
              label="Terms of Service"
              type="button"
              value=""
              onChange={() => console.log('Terms of service tapped')}
              showDivider
            />
            <SettingItem
              label="Reset Onboarding"
              type="button"
              value=""
              onChange={() => {
                settingsStore.setOnboardingCompleted(false);
                Alert.alert(
                  'Success',
                  'Onboarding has been reset. Restart the app to see it again.'
                );
              }}
              showDivider={false}
            />
          </Card>
        </View>

        <Spacer size="xl" />
      </ScrollView>

      {/* Reset Confirmation Dialog */}
      <Portal>
        <Dialog visible={resetDialogVisible} onDismiss={() => setResetDialogVisible(false)}>
          <Dialog.Title>Reset All Progress?</Dialog.Title>
          <Dialog.Content>
            <Typography variant="body">
              This will permanently delete all your learning progress, including:
            </Typography>
            <Spacer size="sm" />
            <Typography variant="body">• All word states across all lists</Typography>
            <Typography variant="body">• Best scores for all levels</Typography>
            <Typography variant="body">• All-time statistics</Typography>
            <Spacer size="sm" />
            <Typography variant="body" style={styles.warningText}>
              This action cannot be undone. Are you absolutely sure?
            </Typography>
          </Dialog.Content>
          <Dialog.Actions>
            <Button variant="text" onPress={() => setResetDialogVisible(false)}>
              Cancel
            </Button>
            <Button variant="text" onPress={confirmResetAllProgress}>
              Yes, Reset Everything
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Import Progress Dialog */}
        <Dialog visible={importDialogVisible} onDismiss={() => setImportDialogVisible(false)}>
          <Dialog.Title>Import Progress</Dialog.Title>
          <Dialog.Content>
            <Typography variant="body">Paste your exported progress data below:</Typography>
            <Spacer size="md" />
            <TextInput
              style={styles.importInput}
              multiline
              numberOfLines={6}
              placeholder='{"version": "1.0.0", ...}'
              value={importData}
              onChangeText={handleImportDataChange}
            />
            {importPreview && (
              <>
                <Spacer size="md" />
                <Typography variant="heading3">Preview:</Typography>
                <Spacer size="sm" />
                <Typography variant="body">Words Learned: {importPreview.wordsLearned}</Typography>
                <Typography variant="body">
                  Lists Completed: {importPreview.listsCompleted}
                </Typography>
                <Typography variant="caption" color="secondary">
                  Exported: {new Date(importPreview.exportDate).toLocaleDateString()}
                </Typography>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button variant="text" onPress={() => setImportDialogVisible(false)}>
              Cancel
            </Button>
            <Button variant="text" onPress={confirmImportProgress} disabled={!importPreview}>
              Import
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  section: {
    width: '100%',
  },
  card: {
    marginHorizontal: 0,
  },
  hint: {
    paddingHorizontal: 16,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  dangerZone: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
  },
  dangerTitle: {
    color: '#F44336',
    fontWeight: 'bold' as const,
  },
  warningText: {
    color: '#F44336',
    fontWeight: 'bold' as const,
  },
  importInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'monospace',
    fontSize: 12,
    minHeight: 150,
    textAlignVertical: 'top',
  },
});
