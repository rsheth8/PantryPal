import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Share,
  TouchableOpacity,
} from 'react-native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import { FadeSlideIn, useToast } from '../../components/ui';
import { Theme, ThemeMode } from '../../theme/themes';
import { useThemedStyles, useTheme } from '../../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import { haptics } from '../../utils/haptics';
import { logger } from '../../utils/logger';

interface SettingsScreenProps {
  onSignOut?: () => void;
}

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: string }[] = [
  { key: 'light', label: 'Light', icon: '☀️' },
  { key: 'dark', label: 'Dark', icon: '🌙' },
  { key: 'system', label: 'Auto', icon: '📱' },
];

export default function SettingsScreen({ onSignOut }: SettingsScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { theme, mode, setMode } = useTheme();
  const { showToast } = useToast();
  const {
    currentUser,
    currentHousehold,
    leaveHousehold,
    preferences,
    updatePreferences,
    pantry,
    recipes,
    shoppingList,
  } = useMultiUserStore();

  const setNotificationPref = (
    key: keyof typeof preferences.notifications,
    value: boolean
  ) => {
    haptics.selection();
    updatePreferences({
      notifications: { ...preferences.notifications, [key]: value },
    });
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => onSignOut?.(),
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
            showToast('You left the household', { type: 'info' });
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        user: currentUser?.email,
        pantry: pantry.map(({ id: _id, ...item }) => item),
        shoppingList: shoppingList.map(({ id: _id, ...item }) => item),
        recipes: recipes.map(({ id: _id, ...recipe }) => recipe),
      };
      await Share.share({
        title: 'PantryPal data export',
        message: JSON.stringify(payload, null, 2),
      });
    } catch (error) {
      logger.warn('Export failed:', error);
      showToast('Export cancelled', { type: 'info' });
    }
  };

  const adjustReminderDays = (delta: number) => {
    const next = Math.min(
      14,
      Math.max(1, preferences.expirationReminderDays + delta)
    );
    haptics.selection();
    updatePreferences({ expirationReminderDays: next });
  };

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Settings'
        subtitle='Make PantryPal yours'
        gradient='twilight'
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <FadeSlideIn>
          <PantryCard variant='elevated' padding='lg'>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {currentUser?.name || 'User'}
                </Text>
                <Text style={styles.profileEmail}>
                  {currentUser?.email || ''}
                </Text>
                {currentHousehold && (
                  <Text style={styles.householdName}>
                    🏠 {currentHousehold.name}
                  </Text>
                )}
              </View>
            </View>
          </PantryCard>
        </FadeSlideIn>

        {/* Appearance */}
        <FadeSlideIn delay={80}>
          <PantryCard variant='fresh' padding='lg'>
            <Text style={styles.sectionTitle}>🎨 Appearance</Text>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.themeOption,
                    mode === option.key && styles.themeOptionActive,
                  ]}
                  onPress={() => {
                    haptics.selection();
                    setMode(option.key);
                  }}
                  accessibilityRole='button'
                  accessibilityState={{ selected: mode === option.key }}
                >
                  <Text style={styles.themeOptionIcon}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.themeOptionLabel,
                      mode === option.key && styles.themeOptionLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </PantryCard>
        </FadeSlideIn>

        {/* Notifications */}
        <FadeSlideIn delay={140}>
          <PantryCard variant='default' padding='lg'>
            <Text style={styles.sectionTitle}>🔔 Notifications</Text>

            {(
              [
                {
                  key: 'expirationReminders',
                  title: 'Expiration reminders',
                  subtitle: 'Alerts before food goes bad',
                },
                {
                  key: 'lowStockAlerts',
                  title: 'Low stock alerts',
                  subtitle: 'Know when staples run out',
                },
                {
                  key: 'householdUpdates',
                  title: 'Household updates',
                  subtitle: 'Activity from household members',
                },
              ] as const
            ).map(setting => (
              <View key={setting.key} style={styles.settingItem}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
                </View>
                <Switch
                  value={preferences.notifications[setting.key]}
                  onValueChange={value =>
                    setNotificationPref(setting.key, value)
                  }
                  trackColor={{
                    false: theme.colors.surfaceMuted,
                    true: theme.palette.primary[300],
                  }}
                  thumbColor={
                    preferences.notifications[setting.key]
                      ? theme.palette.primary[600]
                      : theme.colors.borderStrong
                  }
                />
              </View>
            ))}

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Remind me before expiry</Text>
                <Text style={styles.settingSubtitle}>
                  Days ahead to warn about expiring food
                </Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => adjustReminderDays(-1)}
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>
                  {preferences.expirationReminderDays}d
                </Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => adjustReminderDays(1)}
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </PantryCard>
        </FadeSlideIn>

        {/* Sharing defaults */}
        <FadeSlideIn delay={200}>
          <PantryCard variant='warm' padding='lg'>
            <Text style={styles.sectionTitle}>👥 Sharing</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Share new items</Text>
                <Text style={styles.settingSubtitle}>
                  New pantry items are visible to your household by default
                </Text>
              </View>
              <Switch
                value={preferences.defaultItemVisibility === 'shared'}
                onValueChange={value =>
                  updatePreferences({
                    defaultItemVisibility: value ? 'shared' : 'private',
                  })
                }
                trackColor={{
                  false: theme.colors.surfaceMuted,
                  true: theme.palette.primary[300],
                }}
                thumbColor={
                  preferences.defaultItemVisibility === 'shared'
                    ? theme.palette.primary[600]
                    : theme.colors.borderStrong
                }
              />
            </View>
          </PantryCard>
        </FadeSlideIn>

        {/* Data */}
        <FadeSlideIn delay={260}>
          <PantryCard variant='default' padding='lg'>
            <Text style={styles.sectionTitle}>📦 Your Data</Text>
            <PantryButton
              title='Export my data'
              onPress={handleExportData}
              variant='outline'
              size='md'
              icon='📤'
              fullWidth
            />
          </PantryCard>
        </FadeSlideIn>

        {/* Household */}
        {currentHousehold && (
          <FadeSlideIn delay={300}>
            <PantryCard variant='outlined' padding='lg'>
              <Text style={styles.sectionTitle}>🏠 Household</Text>
              <Text style={styles.householdDescription}>
                You are part of &quot;{currentHousehold.name}&quot;. Invite
                code: {currentHousehold.code}
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
          </FadeSlideIn>
        )}

        {/* Account */}
        <FadeSlideIn delay={340}>
          <PantryCard variant='default' padding='lg'>
            <Text style={styles.sectionTitle}>🔐 Account</Text>
            <PantryButton
              title='Sign Out'
              onPress={handleSignOut}
              variant='outline'
              size='md'
              icon='👋'
              fullWidth
            />
          </PantryCard>
        </FadeSlideIn>

        {/* Info */}
        <FadeSlideIn delay={380}>
          <PantryCard variant='outlined' padding='lg' style={styles.lastCard}>
            <Text style={styles.sectionTitle}>ℹ️ About</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Made with</Text>
              <Text style={styles.infoValue}>❤️ + 🥫</Text>
            </View>
          </PantryCard>
        </FadeSlideIn>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    avatar: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 28,
      height: 56,
      justifyContent: 'center',
      marginRight: spacing.md,
      width: 56,
    },
    avatarText: {
      ...typography.h3,
      color: theme.colors.primary,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    householdDescription: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
      marginBottom: spacing.md,
    },
    householdName: {
      ...typography.bodySmall,
      color: theme.colors.primary,
      fontWeight: '600',
      marginTop: 2,
    },
    infoItem: {
      alignItems: 'center',
      borderBottomColor: theme.colors.divider,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    infoLabel: {
      ...typography.body,
      color: theme.colors.textSecondary,
    },
    infoValue: {
      ...typography.body,
      color: theme.colors.textMuted,
      fontWeight: '500',
    },
    lastCard: {
      marginBottom: spacing.xxl,
    },
    profileEmail: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      ...typography.h4,
      color: theme.colors.text,
    },
    profileRow: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    sectionTitle: {
      ...typography.h4,
      color: theme.colors.text,
      marginBottom: spacing.md,
    },
    settingContent: {
      flex: 1,
      marginRight: spacing.md,
    },
    settingItem: {
      alignItems: 'center',
      borderBottomColor: theme.colors.divider,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    settingSubtitle: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
    },
    settingTitle: {
      ...typography.body,
      color: theme.colors.text,
      fontWeight: '600',
      marginBottom: 2,
    },
    stepper: {
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundSubtle,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.pill,
      borderWidth: 1,
      flexDirection: 'row',
    },
    stepperButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 32,
      width: 32,
    },
    stepperButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 17,
      fontWeight: '600',
    },
    stepperValue: {
      ...typography.bodySmall,
      color: theme.colors.primary,
      fontWeight: '700',
      minWidth: 32,
      textAlign: 'center',
    },
    themeOption: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.md,
      borderWidth: 1.5,
      flex: 1,
      paddingVertical: spacing.sm + 2,
    },
    themeOptionActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    themeOptionIcon: {
      fontSize: 20,
      marginBottom: 2,
    },
    themeOptionLabel: {
      ...typography.caption,
      color: theme.colors.textMuted,
      fontWeight: '600',
    },
    themeOptionLabelActive: {
      color: theme.colors.primary,
    },
    themeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  });
