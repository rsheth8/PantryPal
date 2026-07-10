import { Recipe, MealPlan, PlannedMeal, DietaryPreferences } from '../types';
import { logger } from '../utils/logger';
import { recipeService } from './recipeService';

export interface EnhancedMealPlanningOptions {
  includeBreakfast: boolean;
  includeLunch: boolean;
  includeDinner: boolean;
  includeSnacks: boolean;
  servingsPerMeal: number;
  maxPrepTime: number;
  maxCookTime: number;
  exploreNewRecipes: boolean;
  dietaryPreferences: DietaryPreferences;
}

export interface MealPlanningResult {
  mealPlan: MealPlan;
  tierUsed: number;
  relaxations: string[];
  warnings: string[];
  success: boolean;
}

class EnhancedMealPlanningService {
  private readonly SACRED_PREFERENCES = [
    'diets',
    'allergens',
    'medicalRestrictions',
  ];
  private readonly FLEXIBLE_PREFERENCES = [
    'cuisines',
    'difficulty',
    'maxPrepTime',
    'maxCookTime',
    'nutritionGoals',
    'lifestyle',
  ];

  async generateMealPlan(
    recipes: Recipe[],
    pantry: any[], // Pantry is not used in this version for unlimited menu
    options: EnhancedMealPlanningOptions,
    userId: string,
    householdId?: string
  ): Promise<MealPlanningResult> {
    logger.debug('🍳 Enhanced Meal Planning: Starting generation');
    logger.debug('🍳 Options:', options);
    logger.debug('🍳 Available recipes:', recipes.length);

    const weekStartDate = new Date();
    const daysOfWeek = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    // Try each tier until we get a successful meal plan
    for (let tier = 1; tier <= 4; tier++) {
      const result = await this.tryTier(
        recipes,
        options,
        userId,
        householdId,
        weekStartDate,
        daysOfWeek,
        tier
      );
      if (result.success) {
        return result;
      }
    }

    // If all tiers fail, return a minimal meal plan
    return {
      mealPlan: this.createMinimalMealPlan(daysOfWeek),
      tierUsed: 4,
      relaxations: ['All preferences relaxed due to insufficient recipes'],
      warnings: [
        'Very few recipes match your dietary restrictions',
        'Consider adding more recipes or adjusting preferences',
      ],
      success: false,
    };
  }

