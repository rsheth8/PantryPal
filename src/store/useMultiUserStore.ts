import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GroceryItem,
  Recipe,
  ShoppingListItem,
  UserPreferences,
  User,
  Household,
} from '../types';
import { isExpiringSoon } from '../utils/helpers';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { supabaseService } from '../services/supabaseService';
import { notificationService } from '../services/notificationService';
import { isDevMode } from '../config/dev';
import { logger } from '../utils/logger';
import { useEngagementStore } from './useEngagementStore';
import { realtimeService, TableChange } from '../services/realtimeService';
import {
  samplePantry,
  sampleRecipes,
  sampleShopping,
} from '../utils/sampleData';
import {
  SupabaseGroceryItem,
  SupabaseShoppingListItem,
} from '../services/supabaseService';

// Clear Zustand persisted storage in dev mode
if (isDevMode()) {
  AsyncStorage.removeItem('pantrypal-multiuser-storage');
}

interface MultiUserStore {
  // User and household state
  currentUser: User | null;
  currentHousehold: Household | null;
  users: User[];
  households: Household[];

  // Data with user context
  pantry: GroceryItem[];
  recipes: Recipe[];
  shoppingList: ShoppingListItem[];
  preferences: UserPreferences;

  // UI state
  isLoading: boolean;
  error: string | null;

  // User and household actions
  initializeUser: () => Promise<void>;
  setCurrentUser: (user: User) => void;
  setCurrentHousehold: (household: Household) => void;
  startRealtimeSync: (householdId: string) => void;
  stopRealtimeSync: () => void;
  createHousehold: (name: string) => Promise<Household>;
  joinHousehold: (code: string) => Promise<boolean>;
  leaveHousehold: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  updateHouseholdSettings: (
    householdId: string,
    updates: Partial<Household>
  ) => Promise<void>;

  // Grocery Item Actions (with user context)
  addGroceryItem: (
    item: Omit<
      GroceryItem,
      'id' | 'isUsed' | 'isExpired' | 'addedBy' | 'createdAt' | 'updatedAt'
    >,
    isShared?: boolean
  ) => Promise<void>;
  updateGroceryItem: (
    id: string,
    updates: Partial<GroceryItem>
  ) => Promise<void>;
  removeGroceryItem: (id: string) => Promise<void>;
  markItemAsUsed: (id: string) => Promise<void>;
  markItemAsExpired: (id: string) => Promise<void>;
  refreshPantry: () => Promise<void>;

  // Shopping List Actions (with user context)
  addShoppingListItem: (
    item: Omit<
      ShoppingListItem,
      'id' | 'isCompleted' | 'addedBy' | 'createdAt'
    >,
    isShared?: boolean
  ) => Promise<void>;
  updateShoppingListItem: (
    id: string,
    updates: Partial<ShoppingListItem>
  ) => Promise<void>;
  removeShoppingListItem: (id: string) => Promise<void>;
  toggleShoppingItemComplete: (id: string) => Promise<void>;

  // Recipe Actions (with user context)
  addRecipe: (
    recipe: Omit<Recipe, 'id' | 'createdBy' | 'createdAt'>,
    isShared?: boolean
  ) => Promise<void>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
  removeRecipe: (id: string) => Promise<void>;

  // Preferences
  updatePreferences: (updates: Partial<UserPreferences>) => void;

  // First-run helper
  seedSampleData: () => Promise<void>;

  // Computed getters
  getExpiringItems: () => GroceryItem[];
  getLowStockItems: () => GroceryItem[];
  getAvailableRecipes: () => Recipe[];
  getAccessibleItems: () => GroceryItem[]; // User's items + shared items
  getPersonalItems: () => GroceryItem[]; // Only user's items
  getSharedItems: () => GroceryItem[]; // Only shared items
  getHouseholdMembers: () => User[];
}

const defaultPreferences: UserPreferences = {
  lowStockThreshold: 1,
  expirationReminderDays: 3,
  defaultItemVisibility: 'shared',
  notifications: {
    expirationReminders: true,
    lowStockAlerts: true,
    householdUpdates: true,
  },
};

