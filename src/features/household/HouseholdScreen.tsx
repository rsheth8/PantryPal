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
} from '../../utils/designSystem';

export default function HouseholdScreen() {
  const {
    currentUser,
    currentHousehold,
    users,
    pantry,
    leaveHousehold,
    updateUserProfile,
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

  // Check if user has a household
  const hasHousehold = currentUser?.householdId && currentHousehold;

  // Debug logging
  useEffect(() => {
    console.log('HouseholdScreen Debug:');
    console.log('- currentUser:', currentUser);
    console.log('- currentHousehold:', currentHousehold);
    console.log('- users:', users);
    console.log('- hasHousehold:', hasHousehold);
  }, [currentUser, currentHousehold, users, hasHousehold]);

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
              You&apos;re not part of a household yet. Join an existing one or
              create your own!
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

      {/* Placeholder Modals */}
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
                <Text style={styles.modalPlaceholder}>
                  Join household functionality coming soon!
                </Text>
                <PantryButton
                  title='Close'
                  onPress={() => setIsJoinModalVisible(false)}
                  variant='primary'
                  size='md'
                  fullWidth
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
                <Text style={styles.modalPlaceholder}>
                  Create household functionality coming soon!
                </Text>
                <PantryButton
                  title='Close'
                  onPress={() => setIsCreateModalVisible(false)}
                  variant='primary'
                  size='md'
                  fullWidth
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
                <Text style={styles.modalPlaceholder}>
                  Invite members functionality coming soon!
                </Text>
                <PantryButton
                  title='Close'
                  onPress={() => setIsInviteModalVisible(false)}
                  variant='primary'
                  size='md'
                  fullWidth
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
                <Text style={styles.modalPlaceholder}>
                  Household settings functionality coming soon!
                </Text>
                <PantryButton
                  title='Close'
                  onPress={() => setIsSettingsModalVisible(false)}
                  variant='primary'
                  size='md'
                  fullWidth
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
                <Text style={styles.modalPlaceholder}>
                  Activity feed functionality coming soon!
                </Text>
                <PantryButton
                  title='Close'
                  onPress={() => setIsActivityFeedVisible(false)}
                  variant='primary'
                  size='md'
                  fullWidth
                />
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
    backgroundColor: colors.neutral[50],
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  householdActions: {
    gap: spacing.sm,
  },
  householdCode: {
    ...typography.body,
    color: colors.neutral[600],
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
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
  input: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.input,
    borderWidth: 1,
    color: colors.neutral[900],
    fontSize: 16,
    height: 44,
    paddingHorizontal: spacing.md,
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
  memberAvatar: {
    borderRadius: 24,
    height: 48,
    marginRight: spacing.md,
    width: 48,
  },
  memberCard: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  memberCount: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  memberDetails: {
    flex: 1,
  },
  memberEmail: {
    ...typography.bodySmall,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  memberInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  memberName: {
    ...typography.body,
    color: colors.neutral[800],
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  memberRole: {
    ...typography.caption,
    color: colors.neutral[500],
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.neutral[50],
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  modalPlaceholder: {
    ...typography.body,
    color: colors.neutral[600],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  noHouseholdText: {
    ...typography.body,
    color: colors.neutral[600],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  profileAvatar: {
    borderRadius: 30,
    height: 60,
    marginRight: spacing.md,
    width: 60,
  },
  profileCard: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.neutral[600],
  },
  profileInfo: {
    flex: 1,
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
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    ...typography.caption,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.neutral[900],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