  private async tryTier(
    recipes: Recipe[],
    options: EnhancedMealPlanningOptions,
    userId: string,
    householdId: string | undefined,
    weekStartDate: Date,
    daysOfWeek: string[],
    tier: number
  ): Promise<MealPlanningResult> {
    let availableRecipes = [...recipes];
    const relaxations: string[] = [];
    const warnings: string[] = [];

    logger.debug(
      `🍳 Tier ${tier}: Starting with ${availableRecipes.length} recipes`
    );

    switch (tier) {
      case 1: // Strict matching
        logger.debug('🍳 Tier 1: Strict matching - all preferences enforced');
        availableRecipes = this.filterByAllPreferences(
          recipes,
          options.dietaryPreferences
        );
        break;
      case 2: // Relaxed non-dietary
        logger.debug('🍳 Tier 2: Relaxed non-dietary preferences');
        availableRecipes = this.filterBySacredPreferences(
          recipes,
          options.dietaryPreferences
        );
        relaxations.push(
          'Relaxed cuisine preferences',
          'Relaxed time constraints',
          'Relaxed nutrition goals'
        );
        break;
      case 3: // Minimal matching (only sacred)
        logger.debug('🍳 Tier 3: Minimal matching - only sacred preferences');
        availableRecipes = this.filterBySacredPreferences(
          recipes,
          options.dietaryPreferences
        );
        relaxations.push(
          'Using any available recipe that matches dietary restrictions',
          'Allowing meal repetition'
        );
        break;
      case 4: // User intervention needed
        logger.debug('🍳 Tier 4: User intervention needed');
        availableRecipes = this.filterBySacredPreferences(
          recipes,
          options.dietaryPreferences
        );
        warnings.push(
          'Very few recipes match your dietary restrictions',
          'Consider adding more recipes or adjusting preferences'
        );
        break;
    }

    logger.debug(
      `🍳 Tier ${tier}: After filtering, ${availableRecipes.length} recipes available`
    );

    // If we have enough recipes, try to generate a meal plan
    if (availableRecipes.length >= 7) {
      const mealPlan = await this.generateMealPlanFromRecipes(
        availableRecipes,
        options,
        daysOfWeek,
        weekStartDate
      );

      if (this.isMealPlanComplete(mealPlan, options)) {
        logger.debug(
          `🍳 Tier ${tier}: Successfully generated complete meal plan`
        );
        return {
          mealPlan,
          tierUsed: tier,
          relaxations,
          warnings,
          success: true,
        };
      }
    }

    // If we don't have enough recipes, try to fetch more from Spoonacular
    if (tier <= 2 && availableRecipes.length < 7) {
      logger.debug(
        `🍳 Tier ${tier}: Fetching additional recipes from Spoonacular`
      );
      try {
        const additionalRecipes =
          await recipeService.searchRecipesByPreferences({
            diets: options.dietaryPreferences.diets,
            allergens: options.dietaryPreferences.allergens,
            cuisines: options.dietaryPreferences.cuisines,
            difficulty: options.dietaryPreferences.difficulty,
            maxPrepTime: options.dietaryPreferences.maxPrepTime,
            maxCookTime: options.dietaryPreferences.maxCookTime,
            nutritionGoals: options.dietaryPreferences.nutritionGoals,
          });

        logger.debug(
          `🍳 Tier ${tier}: Fetched ${additionalRecipes.length} additional recipes`
        );

        // Combine with existing recipes
        const allRecipes = [...availableRecipes, ...additionalRecipes];
        const uniqueRecipes = this.removeDuplicates(allRecipes);

        if (uniqueRecipes.length >= 7) {
          const mealPlan = await this.generateMealPlanFromRecipes(
            uniqueRecipes,
            options,
            daysOfWeek,
            weekStartDate
          );

          if (this.isMealPlanComplete(mealPlan, options)) {
            logger.debug(
              `🍳 Tier ${tier}: Successfully generated complete meal plan with Spoonacular recipes`
            );
            relaxations.push(
              'Used external recipe sources to complete meal plan'
            );
            return {
              mealPlan,
              tierUsed: tier,
              relaxations,
              warnings,
              success: true,
            };
          }
        }
      } catch (error) {
        logger.error('🍳 Error fetching additional recipes:', error);
      }
    }

    logger.debug(`🍳 Tier ${tier}: Failed to generate complete meal plan`);
    return {
      mealPlan: this.createMinimalMealPlan(daysOfWeek),
      tierUsed: tier,
      relaxations,
      warnings: [...warnings, 'Could not generate complete meal plan'],
      success: false,
    };
  }