export const useMultiUserStore = create<MultiUserStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      currentHousehold: null,
      users: [],
      households: [],
      pantry: [],
      recipes: [],
      shoppingList: [],
      preferences: defaultPreferences,
      isLoading: false,
      error: null,

      // User and household actions
      initializeUser: async () => {
        set({ isLoading: true });
        try {
          logger.debug('Store: Initializing user...');

          // Initialize auth service
          await authService.initialize();

          // Get authenticated user
          const authUser = await authService.getCurrentUser();
          logger.debug('Store: Auth user:', authUser);

          if (!authUser) {
            logger.debug('Store: No auth user found');
            set({ isLoading: false });
            return;
          }

          // Convert auth user to app user
          const user = authService.convertToUser(authUser);
          logger.debug('Store: Converted user:', user);

          // Initialize user service
          await userService.initialize();

          // Check if user exists in user service, if not create them
          let existingUser = await userService.getUserById(user.id);
          logger.debug('Store: Existing user from service:', existingUser);

          if (!existingUser) {
            logger.debug('Store: User not found in service, creating...');
            try {
              existingUser = await userService.createUser(
                user.name,
                user.email,
                user.avatar,
                user.id
              );
              logger.debug('Store: Created user:', existingUser);
            } catch (error) {
              logger.error('Store: Error creating user:', error);
              set({ isLoading: false });
              return;
            }
          }

          // Set current user
          set({ currentUser: existingUser });

          // Load household if user has one
          let household: Household | null = null;
          let users: User[] = [];
          if (existingUser.household_id) {
            logger.debug('Store: User has household, loading...');
            logger.debug('Store: household_id:', existingUser.household_id);
            try {
              household = await userService.getHouseholdById(
                existingUser.household_id
              );
              logger.debug('Store: Loaded household:', household);
              if (household) {
                users = await userService.getHouseholdMembers(household.id);
                logger.debug('Store: Loaded users:', users);
                set({ currentHousehold: household, users });
              } else {
                logger.debug(
                  'Store: No household found for ID:',
                  existingUser.household_id
                );
              }
            } catch (error) {
              logger.error('Store: Error loading household:', error);
            }
          }

          // Load pantry data
          const pantry = existingUser
            ? await supabaseService.getGroceryItems(
                existingUser.id,
                existingUser.household_id
              )
            : [];
          const shoppingList = existingUser
            ? await supabaseService.getShoppingListItems(
                existingUser.id,
                existingUser.household_id
              )
            : [];
          const recipes = existingUser
            ? await supabaseService.getRecipes(
                existingUser.id,
                existingUser.household_id
              )
            : [];

          logger.debug('Store: Setting state with user:', existingUser);
          set({
            currentUser: existingUser,
            currentHousehold: household,
            users,
            pantry,
            shoppingList,
            recipes,
            isLoading: false,
          });

          // Start live sync for household members.
          if (household) {
            get().startRealtimeSync(household.id);
          }
        } catch (error) {
          logger.error('Store: Error initializing user:', error);
          set({ error: 'Failed to initialize user', isLoading: false });
        }
      },

      setCurrentUser: (user: User) => {
        set({ currentUser: user });
      },

      // Subscribe to live household changes and reconcile them into local
      // state. The current user's own writes are already applied optimistically,
      // so we upsert by id (no duplicates) and ignore our own echoes.
      startRealtimeSync: (householdId: string) => {
        const applyChange = (change: TableChange) => {
          if (change.table === 'grocery_items') {
            const row = (change.new ??
              change.old) as unknown as SupabaseGroceryItem;
            if (!row) return;
            if (change.type === 'DELETE') {
              set(state => ({
                pantry: state.pantry.filter(i => i.id !== row.id),
              }));
              return;
            }
            // Upsert by id — our own optimistic writes are deduped, remote
            // members' changes are merged in live.
            const item = supabaseService.mapGroceryRow(row);
            set(state => {
              const exists = state.pantry.some(i => i.id === item.id);
              return exists
                ? {
                    pantry: state.pantry.map(i =>
                      i.id === item.id ? item : i
                    ),
                  }
                : { pantry: [...state.pantry, item] };
            });
          } else if (change.table === 'shopping_list_items') {
            const row = (change.new ??
              change.old) as unknown as SupabaseShoppingListItem;
            if (!row) return;
            if (change.type === 'DELETE') {
              set(state => ({
                shoppingList: state.shoppingList.filter(i => i.id !== row.id),
              }));
              return;
            }
            const item = supabaseService.mapShoppingRow(row);
            set(state => {
              const exists = state.shoppingList.some(i => i.id === item.id);
              return exists
                ? {
                    shoppingList: state.shoppingList.map(i =>
                      i.id === item.id ? item : i
                    ),
                  }
                : { shoppingList: [...state.shoppingList, item] };
            });
          }
          // recipes / household_activity are refreshed on their own screens.
        };

        realtimeService.subscribe(householdId, applyChange);
      },

      stopRealtimeSync: () => {
        realtimeService.unsubscribe();
      },

      setCurrentHousehold: (household: Household) => {
        set({ currentHousehold: household });
      },

      createHousehold: async (name: string) => {
        const { currentUser } = get();
        if (!currentUser) throw new Error('No current user');

        const household = await userService.createHousehold(
          currentUser.id,
          name
        );
        if (!household) throw new Error('Failed to create household');

        set({ currentHousehold: household });
        get().startRealtimeSync(household.id);
        return household;
      },

      joinHousehold: async (code: string) => {
        const { currentUser } = get();
        if (!currentUser) return false;

        try {
          const household = await userService.joinHousehold(
            currentUser.id,
            code
          );
          if (household) {
            const users = await userService.getHouseholdMembers(household.id);
            // Update current user with household info
            const updatedUser = await userService.getUserById(currentUser.id);
            set({
              currentHousehold: household,
              users,
              currentUser: updatedUser,
            });
            userService.addActivityLog({
              householdId: household.id,
              userId: currentUser.id,
              userName: currentUser.name,
              action: 'joined',
            });
            get().startRealtimeSync(household.id);
            return true;
          }
          return false;
        } catch (error) {
          logger.error('Error joining household:', error);
          return false;
        }
      },

      leaveHousehold: async () => {
        const { currentUser } = get();
        if (!currentUser) return;

        get().stopRealtimeSync();
        await userService.leaveHousehold(currentUser.id);
        set({ currentHousehold: null, users: [] });
      },

      updateUserProfile: async (updates: Partial<User>) => {
        const { currentUser } = get();
        if (!currentUser) return;

        const updatedUser = await userService.updateUserProfile(
          currentUser.id,
          updates
        );
        if (updatedUser) {
          set({ currentUser: updatedUser });
        }
      },

      updateHouseholdSettings: async (
        householdId: string,
        updates: Partial<Household>
      ) => {
        const { currentHousehold } = get();
        if (!currentHousehold || currentHousehold.id !== householdId) return;

        try {
          const updatedHousehold = await userService.updateHouseholdSettings(
            householdId,
            updates
          );
          if (updatedHousehold) {
            set({ currentHousehold: updatedHousehold });
          }
        } catch (error) {
          logger.error('Error updating household settings:', error);
          set({ error: 'Failed to update household settings' });
        }
      },

      // Grocery Item Actions (with user context)
      addGroceryItem: async (item, isShared = true) => {
        const { currentUser, currentHousehold } = get();
        if (!currentUser) return;

        try {
          const newItem = await supabaseService.addGroceryItem(
            {
              ...item,
              addedBy: currentUser.id,
              isShared,
              householdId: isShared ? currentHousehold?.id : undefined,
              isUsed: false,
              isExpired: false,
            },
            currentUser.id
          );

          set(state => ({ pantry: [...state.pantry, newItem] }));

          // Track lifetime engagement counter for achievements.
          useEngagementStore.getState().incrementItemsAdded();

          // Log to the household activity feed if shared.
          if (isShared && currentHousehold) {
            userService.addActivityLog({
              householdId: currentHousehold.id,
              userId: currentUser.id,
              userName: currentUser.name,
              action: 'added',
              itemName: newItem.name,
              itemType: 'pantry',
            });
          }

          // Schedule notifications for new items
          if (newItem.expirationDate) {
            await notificationService.scheduleExpirationNotification(newItem);
          }
          if (newItem.quantity <= 1) {
            await notificationService.scheduleLowStockNotification(newItem);
          }

          // Send household notification if shared
          if (isShared && currentHousehold) {
            await notificationService.scheduleHouseholdUpdateNotification(
              currentHousehold.name,
              currentUser.name,
              'added',
              newItem.name
            );
          }
        } catch (error) {
          logger.error('Error adding grocery item:', error);
          set({ error: 'Failed to add item' });
        }
      },

      updateGroceryItem: async (id, updates) => {
        const { currentUser, currentHousehold } = get();
        if (!currentUser) return;

        try {
          const updatedItem = await supabaseService.updateGroceryItem(
            id,
            updates
          );
          if (updatedItem) {
            set(state => ({
              pantry: state.pantry.map(item =>
                item.id === id ? updatedItem : item
              ),
            }));

            // Schedule notifications for updated items
            if (updates.expirationDate && updatedItem.expirationDate) {
              await notificationService.scheduleExpirationNotification(
                updatedItem
              );
            }
            if (updates.quantity !== undefined && updatedItem.quantity <= 1) {
              await notificationService.scheduleLowStockNotification(
                updatedItem
              );
            }

            // Send household notification if shared
            if (updatedItem.isShared && currentHousehold) {
              await notificationService.scheduleHouseholdUpdateNotification(
                currentHousehold.name,
                currentUser.name,
                'updated',
                updatedItem.name
              );
            }
          }
        } catch (error) {
          logger.error('Error updating grocery item:', error);
          set({ error: 'Failed to update item' });
        }
      },

      removeGroceryItem: async id => {
        const { currentUser, currentHousehold } = get();
        if (!currentUser) return;

        try {
          const itemToRemove = get().pantry.find(item => item.id === id);
          await supabaseService.deleteGroceryItem(id);
          set(state => ({
            pantry: state.pantry.filter(item => item.id !== id),
          }));

          // Send household notification if shared
          if (itemToRemove?.isShared && currentHousehold) {
            await notificationService.scheduleHouseholdUpdateNotification(
              currentHousehold.name,
              currentUser.name,
              'removed',
              itemToRemove.name
            );
            userService.addActivityLog({
              householdId: currentHousehold.id,
              userId: currentUser.id,
              userName: currentUser.name,
              action: 'removed',
              itemName: itemToRemove.name,
              itemType: 'pantry',
            });
          }
        } catch (error) {
          logger.error('Error removing grocery item:', error);
          set({ error: 'Failed to remove item' });
        }
      },

      markItemAsUsed: async id => {
        const { currentUser, currentHousehold } = get();
        if (!currentUser) return;

        try {
          const itemToMark = get().pantry.find(item => item.id === id);
          await get().updateGroceryItem(id, { isUsed: true });

          // Send household notification if shared
          if (itemToMark?.isShared && currentHousehold) {
            await notificationService.scheduleHouseholdUpdateNotification(
              currentHousehold.name,
              currentUser.name,
              'used',
              itemToMark.name
            );
            userService.addActivityLog({
              householdId: currentHousehold.id,
              userId: currentUser.id,
              userName: currentUser.name,
              action: 'used',
              itemName: itemToMark.name,
              itemType: 'pantry',
            });
          }
        } catch (error) {
          logger.error('Error marking item as used:', error);
        }
      },

      markItemAsExpired: async id => {
        await get().updateGroceryItem(id, { isExpired: true });
      },

      // Shopping List Actions (with user context)
      addShoppingListItem: async (item, isShared = true) => {
        const { currentUser, currentHousehold } = get();
        if (!currentUser) return;

        try {
          const newItem = await supabaseService.addShoppingListItem(
            {
              ...item,
              addedBy: currentUser.id,
              isShared,
              householdId: isShared ? currentHousehold?.id : undefined,
              isCompleted: false,
            },
            currentUser.id
          );

          set(state => ({ shoppingList: [...state.shoppingList, newItem] }));
        } catch (error) {
          logger.error('Error adding shopping list item:', error);
          set({ error: 'Failed to add item' });
        }
      },

      updateShoppingListItem: async (id, updates) => {
        const { currentUser } = get();
        if (!currentUser) return;

        try {
          const updatedItem = await supabaseService.updateShoppingListItem(
            id,
            updates
          );
          if (updatedItem) {
            set(state => ({
              shoppingList: state.shoppingList.map(item =>
                item.id === id ? updatedItem : item
              ),
            }));
          }
        } catch (error) {
          logger.error('Error updating shopping list item:', error);
          set({ error: 'Failed to update item' });
        }
      },

      removeShoppingListItem: async id => {
        const { currentUser } = get();
        if (!currentUser) return;

        try {
          await supabaseService.deleteShoppingListItem(id);
          set(state => ({
            shoppingList: state.shoppingList.filter(item => item.id !== id),
          }));
        } catch (error) {
          logger.error('Error removing shopping list item:', error);
          set({ error: 'Failed to remove item' });
        }
      },

      toggleShoppingItemComplete: async id => {
        const { currentUser } = get();
        if (!currentUser) return;

        try {
          const currentItem = get().shoppingList.find(item => item.id === id);
          if (currentItem) {
            const updatedItem = await supabaseService.updateShoppingListItem(
              id,
              {
                isCompleted: !currentItem.isCompleted,
              }
            );
            if (updatedItem) {
              set(state => ({
                shoppingList: state.shoppingList.map(item =>
                  item.id === id ? updatedItem : item
                ),
              }));
              // Count each completion toward the "Smart Shopper" achievement.
              useEngagementStore
                .getState()
                .incrementShoppingCompleted(updatedItem.isCompleted ? 1 : -1);
            }
          }
        } catch (error) {
          logger.error('Error toggling shopping list item:', error);
          set({ error: 'Failed to update item' });
        }
      },

      // Refresh pantry data from database
      refreshPantry: async () => {
        const { currentUser, currentHousehold } = get();
        if (!currentUser) return;

        try {
          const pantryItems = await supabaseService.getGroceryItems(
            currentUser.id,
            currentHousehold?.id
          );
          set({ pantry: pantryItems });
        } catch (error) {
          logger.error('Error refreshing pantry:', error);
        }
      },

      // Recipe Actions (with user context)
      addRecipe: async (recipe, isShared = true) => {
        const { currentUser, currentHousehold } = get();
        if (!currentUser) return;

        try {
          const newRecipe = await supabaseService.addRecipe(
            {
              ...recipe,
              createdBy: currentUser.id,
              householdId: isShared ? currentHousehold?.id : undefined,
              isShared,
            },
            currentUser.id
          );

          set(state => ({ recipes: [...state.recipes, newRecipe] }));
        } catch (error) {
          logger.error('Error adding recipe:', error);
          set({ error: 'Failed to add recipe' });
        }
      },

      updateRecipe: async (id, updates) => {
        // Optimistic local update; persist to Supabase in the background.
        set(state => ({
          recipes: state.recipes.map(recipe =>
            recipe.id === id ? { ...recipe, ...updates } : recipe
          ),
        }));
        try {
          await supabaseService.updateRecipe(id, updates);
        } catch (error) {
          logger.error('Error persisting recipe update:', error);
        }
      },

      removeRecipe: async id => {
        const previous = get().recipes;
        set(state => ({
          recipes: state.recipes.filter(recipe => recipe.id !== id),
        }));
        try {
          await supabaseService.deleteRecipe(id);
        } catch (error) {
          logger.error('Error deleting recipe:', error);
          set({ recipes: previous });
        }
      },

      // Preferences
      updatePreferences: updates => {
        set(state => ({
          preferences: { ...state.preferences, ...updates },
        }));
      },

      // Seed a realistic starter pantry, recipes, and shopping list. Used from
      // empty states so a brand-new account isn't a blank slate.
      seedSampleData: async () => {
        const { addGroceryItem, addRecipe, addShoppingListItem } = get();
        for (const item of samplePantry()) {
          await addGroceryItem(item, item.isShared);
        }
        for (const recipe of sampleRecipes()) {
          await addRecipe(recipe, recipe.isShared);
        }
        for (const item of sampleShopping()) {
          await addShoppingListItem(item, item.isShared);
        }
      },

      // Computed getters
      getExpiringItems: () => {
        const { pantry } = get();
        return pantry.filter(item => isExpiringSoon(item));
      },

      getLowStockItems: () => {
        const { pantry, preferences } = get();
        return pantry.filter(
          item => item.quantity <= preferences.lowStockThreshold
        );
      },

      getAvailableRecipes: () => {
        const { recipes } = get();
        return recipes.filter(recipe => recipe.canCookNow);
      },

      getAccessibleItems: () => {
        const { pantry, currentUser } = get();
        return pantry.filter(
          item => item.addedBy === currentUser?.id || item.isShared
        );
      },

      getPersonalItems: () => {
        const { pantry, currentUser } = get();
        return pantry.filter(item => item.addedBy === currentUser?.id);
      },

      getSharedItems: () => {
        const { pantry } = get();
        return pantry.filter(item => item.isShared);
      },

      getHouseholdMembers: () => {
        const { users } = get();
        return users;
      },
    }),
    {
      name: 'pantrypal-multiuser-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
