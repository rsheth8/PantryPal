import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../utils/designSystem';

export default function SettingsScreen() {
  const { currentUser, currentHousehold, leaveHousehold } = useMultiUserStore();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = React.useState(true);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          // Handle sign out
          Alert.alert('Success', 'You have been signed out');
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
    Alert.alert('Export Data', 'Export functionality coming soon!');
  };

  const handleImportData = () => {
    Alert.alert('Import Data', 'Import functionality coming soon!');
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
              onValueChange={setNotificationsEnabled}
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
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{
                false: colors.neutral[300],
                true: colors.primary[300],
              }}
              thumbColor={
                darkModeEnabled ? colors.primary[500] : colors.neutral[400]
              }
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
              onValueChange={setAutoSyncEnabled}
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
              You are currently part of the "{currentHousehold.name}" household.
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    ...typography.h3,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  householdName: {
    ...typography.bodySmall,
    color: colors.primary[600],
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  settingSubtitle: {
    ...typography.bodySmall,
    color: colors.neutral[600],
  },
  householdDescription: {
    ...typography.bodySmall,
    color: colors.neutral[600],
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
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
});
