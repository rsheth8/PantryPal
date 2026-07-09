import { Recipe } from '../types';
import { supabase } from '../lib/supabaseClient';
import { supabaseService } from './supabaseService';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

function externalTag(source: string, id: string): string {
  return `${source}:${id}`;
}

export async function ensureRecipeInDatabase(
  recipe: Recipe,
  userId: string,
  householdId?: string | null
): Promise<string> {
  if (isUuid(recipe.id)) {
    const { data } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', recipe.id)
      .maybeSingle();

    if (data) return recipe.id;
  }

  const tag = externalTag('spoonacular', String(recipe.id));
  const { data: existing } = await supabase
    .from('recipes')
    .select('id')
    .contains('tags', [tag])
    .maybeSingle();

  if (existing) return existing.id;

  const saved = await supabaseService.addRecipe(
    {
      title: recipe.title,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      prepTime: recipe.prepTime || 0,
      cookTime: recipe.cookTime || 0,
      servings: recipe.servings || 4,
      image: recipe.image,
      canCookNow: recipe.canCookNow ?? false,
      missingIngredients: recipe.missingIngredients || [],
      tags: [...(recipe.tags || []), tag],
      createdBy: userId,
      householdId: householdId || undefined,
      isShared: !!householdId,
      cuisines: recipe.cuisines,
      dishTypes: recipe.dishTypes,
      diets: recipe.diets,
      equipment: recipe.equipment,
      winePairing: recipe.winePairing,
    },
    userId
  );

  return saved.id;
}
