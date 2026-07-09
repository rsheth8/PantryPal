import { supabase } from '../lib/supabaseClient';

export type HouseholdActivityAction =
  | 'added'
  | 'updated'
  | 'removed'
  | 'used'
  | 'joined'
  | 'left'
  | 'completed';

export type HouseholdActivityItemType =
  | 'pantry'
  | 'shopping'
  | 'recipe'
  | 'household';

export interface HouseholdActivityEntry {
  id: string;
  householdId: string;
  userId: string;
  userName: string;
  action: HouseholdActivityAction;
  itemName?: string;
  itemType?: HouseholdActivityItemType;
  createdAt: string;
}

interface SupabaseActivityRow {
  id: string;
  household_id: string;
  user_id: string;
  user_name: string;
  action: HouseholdActivityAction;
  item_name?: string;
  item_type?: HouseholdActivityItemType;
  created_at: string;
}

function mapRow(row: SupabaseActivityRow): HouseholdActivityEntry {
  return {
    id: row.id,
    householdId: row.household_id,
    userId: row.user_id,
    userName: row.user_name,
    action: row.action,
    itemName: row.item_name,
    itemType: row.item_type,
    createdAt: row.created_at,
  };
}

export async function logHouseholdActivity(params: {
  householdId: string;
  userId: string;
  userName: string;
  action: HouseholdActivityAction;
  itemName?: string;
  itemType?: HouseholdActivityItemType;
}): Promise<void> {
  try {
    const { error } = await supabase.from('household_activity').insert({
      household_id: params.householdId,
      user_id: params.userId,
      user_name: params.userName,
      action: params.action,
      item_name: params.itemName,
      item_type: params.itemType,
    });

    if (error) {
      console.error('Error logging household activity:', error);
    }
  } catch (error) {
    console.error('Error in logHouseholdActivity:', error);
  }
}

export async function getHouseholdActivity(
  householdId: string,
  limit = 25
): Promise<HouseholdActivityEntry[]> {
  try {
    const { data, error } = await supabase
      .from('household_activity')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching household activity:', error);
      return [];
    }

    return (data as SupabaseActivityRow[]).map(mapRow);
  } catch (error) {
    console.error('Error in getHouseholdActivity:', error);
    return [];
  }
}

export function formatActivityMessage(entry: HouseholdActivityEntry): string {
  const item = entry.itemName ? `"${entry.itemName}"` : '';
  switch (entry.action) {
    case 'added':
      return `${entry.userName} added ${item} to the ${entry.itemType || 'pantry'}`;
    case 'updated':
      return `${entry.userName} updated ${item}`;
    case 'removed':
      return `${entry.userName} removed ${item}`;
    case 'used':
      return `${entry.userName} used ${item}`;
    case 'completed':
      return `${entry.userName} completed ${item} on the shopping list`;
    case 'joined':
      return `${entry.userName} joined the household`;
    case 'left':
      return `${entry.userName} left the household`;
    default:
      return `${entry.userName} updated the household`;
  }
}

export function getActivityIcon(entry: HouseholdActivityEntry): string {
  switch (entry.action) {
    case 'added':
      return '➕';
    case 'updated':
      return '✏️';
    case 'removed':
      return '🗑️';
    case 'used':
      return '✅';
    case 'completed':
      return '🛒';
    case 'joined':
      return '🔗';
    case 'left':
      return '🚪';
    default:
      return '📋';
  }
}
