import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

// Real-time household sync.
//
// Subscribes to Postgres change events (INSERT/UPDATE/DELETE) on the shared
// tables, scoped to a household, and forwards them to the store so every
// member sees live updates without polling. Requires the tables to be added
// to the `supabase_realtime` publication (see FINAL_SQL_SCHEMA.sql).

export type ChangeType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface TableChange<Row = Record<string, unknown>> {
  table:
    | 'grocery_items'
    | 'shopping_list_items'
    | 'recipes'
    | 'household_activity';
  type: ChangeType;
  new: Row | null;
  old: Row | null;
}

type ChangeHandler = (change: TableChange) => void;

const SYNCED_TABLES: TableChange['table'][] = [
  'grocery_items',
  'shopping_list_items',
  'recipes',
  'household_activity',
];

class RealtimeService {
  private channel: RealtimeChannel | null = null;
  private currentHouseholdId: string | null = null;

  isActive(householdId: string): boolean {
    return this.channel !== null && this.currentHouseholdId === householdId;
  }

  subscribe(householdId: string, onChange: ChangeHandler): void {
    // Already subscribed to this household — nothing to do.
    if (this.isActive(householdId)) return;

    // Switching households — tear down the previous channel first.
    this.unsubscribe();

    this.currentHouseholdId = householdId;
    const channel = supabase.channel(`household:${householdId}`);

    for (const table of SYNCED_TABLES) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `household_id=eq.${householdId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          try {
            onChange({
              table,
              type: payload.eventType as ChangeType,
              new: (payload.new as Record<string, unknown>) ?? null,
              old: (payload.old as Record<string, unknown>) ?? null,
            });
          } catch (error) {
            logger.error('Realtime change handler error:', error);
          }
        }
      );
    }

    channel.subscribe(status => {
      logger.debug('Realtime channel status:', status);
    });

    this.channel = channel;
  }

  unsubscribe(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.currentHouseholdId = null;
    }
  }
}

export const realtimeService = new RealtimeService();
