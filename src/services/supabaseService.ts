import { createClient } from '@supabase/supabase-js';
import {
  User,
  Household,
  GroceryItem,
  Recipe,
  ShoppingListItem,
  UserPreferences,
} from '../types';
import { generateId } from '../utils/helpers';
import { isDevMode, getCurrentDevUser } from '../config/dev';

import { SUPABASE_CONFIG } from '../config/supabase';

const SUPABASE_URL = SUPABASE_CONFIG.URL;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.ANON_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SupabaseUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  household_id?: string;
  created_at: string;
  last_active: string;
}

export interface SupabaseHousehold {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  members: string[];
  created_at: string;
  settings: {
    allow_private_items: boolean;
    require_approval_for_shared: boolean;
    default_item_visibility: 'shared' | 'private';
  };
}

export interface SupabaseGroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiration_date: string;
  added_by: string;
  is_shared: boolean;
  household_id?: string;
  price?: number;
  notes?: string;
  is_expired: boolean;
  is_used: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseRecipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  image?: string;
  can_cook_now: boolean;
  missing_ingredients: string[];
  tags: string[];
  created_by: string;
  household_id?: string;
  is_shared: boolean;
  created_at: string;
  // Advanced features
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  cuisines?: string[];
  dish_types?: string[];
  diets?: string[];
  equipment?: string[];
  wine_pairing?: {
    pairedWines: string[];
    pairingText: string;
  };
  original_servings?: number;
  scaled_servings?: number;
  scaled_ingredients?: Array<{
    name: string;
    amount: number;
    unit: string;
    originalAmount: number;
  }>;
}

export interface SupabaseShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  is_completed: boolean;
  added_by: string;
  household_id?: string;
  is_shared: boolean;
  notes?: string;
  price?: number;
  created_at: string;
}

