import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Share,
} from 'react-native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import { authService } from '../../services/authService';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  colors,
  typography,
  spacing,
} from '../../utils/designSystem';

interface SettingsScreenProps {
  onSignOut?: () => void;
}

export default function SettingsScreen({ onSignOut }: SettingsScreenProps) {
  const {
    currentUser,
    currentHousehold,
    pantry,
    shoppingList,
    preferences,
    leaveHousehold,
    updatePreferences,
    resetStore,
  } = useMultiUserStore();

  useEffect(() => {
    // Preferences loaded from store (synced from DB on init)
  }, [preferences]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.signOut();
            resetStore();
            onSignOut?.();
          } catch {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
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

  const handleExportData = async () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: currentUser,
        household: currentHousehold,
        pantry,
        shoppingList,
        preferences,
      };
      await Share.share({
        message: JSON.stringify(exportData, null, 2),
        title: 'PantryPal Data Export',
      });
    } catch {
      Alert.alert('Error', 'Failed to export data.');
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    await updatePreferences({
      notifications: {
        ...preferences.notifications,
        expirationReminders: value,
        lowStockAlerts: value,
        householdUpdates: value,
      },
    });
  };

  const handleLowStockThresholdChange = async (increase: boolean) => {
    const next = increase
      ? preferences.lowStockThreshold + 1
      : Math.max(0, preferences.lowStockThreshold - 1);
    await updatePreferences({ lowStockThreshold: next });
  };

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Settings'
        subtitle='Manage your preferences'
        gradient='twilight'
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        <PantryCard variant='fresh' padding='lg'>
          <Text style={styles.sectionTitle}>⚙️ Pantry Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingSubtitle}>
                Expiration reminders, low stock, household updates
              </Text>
            </View>
            <Switch
              value={preferences.notifications.expirationReminders}
              onValueChange={handleNotificationToggle}
              trackColor={{
                false: colors.neutral[300],
                true: colors.primary[300],
              }}
              thumbColor={
                preferences.notifications.expirationReminders
                  ? colors.primary[500]
                  : colors.neutral[400]
              }
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Low Stock Threshold</Text>
              <Text style={styles.settingSubtitle}>
                Alert when quantity is at or below {preferences.lowStockThreshold}
              </Text>
            </View>
            <View style={styles.thresholdControls}>
              <PantryButton
                title='-'
                onPress={() => handleLowStockThresholdChange(false)}
                variant='outline'
                size='sm'
              />
              <Text style={styles.thresholdValue}>
                {preferences.lowStockThreshold}
              </Text>
              <PantryButton
                title='+'
                onPress={() => handleLowStockThresholdChange(true)}
                variant='outline'
                size='sm'
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Expiration Reminder</Text>
              <Text style={styles.settingSubtitle}>
                Warn {preferences.expirationReminderDays} days before expiry
              </Text>
            </View>
          </View>
        </PantryCard>

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
        </PantryCard>

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

        <PantryCard variant='outlined' padding='lg'>
          <Text style={styles.sectionTitle}>ℹ️ App Info</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
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
  thresholdControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thresholdValue: {
    ...typography.body,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
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
