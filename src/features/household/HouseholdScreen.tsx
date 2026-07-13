import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Modal,
  Share,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import { FadeSlideIn, Confetti, useToast } from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles, useTheme } from '../../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import { haptics } from '../../utils/haptics';
import { logger } from '../../utils/logger';

export default function HouseholdScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const { showToast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const {
    currentUser,
    currentHousehold,
    users,
    pantry,
    leaveHousehold,
    updateUserProfile,
    createHousehold,
    joinHousehold,
    updateHouseholdSettings,
  } = useMultiUserStore();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [creating, setCreating] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const hasHousehold = Boolean(currentHousehold);
  const isOwner = currentHousehold?.owner_id === currentUser?.id;

  const handleLeaveHousehold = () => {
    Alert.alert(
      'Leave Household',
      'Are you sure? You will lose access to shared items.',
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

  const handleUpdateProfile = async () => {
    if (!profileName.trim()) {
      showToast('Name is required', { type: 'warning' });
      return;
    }
    try {
      await updateUserProfile({ name: profileName.trim() });
      setIsEditingProfile(false);
      showToast('Profile updated', { type: 'success' });
    } catch {
      showToast('Failed to update profile', { type: 'error' });
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      showToast('Enter the 6-character household code', { type: 'warning' });
      return;
    }
    setJoining(true);
    try {
      const success = await joinHousehold(code);
      if (success) {
        setShowJoinModal(false);
        setJoinCode('');
        setCelebrate(true);
        haptics.success();
        showToast('Welcome to the household! 🎉', { type: 'success' });
      } else {
        showToast('No household found with that code', { type: 'error' });
      }
    } catch {
      showToast('Could not join — try again', { type: 'error' });
    } finally {
      setJoining(false);
    }
  };

  const handleCreate = async () => {
    const name = newHouseholdName.trim();
    if (!name) {
      showToast('Give your household a name', { type: 'warning' });
      return;
    }
    setCreating(true);
    try {
      const household = await createHousehold(name);
      setShowCreateModal(false);
      setNewHouseholdName('');
      setCelebrate(true);
      haptics.success();
      showToast(`"${household.name}" created — share code ${household.code}`, {
        type: 'success',
        duration: 5000,
      });
    } catch {
      showToast('Could not create household — try again', { type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!currentHousehold) return;
    try {
      await Share.share({
        message: `Join my "${currentHousehold.name}" household on PantryPal! 🥫\n\nUse invite code: ${currentHousehold.code}`,
      });
    } catch (error) {
      logger.warn('Share cancelled:', error);
    }
  };

  const handleTogglePrivateItems = (value: boolean) => {
    if (!currentHousehold) return;
    haptics.selection();
    updateHouseholdSettings(currentHousehold.id, {
      settings: {
        ...currentHousehold.settings,
        allow_private_items: value,
        allowPrivateItems: value,
      },
    });
  };

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Household'
        subtitle={
          hasHousehold
            ? currentHousehold?.name
            : 'Better together — share your pantry'
        }
        gradient='dawn'
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <FadeSlideIn>
          <PantryCard variant='elevated' padding='lg'>
            <Text style={styles.sectionTitle}>👤 Your Profile</Text>
            <View style={styles.profileCard}>
              {currentUser?.avatar ? (
                <Image
                  source={{ uri: currentUser.avatar }}
                  style={styles.profileAvatar}
                />
              ) : (
                <View style={styles.profileAvatarFallback}>
                  <Text style={styles.profileAvatarText}>
                    {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{currentUser?.name}</Text>
                <Text style={styles.profileEmail}>{currentUser?.email}</Text>
              </View>
              <PantryButton
                title='Edit'
                onPress={() => {
                  setProfileName(currentUser?.name || '');
                  setIsEditingProfile(true);
                }}
                variant='outline'
                size='sm'
              />
            </View>
          </PantryCard>
        </FadeSlideIn>

        {/* Household status */}
        <FadeSlideIn delay={80}>
          {hasHousehold && currentHousehold ? (
            <PantryCard variant='fresh' padding='lg'>
              <Text style={styles.sectionTitle}>🏠 Current Household</Text>
              <View style={styles.householdInfo}>
                <Text style={styles.householdName}>
                  {currentHousehold.name}
                </Text>
                <View style={styles.codeBox}>
                  <Text style={styles.codeLabel}>Invite code</Text>
                  <Text style={styles.codeValue}>{currentHousehold.code}</Text>
                </View>
                <Text style={styles.memberCount}>
                  {users.length} member{users.length !== 1 ? 's' : ''}
                </Text>
              </View>

              <View style={styles.householdActions}>
                <PantryButton
                  title='Invite via share'
                  onPress={handleInvite}
                  variant='primary'
                  size='md'
                  icon='📤'
                  fullWidth
                />
                <PantryButton
                  title='View Activity'
                  onPress={() => navigation.navigate('Activity')}
                  variant='outline'
                  size='md'
                  icon='📊'
                  fullWidth
                />
                <PantryButton
                  title='Leave Household'
                  onPress={handleLeaveHousehold}
                  variant='ghost'
                  size='sm'
                  fullWidth
                />
              </View>
            </PantryCard>
          ) : (
            <PantryCard variant='warm' padding='lg'>
              <Text style={styles.sectionTitle}>
                🏠 Join or Create a Household
              </Text>
              <Text style={styles.noHouseholdText}>
                Share your pantry and shopping list with family or roommates in
                real time.
              </Text>
              <View style={styles.householdActions}>
                <PantryButton
                  title='Join with a code'
                  onPress={() => setShowJoinModal(true)}
                  variant='primary'
                  size='md'
                  icon='🔗'
                  fullWidth
                />
                <PantryButton
                  title='Create a household'
                  onPress={() => setShowCreateModal(true)}
                  variant='secondary'
                  size='md'
                  icon='➕'
                  fullWidth
                />
              </View>
            </PantryCard>
          )}
        </FadeSlideIn>

        {/* Members */}
        {hasHousehold && users.length > 0 && (
          <FadeSlideIn delay={140}>
            <PantryCard variant='default' padding='lg'>
              <Text style={styles.sectionTitle}>👥 Members</Text>
              {users.map(member => (
                <View key={member.id} style={styles.memberCard}>
                  {member.avatar ? (
                    <Image
                      source={{ uri: member.avatar }}
                      style={styles.memberAvatar}
                    />
                  ) : (
                    <View style={styles.memberAvatarFallback}>
                      <Text style={styles.memberAvatarText}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.memberDetails}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                  <Text style={styles.memberRole}>
                    {member.id === currentHousehold?.owner_id ? '👑' : '👤'}
                  </Text>
                </View>
              ))}
            </PantryCard>
          </FadeSlideIn>
        )}

        {/* Settings (owner only) */}
        {hasHousehold && isOwner && currentHousehold && (
          <FadeSlideIn delay={200}>
            <PantryCard variant='outlined' padding='lg'>
              <Text style={styles.sectionTitle}>⚙️ Household Settings</Text>
              <View style={styles.settingRow}>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Allow private items</Text>
                  <Text style={styles.settingSubtitle}>
                    Members can keep items hidden from the household
                  </Text>
                </View>
                <Switch
                  value={currentHousehold.settings.allow_private_items ?? true}
                  onValueChange={handleTogglePrivateItems}
                  trackColor={{
                    false: theme.colors.surfaceMuted,
                    true: theme.palette.primary[300],
                  }}
                  thumbColor={
                    currentHousehold.settings.allow_private_items
                      ? theme.palette.primary[600]
                      : theme.colors.borderStrong
                  }
                />
              </View>
            </PantryCard>
          </FadeSlideIn>
        )}

        {/* Stats */}
        {hasHousehold && (
          <FadeSlideIn delay={260}>
            <PantryCard variant='outlined' padding='lg' style={styles.lastCard}>
              <Text style={styles.sectionTitle}>📊 Household Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{users.length}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {pantry.filter(item => !item.isUsed).length}
                  </Text>
                  <Text style={styles.statLabel}>Pantry Items</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {
                      pantry.filter(item => item.isShared && !item.isUsed)
                        .length
                    }
                  </Text>
                  <Text style={styles.statLabel}>Shared</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {
                      pantry.filter(item => !item.isShared && !item.isUsed)
                        .length
                    }
                  </Text>
                  <Text style={styles.statLabel}>Private</Text>
                </View>
              </View>
            </PantryCard>
          </FadeSlideIn>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditingProfile}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setIsEditingProfile(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <PantryHeader
            title='Edit Profile'
            subtitle='Update your information'
            gradient='primary'
            showBackButton
            onBackPress={() => setIsEditingProfile(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={profileName}
              onChangeText={setProfileName}
              placeholder='Enter your name'
              placeholderTextColor={theme.colors.textMuted}
            />
            <View style={styles.modalActions}>
              <PantryButton
                title='Cancel'
                onPress={() => setIsEditingProfile(false)}
                variant='outline'
                size='md'
                style={styles.modalActionButton}
              />
              <PantryButton
                title='Save'
                onPress={handleUpdateProfile}
                variant='primary'
                size='md'
                style={styles.modalActionButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Join Modal */}
      <Modal
        visible={showJoinModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowJoinModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <PantryHeader
            title='Join Household'
            subtitle='Enter the 6-character invite code'
            gradient='secondary'
            showBackButton
            onBackPress={() => setShowJoinModal(false)}
          />
          <View style={styles.modalContent}>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={joinCode}
              onChangeText={text => setJoinCode(text.toUpperCase())}
              placeholder='ABC123'
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize='characters'
              autoCorrect={false}
              maxLength={6}
              autoFocus
            />
            <PantryButton
              title='Join Household'
              onPress={handleJoin}
              variant='primary'
              size='lg'
              loading={joining}
              icon='🔗'
              fullWidth
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <PantryHeader
            title='Create Household'
            subtitle='Name it after your home, family, or crew'
            gradient='accent'
            showBackButton
            onBackPress={() => setShowCreateModal(false)}
          />
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              value={newHouseholdName}
              onChangeText={setNewHouseholdName}
              placeholder='e.g. The Sheth House'
              placeholderTextColor={theme.colors.textMuted}
              autoFocus
            />
            <PantryButton
              title='Create Household'
              onPress={handleCreate}
              variant='primary'
              size='lg'
              loading={creating}
              icon='🏠'
              fullWidth
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {celebrate && <Confetti onComplete={() => setCelebrate(false)} />}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    codeBox: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: borderRadius.md,
      marginVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    codeInput: {
      fontSize: 24,
      fontWeight: '700',
      letterSpacing: 6,
      textAlign: 'center',
    },
    codeLabel: {
      ...typography.caption,
      color: theme.colors.textMuted,
    },
    codeValue: {
      ...typography.h3,
      color: theme.colors.primary,
      fontFamily: 'monospace',
      letterSpacing: 3,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    householdActions: {
      gap: spacing.sm,
    },
    householdInfo: {
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    householdName: {
      ...typography.h3,
      color: theme.colors.text,
    },
    input: {
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.input,
      borderWidth: 1,
      color: theme.colors.text,
      fontSize: 16,
      height: 52,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
    },
    inputLabel: {
      ...typography.label,
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
    },
    lastCard: {
      marginBottom: spacing.xxl,
    },
    memberAvatar: {
      borderRadius: 22,
      height: 44,
      marginRight: spacing.md,
      width: 44,
    },
    memberAvatarFallback: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 22,
      height: 44,
      justifyContent: 'center',
      marginRight: spacing.md,
      width: 44,
    },
    memberAvatarText: {
      ...typography.body,
      color: theme.colors.primary,
      fontWeight: '700',
    },
    memberCard: {
      alignItems: 'center',
      borderBottomColor: theme.colors.divider,
      borderBottomWidth: 1,
      flexDirection: 'row',
      paddingVertical: spacing.sm,
    },
    memberCount: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
    },
    memberDetails: {
      flex: 1,
    },
    memberEmail: {
      ...typography.caption,
      color: theme.colors.textMuted,
    },
    memberName: {
      ...typography.body,
      color: theme.colors.text,
      fontWeight: '600',
    },
    memberRole: {
      fontSize: 18,
    },
    modalActionButton: {
      flex: 1,
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    modalContainer: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    modalContent: {
      flex: 1,
      padding: spacing.lg,
    },
    noHouseholdText: {
      ...typography.body,
      color: theme.colors.textMuted,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    profileAvatar: {
      borderRadius: 28,
      height: 56,
      marginRight: spacing.md,
      width: 56,
    },
    profileAvatarFallback: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 28,
      height: 56,
      justifyContent: 'center',
      marginRight: spacing.md,
      width: 56,
    },
    profileAvatarText: {
      ...typography.h4,
      color: theme.colors.primary,
    },
    profileCard: {
      alignItems: 'center',
      flexDirection: 'row',
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
    sectionTitle: {
      ...typography.h4,
      color: theme.colors.text,
      marginBottom: spacing.md,
    },
    settingRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    settingSubtitle: {
      ...typography.caption,
      color: theme.colors.textMuted,
    },
    settingText: {
      flex: 1,
      marginRight: spacing.md,
    },
    settingTitle: {
      ...typography.body,
      color: theme.colors.text,
      fontWeight: '600',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statLabel: {
      ...typography.caption,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    statValue: {
      ...typography.h3,
      color: theme.colors.text,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });
