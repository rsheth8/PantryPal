import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StreakState, emptyStreak, updateStreak } from '../utils/streak';

// Lightweight, always-persisted engagement counters used by the achievements
// system. Kept separate from the main multi-user store (which is cleared in
// dev mode) so streaks and lifetime totals survive across launches.

interface EngagementStore {
  totalItemsAdded: number;
  shoppingCompleted: number;
  streak: StreakState;
  celebratedBadges: string[]; // achievement ids already celebrated

  incrementItemsAdded: (by?: number) => void;
  incrementShoppingCompleted: (by?: number) => void;
  registerActiveDay: () => void;
  markBadgeCelebrated: (id: string) => void;
  hasCelebrated: (id: string) => boolean;
}

export const useEngagementStore = create<EngagementStore>()(
  persist(
    (set, get) => ({
      totalItemsAdded: 0,
      shoppingCompleted: 0,
      streak: emptyStreak,
      celebratedBadges: [],

      incrementItemsAdded: (by = 1) =>
        set(state => ({ totalItemsAdded: state.totalItemsAdded + by })),

      incrementShoppingCompleted: (by = 1) =>
        set(state => ({
          shoppingCompleted: Math.max(0, state.shoppingCompleted + by),
        })),

      registerActiveDay: () =>
        set(state => ({ streak: updateStreak(state.streak) })),

      markBadgeCelebrated: id =>
        set(state =>
          state.celebratedBadges.includes(id)
            ? state
            : { celebratedBadges: [...state.celebratedBadges, id] }
        ),

      hasCelebrated: id => get().celebratedBadges.includes(id),
    }),
    {
      name: 'pantrypal-engagement',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
