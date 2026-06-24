import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import { useTheme, ThemeColors } from '../../theme';
import {
  pantryToCsv,
  buildBackupJson,
  parseBackupItems,
} from '../../utils/exportData';

interface SettingsScreenProps {
  onSignOut?: () => void;
}

export default function SettingsScreen({ onSignOut }: SettingsScreenProps) {
  const {
    currentUser,
    currentHousehold,
    leaveHousehold,
    pantry,
    shoppingList,
    recipes,
    addGroceryItem,
  } = useMultiUserStore();
  const { colors, isDark, setMode } = useTheme();
  const styles = makeStyles(colors);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = React.useState(true);
  const [importVisible, setImportVisible] = React.useState(false);
  const [importText, setImportText] = React.useState('');

  // Load persisted app settings on mount
  React.useEffect(() => {
    AsyncStorage.getItem('app_settings').then(raw => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (typeof saved.notifications === 'boolean')
          setNotificationsEnabled(saved.notifications);
        if (typeof saved.autoSync === 'boolean')
          setAutoSyncEnabled(saved.autoSync);
      } catch {
        // ignore malformed settings
      }
    });
  }, []);

  const persistSettings = (patch: {
    notifications?: boolean;
    autoSync?: boolean;
  }) => {
    const next = {
      notifications: notificationsEnabled,
      autoSync: autoSyncEnabled,
      ...patch,
    };
    AsyncStorage.setItem('app_settings', JSON.stringify(next)).catch(
      () => undefined
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          onSignOut?.();
        },
      },
    ]);
  };

  const handleLeaveHousehold = () => {
    Alert.alert(
      'Leave Household',
      'Are you sure you want to leave this household? You will lose access to shared items.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            await leaveHousehold();
            Alert.alert('Success', 'You have left the household');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Choose a format to export and share.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pantry CSV',
        onPress: () =>
          Share.share({
            title: 'PantryPal Export',
            message: pantryToCsv(pantry),
          }).catch(() => undefined),
      },
      {
        text: 'Full Backup (JSON)',
        onPress: () =>
          Share.share({
            title: 'PantryPal Backup',
            message: buildBackupJson({ pantry, shoppingList, recipes }),
          }).catch(() => undefined),
      },
    ]);
  };

  const handleImportData = () => {
    setImportText('');
    setImportVisible(true);
  };

  const handleRunImport = async () => {
    try {
      const items = parseBackupItems(importText);
      if (items.length === 0) {
        Alert.alert('Import', 'No valid pantry items found in that data.');
        return;
      }
      for (const item of items) {
        await addGroceryItem(item);
      }
      setImportVisible(false);
      setImportText('');
      Alert.alert(
        'Import complete',
        `Added ${items.length} item${items.length !== 1 ? 's' : ''} to your pantry.`
      );
    } catch (error) {
      Alert.alert(
        'Import failed',
        'Could not parse that data. Paste a valid PantryPal JSON export.'
      );
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'All data has been cleared');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Settings'
        subtitle='Manage your preferences'
        gradient='twilight'
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <PantryCard variant='elevated' padding='lg'>
          <Text style={styles.sectionTitle}>👤 Profile</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {currentUser?.name || 'User'}
            </Text>
            <Text style={styles.profileEmail}>
              {currentUser?.email || 'user@example.com'}
            </Text>
            {currentHousehold && (
              <Text style={styles.householdName}>{currentHousehold.name}</Text>
            )}
          </View>
        </PantryCard>

        {/* App Settings */}
        <PantryCard variant='fresh' padding='lg'>
          <Text style={styles.sectionTitle}>⚙️ App Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingSubtitle}>
                Get notified about expiring items and updates
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={value => {
                setNotificationsEnabled(value);
                persistSettings({ notifications: value });
              }}
              trackColor={{
                false: colors.neutral[300],
                true: colors.primary[300],
              }}
              thumbColor={
                notificationsEnabled ? colors.primary[500] : colors.neutral[400]
              }
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingSubtitle}>Switch to dark theme</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={value => setMode(value ? 'dark' : 'light')}
              trackColor={{
                false: colors.neutral[300],
                true: colors.primary[300],
              }}
              thumbColor={isDark ? colors.primary[500] : colors.neutral[400]}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Auto Sync</Text>
              <Text style={styles.settingSubtitle}>
                Automatically sync data across devices
              </Text>
            </View>
            <Switch
              value={autoSyncEnabled}
              onValueChange={value => {
                setAutoSyncEnabled(value);
                persistSettings({ autoSync: value });
              }}
              trackColor={{
                false: colors.neutral[300],
                true: colors.primary[300],
              }}
              thumbColor={
                autoSyncEnabled ? colors.primary[500] : colors.neutral[400]
              }
            />
          </View>
        </PantryCard>

        {/* Data Management */}
        <PantryCard variant='warm' padding='lg'>
          <Text style={styles.sectionTitle}>📊 Data Management</Text>

          <PantryButton
            title='Export Data'
            onPress={handleExportData}
            variant='outline'
            size='md'
            icon='📤'
            fullWidth
          />

          <PantryButton
            title='Import Data'
            onPress={handleImportData}
            variant='outline'
            size='md'
            icon='📥'
            fullWidth
          />

          <PantryButton
            title='Clear All Data'
            onPress={handleClearData}
            variant='error'
            size='md'
            icon='🗑️'
            fullWidth
          />
        </PantryCard>

        {/* Household Management */}
        {currentHousehold && (
          <PantryCard variant='outlined' padding='lg'>
            <Text style={styles.sectionTitle}>🏠 Household</Text>
            <Text style={styles.householdDescription}>
              You are currently part of the &quot;{currentHousehold.name}&quot;
              household.
            </Text>

            <PantryButton
              title='Leave Household'
              onPress={handleLeaveHousehold}
              variant='warning'
              size='md'
              icon='🚪'
              fullWidth
            />
          </PantryCard>
        )}

        {/* Account Actions */}
        <PantryCard variant='default' padding='lg'>
          <Text style={styles.sectionTitle}>🔐 Account</Text>

          <PantryButton
            title='Sign Out'
            onPress={handleSignOut}
            variant='outline'
            size='md'
            icon='🚪'
            fullWidth
          />
        </PantryCard>

        {/* App Info */}
        <PantryCard variant='outlined' padding='lg'>
          <Text style={styles.sectionTitle}>ℹ️ App Info</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>2024.1.1</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Developer</Text>
            <Text style={styles.infoValue}>PantryPal Team</Text>
          </View>
        </PantryCard>
      </ScrollView>

      {/* Import Data Modal */}
      <Modal
        visible={importVisible}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <View style={styles.importModalContainer}>
          <PantryHeader
            title='Import Data'
            subtitle='Paste a PantryPal JSON export'
            gradient='twilight'
            showBackButton
            onBackPress={() => setImportVisible(false)}
          />
          <View style={styles.importContent}>
            <PantryCard variant='elevated' padding='lg'>
              <Text style={styles.importHint}>
                Paste a JSON export (or an array of items). Each item is added
                to your pantry.
              </Text>
              <TextInput
                style={styles.importInput}
                placeholder='{ "pantry": [ ... ] }'
                value={importText}
                onChangeText={setImportText}
                multiline
                placeholderTextColor={colors.neutral[400]}
              />
              <View style={styles.importActions}>
                <PantryButton
                  title='Cancel'
                  onPress={() => setImportVisible(false)}
                  variant='outline'
                  size='md'
                />
                <PantryButton
                  title='Import'
                  onPress={handleRunImport}
                  variant='primary'
                  size='md'
                />
              </View>
            </PantryCard>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.neutral[50],
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    householdDescription: {
      ...typography.bodySmall,
      color: colors.neutral[600],
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    householdName: {
      ...typography.bodySmall,
      color: colors.primary[600],
      fontWeight: '600',
    },
    importActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    importContent: {
      flex: 1,
      padding: spacing.md,
    },
    importHint: {
      ...typography.bodySmall,
      color: colors.neutral[600],
      marginBottom: spacing.sm,
    },
    importInput: {
      backgroundColor: colors.neutral[100],
      borderColor: colors.neutral[200],
      borderRadius: borderRadius.input,
      borderWidth: 1,
      color: colors.neutral[900],
      fontSize: 14,
      height: 180,
      padding: spacing.md,
      textAlignVertical: 'top',
    },
    importModalContainer: {
      backgroundColor: colors.neutral[50],
      flex: 1,
    },
    infoItem: {
      alignItems: 'center',
      borderBottomColor: colors.neutral[100],
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    infoLabel: {
      ...typography.body,
      color: colors.neutral[700],
    },
    infoValue: {
      ...typography.body,
      color: colors.neutral[600],
      fontWeight: '500',
    },
    profileEmail: {
      ...typography.bodySmall,
      color: colors.neutral[600],
      marginBottom: spacing.xs,
    },
    profileInfo: {
      alignItems: 'center',
    },
    profileName: {
      ...typography.h3,
      color: colors.neutral[800],
      marginBottom: spacing.xs,
    },
    sectionTitle: {
      ...typography.h4,
      color: colors.neutral[800],
      marginBottom: spacing.md,
    },
    settingContent: {
      flex: 1,
      marginRight: spacing.md,
    },
    settingItem: {
      alignItems: 'center',
      borderBottomColor: colors.neutral[100],
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    settingSubtitle: {
      ...typography.bodySmall,
      color: colors.neutral[600],
    },
    settingTitle: {
      ...typography.body,
      color: colors.neutral[800],
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
  });
