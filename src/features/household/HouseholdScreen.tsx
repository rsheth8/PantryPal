import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Image,
  FlatList,
  Modal,
  Share,
  Switch,
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
import {
  getHouseholdActivity,
  formatActivityMessage,
  getActivityIcon,
  HouseholdActivityEntry,
} from '../../services/householdActivityService';

export default function HouseholdScreen() {
  const {
    currentUser,
    currentHousehold,
    users,
    pantry,
    createHousehold,
    joinHousehold,
    leaveHousehold,
    updateUserProfile,
    updateHouseholdSettings,
  } = useMultiUserStore();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileUpdates, setProfileUpdates] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
  });
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isActivityFeedVisible, setIsActivityFeedVisible] = useState(false);
  const [isDevSwitcherVisible, setIsDevSwitcherVisible] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowPrivateItems, setAllowPrivateItems] = useState(
    currentHousehold?.settings?.allow_private_items ?? true
  );
  const [activities, setActivities] = useState<HouseholdActivityEntry[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const householdId = currentUser?.householdId || currentUser?.household_id;
  const hasHousehold = !!(householdId && currentHousehold);

  useEffect(() => {
    setProfileUpdates({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
    });
  }, [currentUser]);

  useEffect(() => {
    setAllowPrivateItems(
      currentHousehold?.settings?.allow_private_items ?? true
    );
  }, [currentHousehold]);

  useEffect(() => {
    if (isActivityFeedVisible && currentHousehold) {
      loadActivityFeed();
    }
  }, [isActivityFeedVisible, currentHousehold?.id]);

  const loadActivityFeed = async () => {
    if (!currentHousehold) return;
    setLoadingActivity(true);
    try {
      const data = await getHouseholdActivity(currentHousehold.id);
      setActivities(data);
    } finally {
      setLoadingActivity(false);
    }
  };

  const formatActivityTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      Alert.alert('Error', 'Please enter a household name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createHousehold(householdName.trim());
      setIsCreateModalVisible(false);
      setHouseholdName('');
      Alert.alert('Success', 'Household created! Share your code to invite others.');
    } catch (error) {
      Alert.alert('Error', 'Failed to create household. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a household code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const joined = await joinHousehold(joinCode.trim().toUpperCase());
      if (joined) {
        setIsJoinModalVisible(false);
        setJoinCode('');
        Alert.alert('Success', 'You joined the household!');
      } else {
        Alert.alert('Error', 'Invalid household code. Please check and try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join household.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareInvite = async () => {
    if (!currentHousehold) return;

    try {
      await Share.share({
        message: `Join my PantryPal household "${currentHousehold.name}" with code: ${currentHousehold.code}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share invite.');
    }
  };

  const handleSaveSettings = async () => {
    if (!currentHousehold) return;

    setIsSubmitting(true);
    try {
      await updateHouseholdSettings(currentHousehold.id, {
        settings: {
          ...currentHousehold.settings,
          allow_private_items: allowPrivateItems,
        },
      });
      setIsSettingsModalVisible(false);
      Alert.alert('Success', 'Household settings updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings.');
    } finally {
      setIsSubmitting(false);
    }
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
            Alert.alert('Success', 'You have left the household.');
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!profileUpdates.name.trim()) {
      Alert.alert('Error', 'Name is required.');
      return;
    }

    try {
      await updateUserProfile({
        name: profileUpdates.name,
        email: profileUpdates.email,
      });
      setIsEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const renderMember = ({ item }: { item: any }) => (
    <PantryCard variant='default' padding='md'>
      <View style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>{item.name}</Text>
            <Text style={styles.memberEmail}>{item.email}</Text>
            <Text style={styles.memberRole}>
              {item.id === currentHousehold?.owner_id
                ? '👑 Owner'
                : '👤 Member'}
            </Text>
          </View>
        </View>
      </View>
    </PantryCard>
  );

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Household'
        subtitle='Manage your family or roommates'
        gradient='dawn'
        rightAction={{
          icon: '⚙️',
          onPress: () => setIsSettingsModalVisible(true),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <PantryCard variant='elevated' padding='lg'>
          <Text style={styles.sectionTitle}>👤 Your Profile</Text>
          <View style={styles.profileCard}>
            <Image
              source={{ uri: currentUser?.avatar }}
              style={styles.profileAvatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{currentUser?.name}</Text>
              <Text style={styles.profileEmail}>{currentUser?.email}</Text>
            </View>
            <PantryButton
              title='Edit'
              onPress={() => setIsEditingProfile(true)}
              variant='outline'
              size='sm'
            />
          </View>
        </PantryCard>

        {/* Household Status */}
        {hasHousehold ? (
          <PantryCard variant='fresh' padding='lg'>
            <Text style={styles.sectionTitle}>🏠 Current Household</Text>
            <View style={styles.householdInfo}>
              <Text style={styles.householdName}>{currentHousehold.name}</Text>
              <Text style={styles.householdCode}>
                Code: {currentHousehold.code}
              </Text>
              <Text style={styles.memberCount}>
                {users.length} member{users.length !== 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.householdActions}>
              <PantryButton
                title='Invite Members'
                onPress={() => setIsInviteModalVisible(true)}
                variant='primary'
                size='sm'
                icon='📧'
                fullWidth
              />
              <PantryButton
                title='View Activity'
                onPress={() => setIsActivityFeedVisible(true)}
                variant='outline'
                size='sm'
                icon='📊'
                fullWidth
              />
              <PantryButton
                title='Leave Household'
                onPress={handleLeaveHousehold}
                variant='warning'
                size='sm'
                icon='🚪'
                fullWidth
              />
            </View>
          </PantryCard>
        ) : (
          <PantryCard variant='warm' padding='lg'>
            <Text style={styles.sectionTitle}>🏠 Join or Create Household</Text>
            <Text style={styles.noHouseholdText}>
              You're not part of a household yet. Join an existing one or create
              your own!
            </Text>

            <View style={styles.householdActions}>
              <PantryButton
                title='Join Household'
                onPress={() => setIsJoinModalVisible(true)}
                variant='primary'
                size='md'
                icon='🔗'
                fullWidth
              />
              <PantryButton
                title='Create Household'
                onPress={() => setIsCreateModalVisible(true)}
                variant='secondary'
                size='md'
                icon='➕'
                fullWidth
              />
            </View>
          </PantryCard>
        )}

        {/* Household Members */}
        {hasHousehold && users.length > 0 && (
          <PantryCard variant='default' padding='lg'>
            <Text style={styles.sectionTitle}>👥 Household Members</Text>
            <FlatList
              data={users}
              renderItem={renderMember}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </PantryCard>
        )}

        {/* Household Stats */}
        {hasHousehold && (
          <PantryCard variant='outlined' padding='lg'>
            <Text style={styles.sectionTitle}>📊 Household Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{users.length}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{pantry.length}</Text>
                <Text style={styles.statLabel}>Pantry Items</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {pantry.filter(item => item.isShared).length}
                </Text>
                <Text style={styles.statLabel}>Shared Items</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {pantry.filter(item => !item.isShared).length}
                </Text>
                <Text style={styles.statLabel}>Private Items</Text>
              </View>
            </View>
          </PantryCard>
        )}

        {/* Development Tools */}
        {__DEV__ && (
          <PantryCard variant='outlined' padding='lg'>
            <Text style={styles.sectionTitle}>🛠️ Development Tools</Text>
            <PantryButton
              title='Switch User'
              onPress={() => setIsDevSwitcherVisible(true)}
              variant='outline'
              size='sm'
              icon='👤'
              fullWidth
            />
          </PantryCard>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditingProfile}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <View style={styles.modalContainer}>
          <PantryHeader
            title='Edit Profile'
            subtitle='Update your information'
            gradient='primary'
            showBackButton
            onBackPress={() => setIsEditingProfile(false)}
          />

          <View style={styles.modalContent}>
            <PantryCard variant='elevated' padding='lg'>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={profileUpdates.name}
                  onChangeText={text =>
                    setProfileUpdates({ ...profileUpdates, name: text })
                  }
                  placeholder='Enter your name'
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={profileUpdates.email}
                  onChangeText={text =>
                    setProfileUpdates({ ...profileUpdates, email: text })
                  }
                  placeholder='Enter your email'
                  placeholderTextColor={colors.neutral[400]}
                  keyboardType='email-address'
                />
              </View>

              <View style={styles.modalActions}>
                <PantryButton
                  title='Cancel'
                  onPress={() => setIsEditingProfile(false)}
                  variant='outline'
                  size='md'
                />
                <PantryButton
                  title='Save'
                  onPress={handleUpdateProfile}
                  variant='primary'
                  size='md'
                />
              </View>
            </PantryCard>
          </View>
        </View>
      </Modal>

      {isJoinModalVisible && (
        <Modal
          visible={isJoinModalVisible}
          animationType='slide'
          presentationStyle='pageSheet'
        >
          <View style={styles.modalContainer}>
            <PantryHeader
              title='Join Household'
              subtitle='Enter a household code'
              gradient='secondary'
              showBackButton
              onBackPress={() => setIsJoinModalVisible(false)}
            />
            <View style={styles.modalContent}>
              <PantryCard variant='elevated' padding='lg'>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Household Code</Text>
                  <TextInput
                    style={styles.input}
                    value={joinCode}
                    onChangeText={setJoinCode}
                    placeholder='e.g. ABC123'
                    placeholderTextColor={colors.neutral[400]}
                    autoCapitalize='characters'
                    maxLength={6}
                  />
                </View>
                <PantryButton
                  title={isSubmitting ? 'Joining...' : 'Join Household'}
                  onPress={handleJoinHousehold}
                  variant='primary'
                  size='md'
                  fullWidth
                  disabled={isSubmitting}
                />
              </PantryCard>
            </View>
          </View>
        </Modal>
      )}

      {isCreateModalVisible && (
        <Modal
          visible={isCreateModalVisible}
          animationType='slide'
          presentationStyle='pageSheet'
        >
          <View style={styles.modalContainer}>
            <PantryHeader
              title='Create Household'
              subtitle='Start a new household'
              gradient='accent'
              showBackButton
              onBackPress={() => setIsCreateModalVisible(false)}
            />
            <View style={styles.modalContent}>
              <PantryCard variant='elevated' padding='lg'>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Household Name</Text>
                  <TextInput
                    style={styles.input}
                    value={householdName}
                    onChangeText={setHouseholdName}
                    placeholder='e.g. The Sheth Family'
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
                <PantryButton
                  title={isSubmitting ? 'Creating...' : 'Create Household'}
                  onPress={handleCreateHousehold}
                  variant='primary'
                  size='md'
                  fullWidth
                  disabled={isSubmitting}
                />
              </PantryCard>
            </View>
          </View>
        </Modal>
      )}

      {isInviteModalVisible && (
        <Modal
          visible={isInviteModalVisible}
          animationType='slide'
          presentationStyle='pageSheet'
        >
          <View style={styles.modalContainer}>
            <PantryHeader
              title='Invite Members'
              subtitle='Share your household'
              gradient='berry'
              showBackButton
              onBackPress={() => setIsInviteModalVisible(false)}
            />
            <View style={styles.modalContent}>
              <PantryCard variant='elevated' padding='lg'>
                <Text style={styles.inviteLabel}>Your household code</Text>
                <Text style={styles.inviteCode}>{currentHousehold?.code}</Text>
                <Text style={styles.inviteHint}>
                  Share this code with family or roommates so they can join your
                  household and see shared pantry items.
                </Text>
                <PantryButton
                  title='Share Code'
                  onPress={handleShareInvite}
                  variant='primary'
                  size='md'
                  fullWidth
                  icon='📤'
                />
              </PantryCard>
            </View>
          </View>
        </Modal>
      )}

      {isSettingsModalVisible && (
        <Modal
          visible={isSettingsModalVisible}
          animationType='slide'
          presentationStyle='pageSheet'
        >
          <View style={styles.modalContainer}>
            <PantryHeader
              title='Household Settings'
              subtitle='Manage preferences'
              gradient='twilight'
              showBackButton
              onBackPress={() => setIsSettingsModalVisible(false)}
            />
            <View style={styles.modalContent}>
              <PantryCard variant='elevated' padding='lg'>
                <View style={styles.settingRow}>
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Allow private items</Text>
                    <Text style={styles.settingDescription}>
                      Members can keep personal pantry items hidden from the
                      household.
                    </Text>
                  </View>
                  <Switch
                    value={allowPrivateItems}
                    onValueChange={setAllowPrivateItems}
                    trackColor={{
                      false: colors.neutral[300],
                      true: colors.primary[400],
                    }}
                  />
                </View>
                <PantryButton
                  title={isSubmitting ? 'Saving...' : 'Save Settings'}
                  onPress={handleSaveSettings}
                  variant='primary'
                  size='md'
                  fullWidth
                  disabled={isSubmitting || !hasHousehold}
                />
              </PantryCard>
            </View>
          </View>
        </Modal>
      )}

      {isActivityFeedVisible && (
        <Modal
          visible={isActivityFeedVisible}
          animationType='slide'
          presentationStyle='pageSheet'
        >
          <View style={styles.modalContainer}>
            <PantryHeader
              title='Activity Feed'
              subtitle='Recent household activity'
              gradient='garden'
              showBackButton
              onBackPress={() => setIsActivityFeedVisible(false)}
            />
            <View style={styles.modalContent}>
              <PantryCard variant='elevated' padding='lg'>
                {loadingActivity ? (
                  <Text style={styles.inviteHint}>Loading activity...</Text>
                ) : activities.length === 0 ? (
                  <Text style={styles.inviteHint}>
                    No activity yet. Shared pantry and shopping updates will
                    appear here.
                  </Text>
                ) : (
                  activities.map(entry => (
                    <View key={entry.id} style={styles.activityRow}>
                      <Text style={styles.activityIcon}>
                        {getActivityIcon(entry)}
                      </Text>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityMessage}>
                          {formatActivityMessage(entry)}
                        </Text>
                        <Text style={styles.activityTime}>
                          {formatActivityTime(entry.createdAt)}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </PantryCard>
            </View>
          </View>
        </Modal>
      )}

      {isDevSwitcherVisible && (
        <Modal
          visible={isDevSwitcherVisible}
          animationType='slide'
          presentationStyle='pageSheet'
        >
          <View style={styles.modalContainer}>
            <PantryHeader
              title='Switch User'
              subtitle='Development tool'
              gradient='sunset'
              showBackButton
              onBackPress={() => setIsDevSwitcherVisible(false)}
            />
            <View style={styles.modalContent}>
              <PantryCard variant='elevated' padding='lg'>
                <Text style={styles.modalPlaceholder}>
                  User switcher functionality coming soon!
                </Text>
                <PantryButton
                  title='Close'
                  onPress={() => setIsDevSwitcherVisible(false)}
                  variant='primary'
                  size='md'
                  fullWidth
                />
              </PantryCard>
            </View>
          </View>
        </Modal>
      )}
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h3,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.neutral[600],
  },
  householdInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  householdName: {
    ...typography.h3,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  householdCode: {
    ...typography.body,
    color: colors.neutral[600],
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
  },
  memberCount: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  noHouseholdText: {
    ...typography.body,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  householdActions: {
    gap: spacing.sm,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  memberEmail: {
    ...typography.bodySmall,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  memberRole: {
    ...typography.caption,
    color: colors.neutral[500],
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...typography.h3,
    color: colors.neutral[900],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.body,
    color: colors.neutral[700],
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  input: {
    height: 44,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalPlaceholder: {
    ...typography.body,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  inviteLabel: {
    ...typography.body,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  inviteCode: {
    ...typography.h2,
    color: colors.primary[700],
    textAlign: 'center',
    fontFamily: 'monospace',
    letterSpacing: 4,
    marginBottom: spacing.md,
  },
  inviteHint: {
    ...typography.bodySmall,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  settingDescription: {
    ...typography.bodySmall,
    color: colors.neutral[600],
  },
  activityItem: {
    ...typography.body,
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  activityIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    ...typography.body,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  activityTime: {
    ...typography.caption,
    color: colors.neutral[500],
  },
});
