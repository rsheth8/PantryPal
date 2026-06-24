import axios from 'axios';
import { Recipe } from '../types';
import { generateId } from '../utils/helpers';

import { API_CONFIG } from '../config/api';

const SPOONACULAR_API_KEY = API_CONFIG.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com/recipes';

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  instructions: string;
  extendedIngredients: {
    original: string;
    name: string;
    amount: number;
    unit: string;
    id: number;
  }[];
  analyzedInstructions: {
    steps: {
      step: string;
      ingredients: { name: string; id: number }[];
      equipment: { name: string; id: number }[];
    }[];
  }[];
  nutrition: {
    nutrients: {
      name: string;
      amount: number;
      unit: string;
    }[];
  };
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  intolerances: string[];
  equipment: {
    id: number;
    name: string;
    localizedName: string;
    image: string;
  }[];
  winePairing?: {
    pairedWines: string[];
    pairingText: string;
    productMatches: {
      id: number;
      title: string;
      description: string;
      price: string;
      imageUrl: string;
      averageRating: number;
      ratingCount: number;
      score: number;
      link: string;
    }[];
  };
}

class RecipeService {
  async callSpoonacularAPI(endpoint: string, params: any = {}): Promise<any> {
    try {
      const response = await axios.get(`${SPOONACULAR_BASE_URL}${endpoint}`, {
        params: {
          ...params,
          apiKey: SPOONACULAR_API_KEY,
          addRecipeInformation: true,
          fillIngredients: true,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Spoonacular API error:', error);
      throw error;
    }
  }

  async searchRecipesByIngredients(ingredients: string[]): Promise<Recipe[]> {
    try {
      if (SPOONACULAR_API_KEY === 'YOUR_SPOONACULAR_API_KEY') {
        // Return mock data if API key not set
        return this.mockRecipeSearch(ingredients);
      }

      const ingredientsString = ingredients.join(',');
      const data = await this.callSpoonacularAPI('/findByIngredients', {
        ingredients: ingredientsString,
        number: 10,
        ranking: 2, // Maximize used ingredients
      });

      // Get detailed recipe information for each recipe
      const detailedRecipes = await Promise.all(
        data.map(async (recipe: any) => {
          try {
            const details = await this.getRecipeDetails(recipe.id);
            return details || this.convertSpoonacularToRecipe(recipe);
          } catch (error) {
            console.error(
              `Error getting details for recipe ${recipe.id}:`,
              error
            );
            return this.convertSpoonacularToRecipe(recipe);
          }
        })
      );

      return detailedRecipes.filter(Boolean);
    } catch (error) {
      console.error('Recipe search error:', error);
      return this.mockRecipeSearch(ingredients);
    }
  }

  async getRecipeDetails(recipeId: number): Promise<Recipe | null> {
    try {
      if (SPOONACULAR_API_KEY === 'YOUR_SPOONACULAR_API_KEY') {
        return null;
      }

      const data = await this.callSpoonacularAPI(`/${recipeId}/information`);
      return this.convertSpoonacularToRecipe(data);
    } catch (error) {
      console.error('Recipe details error:', error);
      return null;
    }
  }

  private convertSpoonacularToRecipe(
    spoonacularRecipe: SpoonacularRecipe
  ): Recipe {
    const ingredients = spoonacularRecipe.extendedIngredients.map(
      ing => ing.original
    );
    const instructions = this.extractInstructions(spoonacularRecipe);
    const tags = this.generateTags(spoonacularRecipe);

    // Extract nutrition information
    const nutrition = this.extractNutrition(spoonacularRecipe);

    // Extract equipment needed
    const equipment = this.extractEquipment(spoonacularRecipe);

    return {
      id: generateId(),
      title: spoonacularRecipe.title,
      ingredients,
      instructions,
      prepTime: Math.floor(spoonacularRecipe.readyInMinutes * 0.3), // Estimate prep time
      cookTime: Math.floor(spoonacularRecipe.readyInMinutes * 0.7), // Estimate cook time
      servings: spoonacularRecipe.servings,
      image: spoonacularRecipe.image,
      canCookNow: false, // Will be determined later
      missingIngredients: [],
      tags,
      createdBy: 'api',
      isShared: true,
      createdAt: new Date().toISOString(),

      // Advanced features
      nutrition,
      cuisines: spoonacularRecipe.cuisines,
      dishTypes: spoonacularRecipe.dishTypes,
      diets: spoonacularRecipe.diets,
      equipment,
      winePairing: spoonacularRecipe.winePairing
        ? {
            pairedWines: spoonacularRecipe.winePairing.pairedWines,
            pairingText: spoonacularRecipe.winePairing.pairingText,
          }
        : undefined,

      // Scaling support
      originalServings: spoonacularRecipe.servings,
      scaledServings: spoonacularRecipe.servings,
      scaledIngredients: spoonacularRecipe.extendedIngredients.map(ing => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        originalAmount: ing.amount,
      })),
    };
  }

  private extractInstructions(recipe: SpoonacularRecipe): string[] {
    if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
      return recipe.analyzedInstructions[0].steps.map(step => step.step);
    }

    // Fallback to plain instructions
    if (recipe.instructions) {
      return recipe.instructions
        .split('\n')
        .filter(step => step.trim().length > 0)
        .map(step => step.trim());
    }

    return [];
  }

