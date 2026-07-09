import { UserRecipePreferences, UserPreferences } from '../types';
import { supabase } from '../lib/supabaseClient';

export class UserPreferencesService {
  private static instance: UserPreferencesService;

  public static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
    }
    return UserPreferencesService.instance;
  }

  /**
   * Get user recipe preferences
   */
  async getUserRecipePreferences(userId: string): Promise<UserRecipePreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_recipe_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return null;
        }
        console.error('Error fetching user recipe preferences:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserRecipePreferences:', error);
      throw error;
    }
  }

  /**
   * Save user recipe preferences (from onboarding quiz)
   */
  async saveUserRecipePreferences(
    userId: string,
    preferences: Record<string, unknown>
  ): Promise<UserRecipePreferences> {
    try {
      const { data, error } = await supabase
        .from('user_recipe_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving user recipe preferences:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in saveUserRecipePreferences:', error);
      throw error;
    }
  }

  /**
   * Update user recipe preferences
   */
  async updateUserRecipePreferences(userId: string, updates: Partial<UserRecipePreferences>): Promise<UserRecipePreferences> {
    try {
      const { data, error } = await supabase
        .from('user_recipe_preferences')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user recipe preferences:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateUserRecipePreferences:', error);
      throw error;
    }
  }

  /**
   * Convert UserPreferences to UserRecipePreferences format
   */
  convertToRecipePreferences(
    userPreferences: Partial<UserPreferences>
  ): Record<string, unknown> {
    const cookingTimeMap: Record<string, number> = {
      quick: 30,
      medium: 60,
      slow: 120,
    };
    const spiceMap: Record<string, string> = {
      mild: 'low',
      medium: 'medium',
      hot: 'high',
    };

    const preferredTime = userPreferences.preferredCookingTime || 'medium';

    return {
      dietary_restrictions: userPreferences.dietaryRestrictions || [],
      allergies: userPreferences.allergies || [],
      preferred_cuisines: userPreferences.preferredCuisines || [],
      cooking_skill: userPreferences.cookingSkill || 'beginner',
      spice_tolerance:
        spiceMap[userPreferences.spiceTolerance || 'medium'] || 'medium',
      health_goals: userPreferences.healthGoals || [],
      nutrition_goals: {
        maxCalories: userPreferences.calorieTarget || 2000,
        minProtein: 50,
        maxCarbs: 250,
        maxFat: 65,
      },
      difficulty_preference: 'any',
      max_cooking_time: cookingTimeMap[preferredTime] || 60,
      serving_size_preference: userPreferences.preferredServings || 4,
    };
  }

  /**
   * Save preferences from onboarding quiz
   */
  async saveOnboardingPreferences(
    userId: string,
    userPreferences: Partial<UserPreferences>
  ): Promise<UserRecipePreferences> {
    try {
      const recipePreferences = this.convertToRecipePreferences(userPreferences);
      return await this.saveUserRecipePreferences(userId, recipePreferences);
    } catch (error) {
      console.error('Error in saveOnboardingPreferences:', error);
      throw error;
    }
  }

  /**
   * Get default preferences for new users
   */
  getDefaultPreferences(): UserRecipePreferences {
    return {
      userId: '',
      dietaryRestrictions: [],
      allergies: [],
      preferredCuisines: [],
      cookingSkill: 'beginner',
      spiceTolerance: 'medium',
      healthGoals: [],
      nutritionGoals: {
        maxCalories: 2000,
        minProtein: 50,
        maxCarbs: 250,
        maxFat: 65,
      },
      difficultyPreference: 'any',
      maxCookingTime: 60,
      servingSizePreference: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export const userPreferencesService = UserPreferencesService.getInstance();
