import { supabaseService } from './supabaseService';
import { PantrySettings } from '../types';

const supabase = supabaseService.supabase;

interface SupabasePantrySettings {
  user_id: string;
  low_stock_threshold: number;
  expiration_reminder_days: number;
  default_item_visibility: 'shared' | 'private';
  notifications: {
    expiration_reminders: boolean;
    low_stock_alerts: boolean;
    household_updates: boolean;
  };
}

export const defaultPantrySettings: PantrySettings = {
  lowStockThreshold: 1,
  expirationReminderDays: 3,
  defaultItemVisibility: 'shared',
  notifications: {
    expirationReminders: true,
    lowStockAlerts: true,
    householdUpdates: true,
  },
};

function toPantrySettings(row: SupabasePantrySettings): PantrySettings {
  return {
    lowStockThreshold: row.low_stock_threshold,
    expirationReminderDays: row.expiration_reminder_days,
    defaultItemVisibility: row.default_item_visibility,
    notifications: {
      expirationReminders: row.notifications?.expiration_reminders ?? true,
      lowStockAlerts: row.notifications?.low_stock_alerts ?? true,
      householdUpdates: row.notifications?.household_updates ?? true,
    },
  };
}

class PantryPreferencesService {
  async getPreferences(userId: string): Promise<PantrySettings> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return defaultPantrySettings;
    }

    return toPantrySettings(data as SupabasePantrySettings);
  }

  async savePreferences(
    userId: string,
    settings: Partial<PantrySettings>
  ): Promise<PantrySettings> {
    const current = await this.getPreferences(userId);
    const merged = { ...current, ...settings };

    const payload = {
      user_id: userId,
      low_stock_threshold: merged.lowStockThreshold,
      expiration_reminder_days: merged.expirationReminderDays,
      default_item_visibility: merged.defaultItemVisibility,
      notifications: {
        expiration_reminders: merged.notifications.expirationReminders,
        low_stock_alerts: merged.notifications.lowStockAlerts,
        household_updates: merged.notifications.householdUpdates,
      },
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving pantry preferences:', error);
      throw error;
    }

    return toPantrySettings(data as SupabasePantrySettings);
  }
}

export const pantryPreferencesService = new PantryPreferencesService();