  private generateTags(recipe: SpoonacularRecipe): string[] {
    const tags = [];

    if (recipe.readyInMinutes <= 30) tags.push('Quick');
    if (recipe.readyInMinutes <= 15) tags.push('Very Quick');
    if (recipe.servings <= 2) tags.push('Small Batch');
    if (recipe.servings >= 6) tags.push('Large Batch');

    return tags;
  }

  private extractNutrition(recipe: SpoonacularRecipe) {
    if (!recipe.nutrition?.nutrients) return undefined;

    const nutrients = recipe.nutrition.nutrients;
    const getNutrient = (name: string) => {
      const nutrient = nutrients.find(n =>
        n.name.toLowerCase().includes(name.toLowerCase())
      );
      return nutrient ? nutrient.amount : 0;
    };

    return {
      calories: getNutrient('calories'),
      protein: getNutrient('protein'),
      carbs: getNutrient('carbohydrates'),
      fat: getNutrient('fat'),
      fiber: getNutrient('fiber'),
      sugar: getNutrient('sugar'),
      sodium: getNutrient('sodium'),
    };
  }

  private extractEquipment(recipe: SpoonacularRecipe): string[] {
    const equipment = new Set<string>();

    // Add equipment from analyzed instructions
    if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
      recipe.analyzedInstructions[0].steps.forEach(step => {
        step.equipment?.forEach(eq => equipment.add(eq.name));
      });
    }

    // Add equipment from equipment array
    recipe.equipment?.forEach(eq => equipment.add(eq.name));

