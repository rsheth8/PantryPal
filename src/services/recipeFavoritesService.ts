import { RecipeFavorite } from '../types';
import { supabase } from '../lib/supabaseClient';

export class RecipeFavoritesService {
  private static instance: RecipeFavoritesService;

  public static getInstance(): RecipeFavoritesService {
    if (!RecipeFavoritesService.instance) {
      RecipeFavoritesService.instance = new RecipeFavoritesService();
    }
    return RecipeFavoritesService.instance;
  }

  /**
   * Get all favorite recipes for a user
   */
  async getFavorites(userId: string): Promise<RecipeFavorite[]> {
    try {
      const { data, error } = await supabase
        .from('recipe_favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorites:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFavorites:', error);
      throw error;
    }
  }

  /**
   * Get favorite recipe IDs for a user (for quick checking)
   */
  async getFavoriteRecipeIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('recipe_favorites')
        .select('recipe_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching favorite recipe IDs:', error);
        throw error;
      }

      return data?.map(fav => fav.recipe_id) || [];
    } catch (error) {
      console.error('Error in getFavoriteRecipeIds:', error);
      throw error;
    }
  }

  /**
   * Check if a recipe is favorited by a user
   */
  async isFavorited(userId: string, recipeId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('recipe_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking if favorited:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isFavorited:', error);
      return false;
    }
  }

  /**
   * Add a recipe to favorites
   */
  async addToFavorites(userId: string, recipeId: string): Promise<RecipeFavorite> {
    try {
      const { data, error } = await supabase
        .from('recipe_favorites')
        .insert({
          user_id: userId,
          recipe_id: recipeId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding to favorites:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in addToFavorites:', error);
      throw error;
    }
  }

  /**
   * Remove a recipe from favorites
   */
  async removeFromFavorites(userId: string, recipeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('recipe_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

      if (error) {
        console.error('Error removing from favorites:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in removeFromFavorites:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status for a recipe
   */
  async toggleFavorite(userId: string, recipeId: string): Promise<boolean> {
    try {
      const isFavorited = await this.isFavorited(userId, recipeId);
      
      if (isFavorited) {
        await this.removeFromFavorites(userId, recipeId);
        return false;
      } else {
        await this.addToFavorites(userId, recipeId);
        return true;
      }
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      throw error;
    }
  }

  /**
   * Get favorite recipes with full recipe data
   */
  async getFavoriteRecipes(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('recipe_favorites')
        .select(`
          *,
          recipes (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorite recipes:', error);
        throw error;
      }

      return data?.map(fav => fav.recipes) || [];
    } catch (error) {
      console.error('Error in getFavoriteRecipes:', error);
      throw error;
    }
  }
}

export const recipeFavoritesService = RecipeFavoritesService.getInstance();