class SupabaseService {
  public supabase = supabase;
  // User Management
  async getCurrentUser(): Promise<User | null> {
    try {
      // Development mode bypass
      if (isDevMode()) {
        console.log('DEV MODE: Returning test user from supabase service');
        const devUser = getCurrentDevUser();
        return {
          ...devUser,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          householdId: undefined,
        };
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        return this.convertSupabaseUserToUser(profile);
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async createUser(userData: {
    name: string;
    email: string;
    avatar?: string;
  }): Promise<User> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const newUser: SupabaseUser = {
      id: user.id,
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (error) throw error;
    return this.convertSupabaseUserToUser(data);
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<User | null> {
    const supabaseUpdates: Partial<SupabaseUser> = {};

    if (updates.name) supabaseUpdates.name = updates.name;
    if (updates.email) supabaseUpdates.email = updates.email;
    if (updates.avatar) supabaseUpdates.avatar = updates.avatar;
    if (updates.householdId) supabaseUpdates.household_id = updates.householdId;

    supabaseUpdates.last_active = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(supabaseUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data ? this.convertSupabaseUserToUser(data) : null;
  }

  // Development helper to disable RLS temporarily
  private async disableRLSForDev() {
    if (isDevMode()) {
      try {
        // Try to disable RLS temporarily for development
        await supabase.rpc('disable_rls_for_dev');
      } catch (error) {
        console.log('Could not disable RLS, continuing with normal flow');
      }
    }
  }

  // Household Management
  async createHousehold(name: string, ownerId: string): Promise<Household> {
    console.log('Starting household creation for owner:', ownerId);

    // First, check if the user exists in our users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', ownerId)
      .single();

    if (userError || !user) {
      console.error('User not found or error:', userError);

      // For dev mode, create the user first
      if (isDevMode()) {
        console.log('Creating user for dev mode');

        // Try to create the user profile
        const { error: createUserError } = await supabase.from('users').insert({
          id: ownerId,
          name: getCurrentDevUser().name,
          email: getCurrentDevUser().email,
          avatar: 'https://i.pravatar.cc/150?img=1',
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
        });

        if (createUserError) {
          console.error('Error creating user profile:', createUserError);

          // If user creation fails, let's try creating the household anyway
          // The household creation should work even if the user doesn't exist yet
          console.log(
            'Proceeding with household creation despite user creation failure'
          );
        } else {
          console.log('User created successfully');
        }
      } else {
        throw new Error('User not found');
      }
    }

    // Now create the household
    const code = this.generateHouseholdCode();

    const newHousehold: Omit<SupabaseHousehold, 'id'> = {
      name,
      code,
      owner_id: ownerId,
      members: [ownerId],
      created_at: new Date().toISOString(),
      settings: {
        allow_private_items: true,
        require_approval_for_shared: false,
        default_item_visibility: 'shared',
      },
    };

    console.log('Creating household with data:', newHousehold);

    const { data, error } = await supabase
      .from('households')
      .insert(newHousehold)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating household:', error);
      throw error;
    }

    console.log('Household created successfully:', data);

    // Try to update user's household, but don't fail if it doesn't work
    const { error: updateError } = await supabase
      .from('users')
      .update({ household_id: data.id })
      .eq('id', ownerId);

    if (updateError) {
      console.error(
        'Error updating user household (non-critical):',
        updateError
      );
      // Don't throw here, as the household was created successfully
    } else {
      console.log('User household updated successfully');
    }

    return this.convertSupabaseHouseholdToHousehold(data);
  }

  async getHouseholdById(householdId: string): Promise<Household | null> {
    const { data, error } = await supabase
      .from('households')
      .select('*')
      .eq('id', householdId)
      .single();

    if (error) return null;
    return data ? this.convertSupabaseHouseholdToHousehold(data) : null;
  }

  async joinHousehold(
    userId: string,
    householdCode: string
  ): Promise<Household | null> {
    // Find household by code
    const { data: household, error: householdError } = await supabase
      .from('households')
      .select('*')
      .eq('code', householdCode)
      .single();

    if (householdError || !household) return null;

    // Add user to household members
    const updatedMembers = [...household.members, userId];

    const { data, error } = await supabase
      .from('households')
      .update({ members: updatedMembers })
      .eq('id', household.id)
      .select()
      .single();

    if (error) throw error;

    // Update user's household
    const { error: updateError } = await supabase
      .from('users')
      .update({ household_id: data.id })
      .eq('id', userId);

    if (updateError) throw updateError;

    return this.convertSupabaseHouseholdToHousehold(data);
  }

  async getHouseholdMembers(householdId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('household_id', householdId);

    if (error) return [];
    return data.map(user => this.convertSupabaseUserToUser(user));
  }

  // Grocery Items
  async getGroceryItems(
    userId: string,
    householdId?: string
  ): Promise<GroceryItem[]> {
    let query = supabase
      .from('grocery_items')
      .select('*')
      .or(
        `added_by.eq.${userId},and(is_shared.eq.true,household_id.eq.${householdId})`
      );

    const { data, error } = await query;
    if (error) return [];

    return data.map(item => this.convertSupabaseGroceryItemToGroceryItem(item));
  }

  async addGroceryItem(
    item: Omit<GroceryItem, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<GroceryItem> {
    const supabaseItem: Omit<
      SupabaseGroceryItem,
      'id' | 'created_at' | 'updated_at'
    > = {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      expiration_date: item.expirationDate,
      added_by: userId,
      is_shared: item.isShared,
      household_id: item.householdId,
      price: item.price,
      notes: item.notes,
      is_expired: item.isExpired,
      is_used: item.isUsed,
    };

    const { data, error } = await supabase
      .from('grocery_items')
      .insert({
        id: this.generateUUID(),
        ...supabaseItem,
      })
      .select()
      .single();

    if (error) throw error;
    return this.convertSupabaseGroceryItemToGroceryItem(data);
  }

  async updateGroceryItem(
    id: string,
    updates: Partial<GroceryItem>
  ): Promise<GroceryItem | null> {
    const supabaseUpdates: Partial<SupabaseGroceryItem> = {};

    if (updates.name) supabaseUpdates.name = updates.name;
    if (updates.quantity !== undefined)
      supabaseUpdates.quantity = updates.quantity;
    if (updates.unit) supabaseUpdates.unit = updates.unit;
    if (updates.category) supabaseUpdates.category = updates.category;
    if (updates.expirationDate)
      supabaseUpdates.expiration_date = updates.expirationDate;
    if (updates.price !== undefined) supabaseUpdates.price = updates.price;
    if (updates.notes) supabaseUpdates.notes = updates.notes;
    if (updates.isExpired !== undefined)
      supabaseUpdates.is_expired = updates.isExpired;
    if (updates.isUsed !== undefined) supabaseUpdates.is_used = updates.isUsed;

    supabaseUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('grocery_items')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data ? this.convertSupabaseGroceryItemToGroceryItem(data) : null;
  }

  async deleteGroceryItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Shopping List
  async getShoppingListItems(
    userId: string,
    householdId?: string
  ): Promise<ShoppingListItem[]> {
    let query = supabase
      .from('shopping_list_items')
      .select('*')
      .or(
        `added_by.eq.${userId},and(is_shared.eq.true,household_id.eq.${householdId})`
      );

    const { data, error } = await query;
    if (error) return [];

    return data.map(item =>
      this.convertSupabaseShoppingListItemToShoppingListItem(item)
    );
  }

  async addShoppingListItem(
    item: Omit<ShoppingListItem, 'id' | 'createdAt'>,
    userId: string
  ): Promise<ShoppingListItem> {
    const supabaseItem: Omit<SupabaseShoppingListItem, 'id' | 'created_at'> = {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      price: item.price,
      is_completed: item.isCompleted,
      added_by: userId,
      household_id: item.householdId,
      is_shared: item.isShared,
      notes: item.notes,
    };

    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert({
        id: this.generateUUID(),
        ...supabaseItem,
      })
      .select()
      .single();

    if (error) throw error;
    return this.convertSupabaseShoppingListItemToShoppingListItem(data);
  }

  async updateShoppingListItem(
    id: string,
    updates: Partial<ShoppingListItem>
  ): Promise<ShoppingListItem | null> {
    const supabaseUpdates: any = {};

    if (updates.name) supabaseUpdates.name = updates.name;
    if (updates.quantity !== undefined)
      supabaseUpdates.quantity = updates.quantity;
    if (updates.unit) supabaseUpdates.unit = updates.unit;
    if (updates.category !== undefined)
      supabaseUpdates.category = updates.category;
    if (updates.price !== undefined) supabaseUpdates.price = updates.price;
    if (updates.isCompleted !== undefined)
      supabaseUpdates.is_completed = updates.isCompleted;
    if (updates.notes) supabaseUpdates.notes = updates.notes;

    const { data, error } = await supabase
      .from('shopping_list_items')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data
      ? this.convertSupabaseShoppingListItemToShoppingListItem(data)
      : null;
  }

  async deleteShoppingListItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Recipes
  async getRecipes(userId: string, householdId?: string): Promise<Recipe[]> {
    let query = supabase
      .from('recipes')
      .select('*')
      .or(
        `created_by.eq.${userId},and(is_shared.eq.true,household_id.eq.${householdId})`
      );

    const { data, error } = await query;
    if (error) return [];

    return data.map(recipe => this.convertSupabaseRecipeToRecipe(recipe));
  }

  async addRecipe(
    recipe: Omit<Recipe, 'id' | 'createdAt'>,
    userId: string
  ): Promise<Recipe> {
    const supabaseRecipe: Omit<SupabaseRecipe, 'id' | 'created_at'> = {
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      prep_time: recipe.prepTime,
      cook_time: recipe.cookTime,
      servings: recipe.servings,
      image: recipe.image,
      can_cook_now: recipe.canCookNow,
      missing_ingredients: recipe.missingIngredients,
      tags: recipe.tags,
      created_by: userId,
      household_id: recipe.householdId,
      is_shared: recipe.isShared,
    };

    const { data, error } = await supabase
      .from('recipes')
      .insert({
        id: this.generateUUID(),
        ...supabaseRecipe,
      })
      .select()
      .single();

    if (error) throw error;
    return this.convertSupabaseRecipeToRecipe(data);
  }

  // Utility Methods
  private generateHouseholdCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  // Conversion Methods
  public convertSupabaseUserToUser(supabaseUser: SupabaseUser): User {
    return {
      id: supabaseUser.id,
      name: supabaseUser.name,
      email: supabaseUser.email,
      avatar: supabaseUser.avatar,
      householdId: supabaseUser.household_id,
      createdAt: supabaseUser.created_at,
      lastActive: supabaseUser.last_active,
    };
  }

  public convertSupabaseHouseholdToHousehold(
    supabaseHousehold: SupabaseHousehold
  ): Household {
    return {
      id: supabaseHousehold.id,
      name: supabaseHousehold.name,
      code: supabaseHousehold.code,
      ownerId: supabaseHousehold.owner_id,
      members: supabaseHousehold.members,
      createdAt: supabaseHousehold.created_at,
      settings: {
        allowPrivateItems: supabaseHousehold.settings.allow_private_items,
        requireApprovalForShared:
          supabaseHousehold.settings.require_approval_for_shared,
        defaultItemVisibility:
          supabaseHousehold.settings.default_item_visibility,
      },
    };
  }

  private convertSupabaseGroceryItemToGroceryItem(
    supabaseItem: SupabaseGroceryItem
  ): GroceryItem {
    return {
      id: supabaseItem.id,
      name: supabaseItem.name,
      quantity: supabaseItem.quantity,
      unit: supabaseItem.unit,
      category: supabaseItem.category,
      expirationDate: supabaseItem.expiration_date,
      addedBy: supabaseItem.added_by,
      isShared: supabaseItem.is_shared,
      householdId: supabaseItem.household_id,
      price: supabaseItem.price,
      notes: supabaseItem.notes,
      isExpired: supabaseItem.is_expired,
      isUsed: supabaseItem.is_used,
      createdAt: supabaseItem.created_at,
      updatedAt: supabaseItem.updated_at,
    };
  }

  private convertSupabaseShoppingListItemToShoppingListItem(
    supabaseItem: SupabaseShoppingListItem
  ): ShoppingListItem {
    return {
      id: supabaseItem.id,
      name: supabaseItem.name,
      quantity: supabaseItem.quantity,
      unit: supabaseItem.unit,
      category: supabaseItem.category,
      isCompleted: supabaseItem.is_completed,
      addedBy: supabaseItem.added_by,
      householdId: supabaseItem.household_id,
      isShared: supabaseItem.is_shared,
      notes: supabaseItem.notes,
      price: supabaseItem.price,
      createdAt: supabaseItem.created_at,
    };
  }

  private convertSupabaseRecipeToRecipe(
    supabaseRecipe: SupabaseRecipe
  ): Recipe {
    return {
      id: supabaseRecipe.id,
      title: supabaseRecipe.title,
      ingredients: supabaseRecipe.ingredients,
      instructions: supabaseRecipe.instructions,
      prepTime: supabaseRecipe.prep_time,
      cookTime: supabaseRecipe.cook_time,
      servings: supabaseRecipe.servings,
      image: supabaseRecipe.image,
      canCookNow: supabaseRecipe.can_cook_now,
      missingIngredients: supabaseRecipe.missing_ingredients,
      tags: supabaseRecipe.tags,
      createdBy: supabaseRecipe.created_by,
      householdId: supabaseRecipe.household_id,
      isShared: supabaseRecipe.is_shared,
      createdAt: supabaseRecipe.created_at,
      // Advanced features
      nutrition: supabaseRecipe.nutrition,
      cuisines: supabaseRecipe.cuisines,
      dishTypes: supabaseRecipe.dish_types,
      diets: supabaseRecipe.diets,
      equipment: supabaseRecipe.equipment,
      winePairing: supabaseRecipe.wine_pairing,
      originalServings: supabaseRecipe.original_servings,
      scaledServings: supabaseRecipe.scaled_servings,
      scaledIngredients: supabaseRecipe.scaled_ingredients,
    };
  }
}

export const supabaseService = new SupabaseService();