  /**
   * Filter recipes by ALL preferences (sacred + flexible)
   */
  private filterByAllPreferences(
    recipes: Recipe[],
    preferences: DietaryPreferences
  ): Recipe[] {
    logger.debug('🔍 FILTERING: All preferences (strict)');

    return recipes.filter(recipe => {
      // Check sacred preferences (diets, allergens, medical)
      if (!this.matchesSacredPreferences(recipe, preferences)) {
        return false;
      }

      // Check flexible preferences (cuisines, difficulty, time, nutrition)
      if (!this.matchesFlexiblePreferences(recipe, preferences)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Filter recipes by SACRED preferences only
   */
  private filterBySacredPreferences(
    recipes: Recipe[],
    preferences: DietaryPreferences
  ): Recipe[] {
    logger.debug('🔍 FILTERING: Sacred preferences only');

    return recipes.filter(recipe => {
      return this.matchesSacredPreferences(recipe, preferences);
    });
  }

  /**
   * Check if recipe matches sacred preferences
   */
  private matchesSacredPreferences(
    recipe: Recipe,
    preferences: DietaryPreferences
  ): boolean {
    // Check diets
    if (preferences.diets.length > 0) {
      const recipeDiets = recipe.diets || [];
      const effectiveDiets = [...preferences.diets];

      // If vegetarian is selected, also include vegan
      if (
        preferences.diets.includes('vegetarian') &&
        !preferences.diets.includes('vegan')
      ) {
        effectiveDiets.push('vegan');
      }

      const hasMatchingDiet = effectiveDiets.some(diet =>
        recipeDiets.includes(diet)
      );
      if (!hasMatchingDiet) {
        logger.debug(
          `🔍 SACRED: Recipe "${recipe.title}" filtered out - diet mismatch`
        );
        return false;
      }
    }

    // Check allergens
    if (preferences.allergens.length > 0) {
      const recipeAllergens = recipe.allergens || [];
      const hasAllergen = preferences.allergens.some(allergen =>
        recipeAllergens.includes(allergen)
      );
      if (hasAllergen) {
        logger.debug(
          `🔍 SACRED: Recipe "${recipe.title}" filtered out - contains allergen`
        );
        return false;
      }
    }

    // Check medical restrictions
    if (preferences.medicalRestrictions.length > 0) {
      // For now, we'll check basic medical restrictions
      const recipeIngredients = recipe.ingredients.join(' ').toLowerCase();
      const recipeTitle = recipe.title.toLowerCase();

      if (preferences.medicalRestrictions.includes('diabetic')) {
        const highSugarKeywords = [
          'sugar',
          'honey',
          'syrup',
          'candy',
          'dessert',
        ];
        const hasHighSugar = highSugarKeywords.some(
          keyword =>
            recipeIngredients.includes(keyword) || recipeTitle.includes(keyword)
        );
        if (hasHighSugar) {
          logger.debug(
            `🔍 SACRED: Recipe "${recipe.title}" filtered out - high sugar for diabetic`
          );
          return false;
        }
      }

      if (preferences.medicalRestrictions.includes('celiac')) {
        const glutenKeywords = ['wheat', 'flour', 'bread', 'pasta', 'gluten'];
        const hasGluten = glutenKeywords.some(
          keyword =>
            recipeIngredients.includes(keyword) || recipeTitle.includes(keyword)
        );
        if (hasGluten) {
          logger.debug(
            `🔍 SACRED: Recipe "${recipe.title}" filtered out - contains gluten`
          );
          return false;
        }
      }
    }

    logger.debug(`🔍 SACRED: Recipe "${recipe.title}" passed sacred filters`);
    return true;
  }

  /**
   * Check if recipe matches flexible preferences
   */
  private matchesFlexiblePreferences(
    recipe: Recipe,
    preferences: DietaryPreferences
  ): boolean {
    // Check cuisines
    if (preferences.cuisines.length > 0) {
      const recipeCuisines = recipe.cuisines || [];
      const hasMatchingCuisine = preferences.cuisines.some(cuisine =>
        recipeCuisines.includes(cuisine)
      );
      if (!hasMatchingCuisine) {
        logger.debug(
          `🔍 FLEXIBLE: Recipe "${recipe.title}" filtered out - cuisine mismatch`
        );
        return false;
      }
    }

    // Check difficulty
    if (preferences.difficulty !== 'any' && recipe.difficulty) {
      // Map old difficulty values to new ones
      const difficultyMap: { [key: string]: string } = {
        easy: 'beginner',
        medium: 'intermediate',
        hard: 'advanced',
      };

      const recipeDifficulty =
        difficultyMap[recipe.difficulty] || recipe.difficulty;
      const preferredDifficulty = preferences.difficulty;

      if (recipeDifficulty !== preferredDifficulty) {
        logger.debug(
          `🔍 FLEXIBLE: Recipe "${recipe.title}" filtered out - difficulty mismatch (${recipeDifficulty} vs ${preferredDifficulty})`
        );
        return false;
      }
    }

    // Check time constraints
    if (
      preferences.maxPrepTime &&
      recipe.prepTime &&
      recipe.prepTime > preferences.maxPrepTime
    ) {
      logger.debug(
        `🔍 FLEXIBLE: Recipe "${recipe.title}" filtered out - prep time too long`
      );
      return false;
    }

    if (
      preferences.maxCookTime &&
      recipe.cookTime &&
      recipe.cookTime > preferences.maxCookTime
    ) {
      logger.debug(
        `🔍 FLEXIBLE: Recipe "${recipe.title}" filtered out - cook time too long`
      );
      return false;
    }

    // Check nutrition goals
    if (recipe.nutrition && preferences.nutritionGoals) {
      const nutrition = recipe.nutrition;
      const goals = preferences.nutritionGoals;

      if (goals.dailyCalories && nutrition.calories > goals.dailyCalories) {
        logger.debug(
          `🔍 FLEXIBLE: Recipe "${recipe.title}" filtered out - too many calories`
        );
        return false;
      }

      if (
        goals.maxFiber &&
        nutrition.fiber &&
        nutrition.fiber > goals.maxFiber
      ) {
        logger.debug(
          `🔍 FLEXIBLE: Recipe "${recipe.title}" filtered out - too much fiber`
        );
        return false;
      }

      if (
        goals.maxSugar &&
        nutrition.sugar &&
        nutrition.sugar > goals.maxSugar
      ) {
        logger.debug(
          `🔍 FLEXIBLE: Recipe "${recipe.title}" filtered out - too much sugar`
        );
        return false;
      }

      if (
        goals.maxSodium &&
        nutrition.sodium &&
        nutrition.sodium > goals.maxSodium
      ) {
        logger.debug(
          `🔍 FLEXIBLE: Recipe "${recipe.title}" filtered out - too much sodium`
        );
        return false;
      }
    }

    logger.debug(
      `🔍 FLEXIBLE: Recipe "${recipe.title}" passed flexible filters`
    );
    return true;
  }

  /**
   * Generate meal plan from filtered recipes
   */
  private async generateMealPlanFromRecipes(
    recipes: Recipe[],
    options: EnhancedMealPlanningOptions,
    daysOfWeek: string[],
    weekStartDate: Date
  ): Promise<MealPlan> {
    const meals: any = {};
    const usedRecipes = new Set<string>();

    // Generate meals for each day
    for (const day of daysOfWeek) {
      meals[day] = {};

      if (options.includeBreakfast) {
        const breakfastRecipe = this.selectRecipeForMeal(
          recipes,
          'breakfast',
          usedRecipes
        );
        if (breakfastRecipe) {
          meals[day].breakfast = breakfastRecipe;
        }
      }

      if (options.includeLunch) {
        const lunchRecipe = this.selectRecipeForMeal(
          recipes,
          'lunch',
          usedRecipes
        );
        if (lunchRecipe) {
          meals[day].lunch = lunchRecipe;
        }
      }

      if (options.includeDinner) {
        const dinnerRecipe = this.selectRecipeForMeal(
          recipes,
          'dinner',
          usedRecipes
        );
        if (dinnerRecipe) {
          meals[day].dinner = dinnerRecipe;
        }
      }

      if (options.includeSnacks) {
        const snackRecipes = this.selectSnackRecipes(recipes, usedRecipes);
        if (snackRecipes.length > 0) {
          meals[day].snacks = snackRecipes;
        }
      }
    }

    return {
      id: 'temp-id', // Placeholder, will be replaced by actual ID
      userId: 'temp-user', // Placeholder, will be replaced by actual ID
      householdId: 'temp-household', // Placeholder, will be replaced by actual ID
      weekStartDate: weekStartDate.toISOString(),
      meals,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Select a recipe for a specific meal type
   */
  private selectRecipeForMeal(
    recipes: Recipe[],
    mealType: string,
    usedRecipes: Set<string>
  ): PlannedMeal | undefined {
    // Filter out already used recipes
    const availableRecipes = recipes.filter(
      recipe => !usedRecipes.has(recipe.id)
    );

    if (availableRecipes.length === 0) {
      // If all recipes used, allow reuse
      logger.debug(
        `🍽️ SELECTION: All recipes used for ${mealType}, allowing reuse`
      );
      return this.selectRandomRecipe(recipes, mealType, usedRecipes);
    }

    return this.selectRandomRecipe(availableRecipes, mealType, usedRecipes);
  }

  /**
   * Select random recipe
   */
  private selectRandomRecipe(
    recipes: Recipe[],
    mealType: string,
    usedRecipes: Set<string>
  ): PlannedMeal | undefined {
    if (recipes.length === 0) return undefined;

    const selectedRecipe = recipes[Math.floor(Math.random() * recipes.length)];
    usedRecipes.add(selectedRecipe.id);

    logger.debug(
      `🍽️ SELECTION: Selected "${selectedRecipe.title}" for ${mealType}`
    );

    return {
      recipeId: selectedRecipe.id,
      recipeTitle: selectedRecipe.title,
      servings: 2, // Default servings
      nutrition: selectedRecipe.nutrition,
    };
  }

  /**
   * Select snack recipes
   */
  private selectSnackRecipes(
    recipes: Recipe[],
    usedRecipes: Set<string>
  ): PlannedMeal[] {
    const availableRecipes = recipes.filter(
      recipe => !usedRecipes.has(recipe.id)
    );

    if (availableRecipes.length === 0) {
      return [];
    }

    // Select 1-2 snack recipes
    const numSnacks = Math.min(2, availableRecipes.length);
    const selectedRecipes = [];

    for (let i = 0; i < numSnacks; i++) {
      const recipe =
        availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
      usedRecipes.add(recipe.id);
      selectedRecipes.push({
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        servings: 1,
        nutrition: recipe.nutrition,
      });
    }

    return selectedRecipes;
  }

  /**
   * Get sacred preferences for logging
   */
  private getSacredPreferences(preferences: DietaryPreferences): string {
    const sacred = [];
    if (preferences.diets.length > 0)
      sacred.push(`Diets: ${preferences.diets.join(', ')}`);
    if (preferences.allergens.length > 0)
      sacred.push(`Allergens: ${preferences.allergens.join(', ')}`);
    if (preferences.medicalRestrictions.length > 0)
      sacred.push(`Medical: ${preferences.medicalRestrictions.join(', ')}`);
    return sacred.join(' | ');
  }

  /**
   * Get week start date (Monday)
   */
  private getWeekStartDate(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  /**
   * Create empty meal plan
   */
  private createEmptyMealPlan(
    userId: string,
    householdId: string | undefined,
    weekStartDate: Date
  ): MealPlan {
    return {
      id: 'temp-id', // Placeholder, will be replaced by actual ID
      userId,
      householdId,
      weekStartDate: weekStartDate.toISOString(),
      meals: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create a minimal meal plan (for when all tiers fail)
   */
  private createMinimalMealPlan(daysOfWeek: string[]): MealPlan {
    const meals: {
      [day: string]: {
        breakfast?: PlannedMeal;
        lunch?: PlannedMeal;
        dinner?: PlannedMeal;
        snacks?: PlannedMeal[];
      };
    } = {};

    daysOfWeek.forEach(day => {
      meals[day] = {
        breakfast: undefined,
        lunch: undefined,
        dinner: undefined,
        snacks: [],
      };
    });

    return {
      id: 'temp-id', // Placeholder, will be replaced by actual ID
      userId: 'temp-user', // Placeholder, will be replaced by actual ID
      householdId: 'temp-household', // Placeholder, will be replaced by actual ID
      weekStartDate: this.getWeekStartDate().toISOString(),
      meals,
      totalNutrition: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Check if the generated meal plan meets the requirements
   */
  private isMealPlanComplete(
    mealPlan: MealPlan,
    options: EnhancedMealPlanningOptions
  ): boolean {
    const daysWithMeals = Object.values(mealPlan.meals).filter(day =>
      Object.keys(day).some(
        mealType => day[mealType as keyof typeof day] !== undefined
      )
    ).length;
    const isComplete = daysWithMeals >= 5; // At least 5 days should have meals

    if (!isComplete) {
      logger.debug(
        '🍳 Meal plan incomplete:',
        daysWithMeals,
        'days have meals'
      );
      return false;
    }

    // Check if all required meals are present
    if (
      options.includeBreakfast &&
      !Object.keys(mealPlan.meals).some(
        day => mealPlan.meals[day].breakfast !== undefined
      )
    ) {
      logger.debug('🍳 Meal plan missing breakfast');
      return false;
    }
    if (
      options.includeLunch &&
      !Object.keys(mealPlan.meals).some(
        day => mealPlan.meals[day].lunch !== undefined
      )
    ) {
      logger.debug('🍳 Meal plan missing lunch');
      return false;
    }
    if (
      options.includeDinner &&
      !Object.keys(mealPlan.meals).some(
        day => mealPlan.meals[day].dinner !== undefined
      )
    ) {
      logger.debug('🍳 Meal plan missing dinner');
      return false;
    }
    if (
      options.includeSnacks &&
      !Object.keys(mealPlan.meals).some(
        day => mealPlan.meals[day].snacks !== undefined
      )
    ) {
      logger.debug('🍳 Meal plan missing snacks');
      return false;
    }

    logger.debug('🍳 Meal plan is complete.');
    return true;
  }

  /**
   * Remove duplicate recipes
   */
  private removeDuplicates(recipes: Recipe[]): Recipe[] {
    const seen = new Set<string>();
    return recipes.filter(recipe => {
      if (seen.has(recipe.id)) {
        return false;
      }
      seen.add(recipe.id);
      return true;
    });
  }
}

export const enhancedMealPlanningService = new EnhancedMealPlanningService();