    return Array.from(equipment);
  }

  // Mock data for when API is not configured
  private mockRecipeSearch(ingredients: string[]): Recipe[] {
    const mockRecipes: Recipe[] = [
      {
        id: generateId(),
        title: 'Pasta with Tomato Sauce',
        ingredients: ['pasta', 'tomato sauce', 'garlic', 'olive oil'],
        instructions: [
          'Boil pasta according to package instructions',
          'Heat olive oil in a pan',
          'Add minced garlic and cook until fragrant',
          'Add tomato sauce and simmer',
          'Combine pasta with sauce',
        ],
        prepTime: 15,
        cookTime: 20,
        servings: 4,
        image:
          'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400',
        canCookNow: ingredients.some(ing =>
          ing.toLowerCase().includes('pasta')
        ),
        missingIngredients: ingredients.some(ing =>
          ing.toLowerCase().includes('pasta')
        )
          ? []
          : ['pasta'],
        tags: ['Quick', 'Italian'],
        createdBy: 'api',
        isShared: true,
        createdAt: new Date().toISOString(),

        // Advanced features for testing
        nutrition: {
          calories: 350,
          protein: 12,
          carbs: 65,
          fat: 8,
          fiber: 4,
          sugar: 6,
          sodium: 450,
        },
        cuisines: ['Italian'],
        dishTypes: ['main course'],
        diets: ['vegetarian'],
        equipment: ['pot', 'pan', 'strainer'],

        // Scaling support
        originalServings: 4,
        scaledServings: 4,
        scaledIngredients: [
          { name: 'pasta', amount: 8, unit: 'oz', originalAmount: 8 },
          { name: 'tomato sauce', amount: 2, unit: 'cups', originalAmount: 2 },
          { name: 'garlic', amount: 3, unit: 'cloves', originalAmount: 3 },
          { name: 'olive oil', amount: 2, unit: 'tbsp', originalAmount: 2 },
        ],
      },
      {
        id: generateId(),
        title: 'Chicken Stir Fry',
        ingredients: ['chicken breast', 'vegetables', 'soy sauce', 'rice'],
        instructions: [
          'Cut chicken into bite-sized pieces',
          'Cook chicken in a wok until golden',
          'Add vegetables and stir fry',
          'Add soy sauce and seasonings',
          'Serve over rice',
        ],
        prepTime: 10,
        cookTime: 15,
        servings: 2,
        image:
          'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
        canCookNow: ingredients.some(ing =>
          ing.toLowerCase().includes('chicken')
        ),
        missingIngredients: ingredients.some(ing =>
          ing.toLowerCase().includes('chicken')
        )
          ? []
          : ['chicken'],
        tags: ['Quick', 'Asian'],
        createdBy: 'api',
        isShared: true,
        createdAt: new Date().toISOString(),

        // Advanced features for testing
        nutrition: {
          calories: 420,
          protein: 28,
          carbs: 45,
          fat: 14,
          fiber: 6,
          sugar: 3,
          sodium: 680,
        },
        cuisines: ['Asian'],
        dishTypes: ['main course'],
        diets: ['high-protein'],
        equipment: ['wok', 'knife', 'cutting board'],

        // Scaling support
        originalServings: 2,
        scaledServings: 2,
        scaledIngredients: [
          { name: 'chicken breast', amount: 1, unit: 'lb', originalAmount: 1 },
          {
            name: 'mixed vegetables',
            amount: 2,
            unit: 'cups',
            originalAmount: 2,
          },
          { name: 'soy sauce', amount: 3, unit: 'tbsp', originalAmount: 3 },
          { name: 'rice', amount: 1, unit: 'cup', originalAmount: 1 },
        ],
      },
    ];

    return mockRecipes.filter(
      recipe => recipe.canCookNow || recipe.missingIngredients.length <= 2
    );
  }

  async getRandomRecipes(count: number = 5): Promise<Recipe[]> {
    try {
      if (SPOONACULAR_API_KEY === 'YOUR_SPOONACULAR_API_KEY') {
        return this.mockRecipeSearch(['pasta', 'chicken']);
      }

      const data = await this.callSpoonacularAPI('/random', { number: count });
      return data.recipes.map((recipe: any) =>
        this.convertSpoonacularToRecipe(recipe)
      );
    } catch (error) {
      console.error('Random recipes error:', error);
      return this.mockRecipeSearch(['pasta', 'chicken']);
    }
  }

  // New method: Search recipes by available ingredients
  async searchRecipesByAvailableIngredients(
    availableIngredients: string[]
  ): Promise<Recipe[]> {
    try {
      if (SPOONACULAR_API_KEY === 'YOUR_SPOONACULAR_API_KEY') {
        return this.mockRecipeSearch(availableIngredients);
      }

      console.log('Searching recipes with ingredients:', availableIngredients);

      // Use Spoonacular's findByIngredients endpoint for better matching
      const ingredientsString = availableIngredients.join(',');
      const data = await this.callSpoonacularAPI('/findByIngredients', {
        ingredients: ingredientsString,
        number: 15,
        ranking: 2, // Maximize used ingredients
        ignorePantry: true, // Ignore common pantry items like salt, oil, etc.
      });

      console.log('Found recipes:', data.length);

      // Get detailed recipe information and check ingredient availability
      const detailedRecipes = await Promise.all(
        data.map(async (recipe: any) => {
          try {
            const details = await this.getRecipeDetails(recipe.id);
            if (details) {
              // Check which ingredients are available and which are missing
              const { available, missing } = this.checkIngredientAvailability(
                details.ingredients,
                availableIngredients
              );

              details.canCookNow = missing.length === 0;
              details.missingIngredients = missing;

              console.log(
                `Recipe: ${details.title} - Available: ${available.length}, Missing: ${missing.length}`
              );

              return details;
            }
            return null;
          } catch (error) {
            console.error(
              `Error getting details for recipe ${recipe.id}:`,
              error
            );
            return null;
          }
        })
      );

      const validRecipes = detailedRecipes.filter(Boolean);
      console.log('Valid recipes found:', validRecipes.length);

      return validRecipes;
    } catch (error) {
      console.error('Available ingredients search error:', error);
      return this.mockRecipeSearch(availableIngredients);
    }
  }

  private checkIngredientAvailability(
    recipeIngredients: string[],
    availableIngredients: string[]
  ): {
    available: string[];
    missing: string[];
  } {
    const available = [];
    const missing = [];

    // Normalize ingredients for comparison
    const normalizedAvailable = availableIngredients.map(ing =>
      ing.toLowerCase().replace(/\s+/g, ' ').trim()
    );

    for (const ingredient of recipeIngredients) {
      const normalizedIngredient = ingredient
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

      // Check if this ingredient is available
      const isAvailable = normalizedAvailable.some(
        available =>
          available.includes(normalizedIngredient) ||
          normalizedIngredient.includes(available)
      );

      if (isAvailable) {
        available.push(ingredient);
      } else {
        missing.push(ingredient);
      }
    }

    return { available, missing };
  }

  // New method: Get recipe recommendations based on user preferences
  async getRecipeRecommendations(preferences: {
    cuisine?: string[];
    diet?: string[];
    intolerances?: string[];
    maxReadyTime?: number;
  }): Promise<Recipe[]> {
    try {
      if (SPOONACULAR_API_KEY === 'YOUR_SPOONACULAR_API_KEY') {
        return this.mockRecipeSearch(['pasta', 'chicken']);
      }

      const params: any = {
        number: 10,
        addRecipeInformation: true,
        fillIngredients: true,
      };

      if (preferences.cuisine?.length) {
        params.cuisine = preferences.cuisine.join(',');
      }
      if (preferences.diet?.length) {
        params.diet = preferences.diet.join(',');
      }
      if (preferences.intolerances?.length) {
        params.intolerances = preferences.intolerances.join(',');
      }
      if (preferences.maxReadyTime) {
        params.maxReadyTime = preferences.maxReadyTime;
      }

      const data = await this.callSpoonacularAPI('/complexSearch', params);
      return data.results.map((recipe: any) =>
        this.convertSpoonacularToRecipe(recipe)
      );
    } catch (error) {
      console.error('Recipe recommendations error:', error);
      return this.mockRecipeSearch(['pasta', 'chicken']);
    }
  }

  // Scale recipe to different number of servings
  scaleRecipe(recipe: Recipe, newServings: number): Recipe {
    if (!recipe.originalServings || newServings <= 0) return recipe;

    const scaleFactor = newServings / recipe.originalServings;

    const scaledIngredients =
      recipe.scaledIngredients?.map(ing => ({
        ...ing,
        amount: ing.originalAmount * scaleFactor,
      })) || [];

    const scaledNutrition = recipe.nutrition
      ? {
          calories: Math.round(recipe.nutrition.calories * scaleFactor),
          protein: Math.round(recipe.nutrition.protein * scaleFactor * 10) / 10,
          carbs: Math.round(recipe.nutrition.carbs * scaleFactor * 10) / 10,
          fat: Math.round(recipe.nutrition.fat * scaleFactor * 10) / 10,
          fiber: Math.round(recipe.nutrition.fiber * scaleFactor * 10) / 10,
          sugar: Math.round(recipe.nutrition.sugar * scaleFactor * 10) / 10,
          sodium: Math.round(recipe.nutrition.sodium * scaleFactor),
        }
      : undefined;

    return {
      ...recipe,
      servings: newServings,
      scaledServings: newServings,
      scaledIngredients,
      nutrition: scaledNutrition,
    };
  }

  // Calculate nutrition per serving
  calculateNutritionPerServing(recipe: Recipe): Recipe['nutrition'] {
    if (!recipe.nutrition || !recipe.servings) return recipe.nutrition;

    const servings = recipe.scaledServings || recipe.servings;

    return {
      calories: Math.round(recipe.nutrition.calories / servings),
      protein: Math.round((recipe.nutrition.protein / servings) * 10) / 10,
      carbs: Math.round((recipe.nutrition.carbs / servings) * 10) / 10,
      fat: Math.round((recipe.nutrition.fat / servings) * 10) / 10,
      fiber: Math.round((recipe.nutrition.fiber / servings) * 10) / 10,
      sugar: Math.round((recipe.nutrition.sugar / servings) * 10) / 10,
      sodium: Math.round(recipe.nutrition.sodium / servings),
    };
  }

  async searchRecipesByPreferences(preferences: {
    diets?: string[];
    allergens?: string[];
    cuisines?: string[];
    difficulty?: string;
    maxPrepTime?: number;
    maxCookTime?: number;
    nutritionGoals?: {
      dailyCalories?: number;
      proteinPercentage?: number;
      carbsPercentage?: number;
      fatPercentage?: number;
      maxFiber?: number;
      maxSugar?: number;
      maxSodium?: number;
    };
  }): Promise<Recipe[]> {
    try {
      if (SPOONACULAR_API_KEY === 'YOUR_SPOONACULAR_API_KEY') {
        console.log('Spoonacular API key not configured, using mock data');
        return this.mockRecipeSearchByPreferences(preferences);
      }

      // Build API parameters based on preferences
      const params: any = {
        number: 20, // Get more recipes for better filtering
        addRecipeInformation: true,
        fillIngredients: true,
        instructionsRequired: true,
      };

      // Add dietary restrictions
      if (preferences.diets && preferences.diets.length > 0) {
        params.diet = preferences.diets.join(',');
      }

      // Add intolerances (allergens)
      if (preferences.allergens && preferences.allergens.length > 0) {
        params.intolerances = preferences.allergens.join(',');
      }

      // Add cuisine filters
      if (preferences.cuisines && preferences.cuisines.length > 0) {
        params.cuisine = preferences.cuisines.join(',');
      }

      // Add time constraints
      if (preferences.maxPrepTime || preferences.maxCookTime) {
        const maxTime = Math.max(
          preferences.maxPrepTime || 0,
          preferences.maxCookTime || 0
        );
        if (maxTime > 0) {
          params.maxReadyTime = maxTime;
        }
      }

      console.log('🔍 Spoonacular API: Searching with params:', params);

      // Search for recipes
      const data = await this.callSpoonacularAPI('/complexSearch', params);

      if (!data.results || data.results.length === 0) {
        console.log(
          '🔍 Spoonacular API: No recipes found with current filters'
        );
        return [];
      }

      console.log(`🔍 Spoonacular API: Found ${data.results.length} recipes`);

      // Get detailed information for each recipe
      const detailedRecipes = await Promise.all(
        data.results.slice(0, 10).map(async (recipe: any) => {
          try {
            const details = await this.getRecipeDetails(recipe.id);
            return details;
          } catch (error) {
            console.error(
              `Error getting details for recipe ${recipe.id}:`,
              error
            );
            return null;
          }
        })
      );

      // Filter out null results and apply additional filters
      const validRecipes = detailedRecipes
        .filter((recipe): recipe is Recipe => recipe !== null)
        .filter(recipe => this.matchesPreferences(recipe, preferences));

      console.log(
        `🔍 Spoonacular API: ${validRecipes.length} recipes match preferences`
      );

      return validRecipes;
    } catch (error) {
      console.error('Spoonacular API search error:', error);
      return this.mockRecipeSearchByPreferences(preferences);
    }
  }

  private matchesPreferences(recipe: Recipe, preferences: any): boolean {
    // Check difficulty (if specified)
    if (preferences.difficulty && preferences.difficulty !== 'any') {
      const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
      const recipeDifficulty = this.mapTimeToDifficulty(totalTime);
      if (preferences.difficulty !== recipeDifficulty) {
        return false;
      }
    }

    // Check nutrition goals (basic filtering)
    if (preferences.nutritionGoals && recipe.nutrition) {
      const { nutrition } = preferences.nutritionGoals;
      const recipeNutrition = recipe.nutrition;

      if (
        nutrition.dailyCalories &&
        recipeNutrition.calories > nutrition.dailyCalories * 1.2
      ) {
        return false;
      }

      if (nutrition.maxSugar && recipeNutrition.sugar > nutrition.maxSugar) {
        return false;
      }

      if (nutrition.maxSodium && recipeNutrition.sodium > nutrition.maxSodium) {
        return false;
      }
    }

    return true;
  }

  private mockRecipeSearchByPreferences(preferences: any): Recipe[] {
    // Return mock recipes that match the preferences
    const mockRecipes: Recipe[] = [
      {
        id: 'mock-1',
        title: 'Vegetarian Pasta Primavera',
        // description: 'Fresh vegetables with pasta in a light sauce',
        imageUrl: 'https://example.com/pasta.jpg',
        prepTime: 15,
        cookTime: 20,
        servings: 4,
        difficulty: 'easy',
        cuisines: ['italian'],
        diets: ['vegetarian'],
        allergens: [],
        nutrition: {
          calories: 350,
          protein: 12,
          carbs: 45,
          fat: 8,
          fiber: 6,
          sugar: 4,
          sodium: 400,
        },
        ingredients: ['pasta', 'broccoli', 'carrots', 'olive oil'],
        instructions: ['Boil pasta', 'Sauté vegetables', 'Combine and serve'],
        tags: ['vegetarian', 'italian', 'quick'],
        isFavorite: false,
        rating: 4.5,
        canCookNow: true,
        missingIngredients: [],
        createdBy: 'current-user',
        isShared: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mock-2',
        title: 'Vegan Buddha Bowl',
        // description: 'Nutritious bowl with quinoa and roasted vegetables',
        imageUrl: 'https://example.com/buddha-bowl.jpg',
        prepTime: 20,
        cookTime: 30,
        servings: 2,
        difficulty: 'medium',
        cuisines: ['asian'],
        diets: ['vegan', 'vegetarian'],
        allergens: [],
        nutrition: {
          calories: 420,
          protein: 15,
          carbs: 38,
          fat: 12,
          fiber: 8,
          sugar: 6,
          sodium: 350,
        },
        ingredients: ['quinoa', 'sweet potato', 'kale', 'chickpeas'],
        instructions: ['Cook quinoa', 'Roast vegetables', 'Assemble bowl'],
        tags: ['vegan', 'asian', 'healthy'],
        isFavorite: false,
        rating: 4.8,
        canCookNow: true,
        missingIngredients: [],
        createdBy: 'current-user',
        isShared: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Filter based on preferences
    return mockRecipes.filter(recipe => {
      // Check diets
      if (preferences.diets && preferences.diets.length > 0) {
        const hasMatchingDiet = preferences.diets.some((diet: string) =>
          recipe.diets?.includes(diet)
        );
        if (!hasMatchingDiet) return false;
      }

      // Check cuisines
      if (preferences.cuisines && preferences.cuisines.length > 0) {
        const hasMatchingCuisine = preferences.cuisines.some(
          (cuisine: string) => recipe.cuisines?.includes(cuisine)
        );
        if (!hasMatchingCuisine) return false;
      }

      // Check allergens
      if (preferences.allergens && preferences.allergens.length > 0) {
        const hasAllergen = preferences.allergens.some((allergen: string) =>
          recipe.allergens?.includes(allergen)
        );
        if (hasAllergen) return false;
      }

      return true;
    });
  }

  private mapTimeToDifficulty(totalTime: number): string {
    if (totalTime <= 30) return 'easy';
    if (totalTime <= 60) return 'medium';
    return 'hard';
  }
}

export const recipeService = new RecipeService();
