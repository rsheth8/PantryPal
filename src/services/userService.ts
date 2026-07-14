import { User, Household } from '../types';
import { logger } from '../utils/logger';
import { supabaseService } from './supabaseService';
import { generateId } from '../utils/helpers';

export interface HouseholdInvite {
  id: string;
  householdId: string;
  householdName: string;
  invitedBy: string;
  invitedByName: string;
  inviteCode: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface HouseholdActivity {
  id: string;
  householdId: string;
  userId: string;
  userName: string;
  action: 'added' | 'updated' | 'removed' | 'used' | 'joined' | 'left';
  itemName?: string;
  itemType?: 'pantry' | 'shopping' | 'recipe';
  timestamp: string;
}

export interface MemberRole {
  userId: string;
  householdId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

class UserService {
  async initialize(): Promise<void> {
    // No initialization needed for Supabase service
  }

  async getCurrentUser(): Promise<User | null> {
    return await supabaseService.getCurrentUser();
  }

  async createUser(
    name: string,
    email: string,
    avatar?: string,
    _userId?: string
  ): Promise<User> {
    return await supabaseService.createUser({ name, email, avatar });
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<User | null> {
    return await supabaseService.updateUserProfile(userId, updates);
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Error fetching user:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error in getUserById:', error);
      return null;
    }
  }

  async createHousehold(
    userId: string,
    name: string
  ): Promise<Household | null> {
    try {
      // Delegate to supabaseService, which builds the record with the correct
      // snake_case columns (owner_id, members, settings, created_at) and also
      // sets the owner's household_id.
      const household = await supabaseService.createHousehold(name, userId);
      // Best-effort role bookkeeping (non-fatal if the table is absent).
      await this.addMemberToHousehold(userId, household.id, 'owner');
      return household;
    } catch (error) {
      logger.error('Error in createHousehold:', error);
      return null;
    }
  }

  async joinHousehold(userId: string, code: string): Promise<Household | null> {
    try {
      // Delegate to supabaseService, which appends to the members array and
      // sets the joiner's household_id.
      const household = await supabaseService.joinHousehold(userId, code);
      if (!household) return null;
      await this.addMemberToHousehold(userId, household.id, 'member');
      return household;
    } catch (error) {
      logger.error('Error in joinHousehold:', error);
      return null;
    }
  }

  async leaveHousehold(userId: string): Promise<void> {
    try {
      // Remove user from household
      await supabaseService.supabase
        .from('users')
        .update({ household_id: null })
        .eq('id', userId);

      // Remove member role
      await supabaseService.supabase
        .from('member_roles')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      logger.error('Error in leaveHousehold:', error);
    }
  }

  async getHouseholdMembers(householdId: string): Promise<User[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('users')
        .select('*')
        .eq('household_id', householdId);

      if (error) {
        logger.error('Error fetching household members:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getHouseholdMembers:', error);
      return [];
    }
  }

  async createInvite(
    householdId: string,
    invitedBy: string
  ): Promise<HouseholdInvite | null> {
    try {
      const inviteCode = this.generateInviteCode();
      const household = await this.getHouseholdById(householdId);
      const inviter = await this.getUserById(invitedBy);

      const invite: HouseholdInvite = {
        id: generateId(),
        householdId,
        householdName: household?.name || '',
        invitedBy,
        invitedByName: inviter?.name || '',
        inviteCode,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const { data, error } = await supabaseService.supabase
        .from('household_invites')
        .insert(invite)
        .select()
        .single();

      if (error) {
        logger.error('Error creating invite:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error in createInvite:', error);
      return null;
    }
  }

  async acceptInvite(inviteCode: string, userId: string): Promise<boolean> {
    try {
      const { data: invite, error } = await supabaseService.supabase
        .from('household_invites')
        .select('*')
        .eq('invite_code', inviteCode)
        .eq('status', 'pending')
        .single();

      if (error || !invite) {
        logger.error('Error finding invite:', error);
        return false;
      }

      // Add user to household
      await this.addMemberToHousehold(userId, invite.household_id, 'member');

      // Update invite status
      await supabaseService.supabase
        .from('household_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      return true;
    } catch (error) {
      logger.error('Error in acceptInvite:', error);
      return false;
    }
  }

  async getHouseholdActivity(
    householdId: string,
    limit = 30
  ): Promise<HouseholdActivity[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('household_activity')
        .select('*')
        .eq('household_id', householdId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching household activity:', error);
        return [];
      }

      // Map snake_case DB rows to the camelCase HouseholdActivity type.
      return (data || []).map(row => ({
        id: row.id,
        householdId: row.household_id,
        userId: row.user_id,
        userName: row.user_name,
        action: row.action,
        itemName: row.item_name ?? undefined,
        itemType: row.metadata?.itemType,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      logger.error('Error in getHouseholdActivity:', error);
      return [];
    }
  }

  async addActivityLog(
    activity: Omit<HouseholdActivity, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      await supabaseService.supabase.from('household_activity').insert({
        id: generateId(),
        household_id: activity.householdId,
        user_id: activity.userId,
        user_name: activity.userName,
        action: activity.action,
        item_name: activity.itemName ?? null,
        metadata: activity.itemType ? { itemType: activity.itemType } : null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in addActivityLog:', error);
    }
  }

  async getMemberRole(
    userId: string,
    householdId: string
  ): Promise<MemberRole | null> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('member_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('household_id', householdId)
        .single();

      if (error) {
        logger.error('Error fetching member role:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error in getMemberRole:', error);
      return null;
    }
  }

  async updateMemberRole(
    userId: string,
    householdId: string,
    role: 'owner' | 'admin' | 'member'
  ): Promise<void> {
    try {
      await supabaseService.supabase
        .from('member_roles')
        .update({ role })
        .eq('user_id', userId)
        .eq('household_id', householdId);
    } catch (error) {
      logger.error('Error in updateMemberRole:', error);
    }
  }

  async removeMember(userId: string, householdId: string): Promise<void> {
    try {
      // Remove member role
      await supabaseService.supabase
        .from('member_roles')
        .delete()
        .eq('user_id', userId)
        .eq('household_id', householdId);

      // Update user's household_id
      await supabaseService.supabase
        .from('users')
        .update({ household_id: null })
        .eq('id', userId);
    } catch (error) {
      logger.error('Error in removeMember:', error);
    }
  }

  async updateHouseholdSettings(
    householdId: string,
    updates: Partial<Household>
  ): Promise<Household | null> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('households')
        .update(updates)
        .eq('id', householdId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating household settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error in updateHouseholdSettings:', error);
      return null;
    }
  }

  private async addMemberToHousehold(
    userId: string,
    householdId: string,
    role: 'owner' | 'admin' | 'member'
  ): Promise<void> {
    try {
      // Update user's household_id
      await supabaseService.supabase
        .from('users')
        .update({ household_id: householdId })
        .eq('id', userId);

      // Add member role
      await supabaseService.supabase.from('member_roles').insert({
        user_id: userId,
        household_id: householdId,
        role,
        joined_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in addMemberToHousehold:', error);
    }
  }

  async getHouseholdById(householdId: string): Promise<Household | null> {
    try {
      logger.debug('UserService: Fetching household with ID:', householdId);
      const { data, error } = await supabaseService.supabase
        .from('households')
        .select('*')
        .eq('id', householdId)
        .single();

      if (error) {
        logger.error('UserService: Error fetching household:', error);
        return null;
      }

      logger.debug('UserService: Found household:', data);
      return data;
    } catch (error) {
      logger.error('UserService: Error in getHouseholdById:', error);
      return null;
    }
  }

  private generateHouseholdCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const userService = new UserService();
