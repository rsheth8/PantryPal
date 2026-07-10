import {
  MealPlan,
  PlannedMeal,
  Recipe,
  ShoppingListItem,
  DietaryPreferences,
} from '../types';
import { generateId } from '../utils/helpers';
import { recipeService } from './recipeService';
import { supabaseService } from './supabaseService';
import { logger } from '../utils/logger';

export interface MealPlanningOptions {
  includeBreakfast: boolean;
  includeLunch: boolean;
  includeDinner: boolean;
  includeSnacks: boolean;
  servingsPerMeal: number;
  dietaryPreferences?: DietaryPreferences;
  maxPrepTime?: number;
  maxCookTime?: number;
  exploreNewRecipes?: boolean; // New option to explore new recipes
}

export interface NutritionGoals {
  maxCalories?: number;
  minProtein?: number;
  maxCarbs?: number;
  maxFat?: number;
}

class MealPlanningService {
  /**
   * Generate a meal plan for the week
   */
  async generateMealPlan(
    recipes: Recipe[],
    pantry: any[],
    options: MealPlanningOptions,
    userId: string,
    householdId?: string
  ): Promise<MealPlan> {
    logger.debug('LOG Meal Planning: Starting meal plan generation');
    logger.debug('LOG Meal Planning: Input recipes count:', recipes.length);
    logger.debug('LOG Meal Planning: Input pantry count:', pantry.length);
    logger.debug(
      'LOG Meal Planning: Options:',
      JSON.stringify(options, null, 2)
    );

    const weekStartDate = this.getWeekStartDate();
    const meals: any = {};

    const daysOfWeek = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    // Use ALL recipes for meal planning, not just "can cook now"
    // This gives users unlimited menu options regardless of current pantry
    const allRecipes = [...recipes];
    logger.debug(
      'LOG Meal Planning: Using all recipes for unlimited menu options'
    );
    logger.debug(
      'LOG Meal Planning: Initial recipes count:',
      allRecipes.length
    );

    // If explore new recipes is enabled, fetch additional recipes from external API
    if (options.exploreNewRecipes) {
      logger.debug(
        'LOG Meal Planning: Explore new recipes is enabled, but external API is temporarily disabled due to quota issues'
      );
      logger.debug('LOG Meal Planning: Using local recipes only for now');
      // TODO: Re-enable when API quota is available
      // try {
      //   const externalRecipes = await this.fetchExploratoryRecipes(options.dietaryPreferences, availableIngredients);
      //   allRecipes = [...recipes, ...externalRecipes];
      //   logger.debug(`LOG Meal Planning: Added ${externalRecipes.length} external recipes for exploration`);
      //   logger.debug('LOG Meal Planning: Total recipes after external fetch:', allRecipes.length);
      // } catch (error) {
      //   logger.debug('LOG Meal Planning: Could not fetch external recipes, using local recipes only');
      //   logger.error('LOG Meal Planning: External recipe fetch error:', error);
      // }
    } else {
      logger.debug(
        'LOG Meal Planning: Explore new recipes is disabled, using local recipes only'
      );
    }

    // Filter recipes based on dietary preferences first
    let availableRecipes = allRecipes;
    if (options.dietaryPreferences) {
      logger.debug(
        'LOG Dietary Filtering: Starting filtering with preferences:',
        options.dietaryPreferences
      );
      logger.debug(
        'LOG Dietary Filtering: Total recipes to filter:',
        allRecipes.length
      );

      const filteredRecipes = this.filterRecipesByPreferences(
        allRecipes,
        options.dietaryPreferences
      );
      availableRecipes = filteredRecipes;
    }

    logger.debug(
      `LOG Meal Planning: ${availableRecipes.length} recipes available after filtering`
    );

    // If no recipes available after filtering, use all recipes as fallback
    if (availableRecipes.length === 0) {
      logger.debug(
        'LOG Meal Planning: No recipes passed dietary filters, using all recipes as fallback'
      );
      availableRecipes = allRecipes;
    }

    // Track used recipes to ensure variety
    const usedRecipes = new Set<string>();

    logger.debug('LOG Meal Planning: Starting meal selection for each day...');

    // Generate meals for each day
    for (const day of daysOfWeek) {
      meals[day] = {};

      if (options.includeBreakfast) {
        const breakfastRecipe = this.selectRecipeForMeal(
          availableRecipes,
          'breakfast',
          options,
          usedRecipes
        );
        if (breakfastRecipe) {
          meals[day].breakfast = breakfastRecipe;
        }
      }

      if (options.includeLunch) {
        const lunchRecipe = this.selectRecipeForMeal(
          availableRecipes,
          'lunch',
          options,
          usedRecipes
        );
        if (lunchRecipe) {
          meals[day].lunch = lunchRecipe;
        }
      }

      if (options.includeDinner) {
        const dinnerRecipe = this.selectRecipeForMeal(
          availableRecipes,
          'dinner',
          options,
          usedRecipes
        );
        if (dinnerRecipe) {
          meals[day].dinner = dinnerRecipe;
        }
      }

      if (options.includeSnacks) {
        const snackRecipes = this.selectSnackRecipes(
          availableRecipes,
          options,
          usedRecipes
        );
        if (snackRecipes.length > 0) {
          meals[day].snacks = snackRecipes;
        }
      }
    }

    logger.debug(
      'LOG Meal Planning: Final meals object:',
      JSON.stringify(meals, null, 2)
    );

    const mealPlan: MealPlan = {
      id: generateId(),
      userId,
      householdId,
      weekStartDate: weekStartDate.toISOString(),
      meals,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate total nutrition
    logger.debug('LOG Meal Planning: Calculating total nutrition...');
    mealPlan.totalNutrition = this.calculateTotalNutrition(mealPlan);

    // Generate shopping list
    logger.debug('LOG Meal Planning: Generating shopping list...');
    mealPlan.shoppingList = this.generateShoppingListFromMealPlan(
      mealPlan,
      pantry
    );

    logger.debug(
      `LOG Meal Planning: Generated meal plan with ${usedRecipes.size} unique recipes`
    );
    logger.debug(
      'LOG Meal Planning: Final meal plan:',
      JSON.stringify(mealPlan, null, 2)
    );

    // Add detailed summary of what was selected
    logger.debug('\n🍳 MEAL PLAN SUMMARY:');
    logger.debug('=====================');
    Object.entries(mealPlan.meals).forEach(([day, dayMeals]) => {
      logger.debug(`\n📅 ${day.toUpperCase()}:`);
      Object.entries(dayMeals).forEach(([mealType, meal]) => {
        if (mealType === 'snacks' && Array.isArray(meal)) {
          meal.forEach(snack => {
            logger.debug(`  🍎 ${mealType}: ${snack.recipeTitle}`);
          });
        } else if (meal && typeof meal === 'object' && 'recipeTitle' in meal) {
          const singleMeal = meal as PlannedMeal;
          logger.debug(`  🍽️  ${mealType}: ${singleMeal.recipeTitle}`);
        }
      });
    });

    // Check if any days are missing meals
    const daysWithMeals = Object.values(mealPlan.meals).filter(
      day => Object.keys(day).length > 0
    ).length;

    logger.debug(`\n📊 SUMMARY:`);
    logger.debug(`- Days with meals: ${daysWithMeals}/7`);
    logger.debug(`- Unique recipes used: ${usedRecipes.size}`);
    logger.debug(
      `- Total meals planned: ${Object.values(mealPlan.meals).reduce((total, day) => total + Object.keys(day).length, 0)}`
    );

    if (daysWithMeals < 7) {
      logger.debug(
        `⚠️  WARNING: Only ${daysWithMeals} days have meals. This means some recipes don't match your strict preferences.`
      );
    }

    return mealPlan;
  }

  /**
   * Fetch exploratory recipes from external API
   */
  private async fetchExploratoryRecipes(
    dietaryPreferences?: DietaryPreferences,
    availableIngredients?: string[]
  ): Promise<Recipe[]> {
    try {
      // Create search parameters based on dietary preferences
      const searchParams: any = {
        number: 20, // Get more recipes for variety
        addRecipeInformation: true,
        fillIngredients: true,
      };

      // Add dietary restrictions
      if (dietaryPreferences?.diets.length) {
        searchParams.diet = dietaryPreferences.diets.join(',');
      }

      if (dietaryPreferences?.allergens.length) {
        searchParams.excludeIngredients =
          dietaryPreferences.allergens.join(',');
      }

      if (dietaryPreferences?.cuisines.length) {
        searchParams.cuisine = dietaryPreferences.cuisines.join(',');
      }

      // Add available ingredients if any
      if (availableIngredients && availableIngredients.length > 0) {
        searchParams.includeIngredients = availableIngredients
          .slice(0, 5)
          .join(','); // Limit to 5 ingredients
      }

      logger.debug(
        'LOG Meal Planning: Fetching external recipes with params:',
        searchParams
      );

      // Fetch recipes from Spoonacular
      const externalRecipes =
        await recipeService.searchRecipesByAvailableIngredients(
          availableIngredients || []
        );

      // Convert to our Recipe format
      return externalRecipes.map((recipe: any) => {
        const ingredients =
          recipe.extendedIngredients?.map((ing: any) => ing.original) || [];
        const ingredientsText = ingredients.join(' ').toLowerCase();
        const title = recipe.title.toLowerCase();

        // Detect diet type from ingredients and title
        const meatKeywords = [
          'chicken',
          'beef',
          'pork',
          'lamb',
          'fish',
          'meat',
          'bacon',
          'ham',
          'turkey',
        ];
        const animalKeywords = [
          ...meatKeywords,
          'milk',
          'cheese',
          'butter',
          'egg',
          'yogurt',
          'cream',
        ];

        const hasMeat = meatKeywords.some(
          keyword =>
            ingredientsText.includes(keyword) || title.includes(keyword)
        );
        const hasAnimal = animalKeywords.some(
          keyword =>
            ingredientsText.includes(keyword) || title.includes(keyword)
        );

        const diets: string[] = [];
        if (!hasAnimal) {
          diets.push('vegan');
        } else if (!hasMeat) {
          diets.push('vegetarian');
        }

        return {
          id: `external-${recipe.id}`,
          title: recipe.title,
          ingredients,
          instructions:
            recipe.analyzedInstructions?.[0]?.steps?.map(
              (step: any) => step.step
            ) || [],
          prepTime: recipe.preparationMinutes || 15,
          cookTime: recipe.cookingMinutes || 30,
          servings: recipe.servings || 4,
          image: recipe.image,
          canCookNow: false, // External recipes need ingredients
          missingIngredients: [], // Will be calculated later
          tags: recipe.dishTypes || [],
          createdBy: 'external',
          householdId: undefined,
          isShared: false,
          createdAt: new Date().toISOString(),
          nutrition: recipe.nutrition?.nutrients
            ? {
                calories:
                  recipe.nutrition.nutrients.find(
                    (n: any) => n.name === 'Calories'
                  )?.amount || 0,
                protein:
                  recipe.nutrition.nutrients.find(
                    (n: any) => n.name === 'Protein'
                  )?.amount || 0,
                carbs:
                  recipe.nutrition.nutrients.find(
                    (n: any) => n.name === 'Carbohydrates'
                  )?.amount || 0,
                fat:
                  recipe.nutrition.nutrients.find((n: any) => n.name === 'Fat')
                    ?.amount || 0,
                fiber:
                  recipe.nutrition.nutrients.find(
                    (n: any) => n.name === 'Fiber'
                  )?.amount || 0,
                sugar:
                  recipe.nutrition.nutrients.find(
                    (n: any) => n.name === 'Sugar'
                  )?.amount || 0,
                sodium:
                  recipe.nutrition.nutrients.find(
                    (n: any) => n.name === 'Sodium'
                  )?.amount || 0,
              }
            : undefined,
          difficulty: this.calculateDifficulty(
            recipe.preparationMinutes,
            recipe.cookingMinutes
          ),
          cuisines: recipe.cuisines || [],
          diets,
          allergens: recipe.allergens || [],
          isFavorite: false,
        };
      });
    } catch (error) {
      logger.error(
        'LOG Meal Planning: Error fetching external recipes:',
        error
      );
      return [];
    }
  }

  /**
   * Calculate recipe difficulty based on prep and cook time
   */
  private calculateDifficulty(
    prepMinutes?: number,
    cookMinutes?: number
  ): 'easy' | 'medium' | 'hard' {
    const totalTime = (prepMinutes || 0) + (cookMinutes || 0);

    if (totalTime <= 30) return 'easy';
    if (totalTime <= 60) return 'medium';
    return 'hard';
  }

  /**
   * Filter recipes based on dietary preferences
   */
  private filterRecipesByPreferences(
    recipes: Recipe[],
    preferences: DietaryPreferences
  ): Recipe[] {
    logger.debug(
      'LOG Dietary Filtering: Starting filtering with preferences:',
      preferences
    );
    logger.debug(
      'LOG Dietary Filtering: Total recipes to filter:',
      recipes.length
    );

    const filteredRecipes = recipes.filter(recipe => {
      logger.debug(
        `\nLOG Dietary Filtering: Checking recipe "${recipe.title}"`
      );
      logger.debug(
        `LOG Dietary Filtering: Recipe cuisines: [${(recipe.cuisines || []).join(', ')}]`
      );
      logger.debug(
        `LOG Dietary Filtering: Recipe diets: [${(recipe.diets || []).join(', ')}]`
      );
      logger.debug(
        `LOG Dietary Filtering: Recipe allergens: [${(recipe.allergens || []).join(', ')}]`
      );

      // Check diets - be more flexible with external recipes
      if (preferences.diets.length > 0) {
        const recipeDiets = recipe.diets || [];

        // If vegetarian is selected, also include vegan dishes (since vegan is a subset of vegetarian)
        const effectivePreferences = [...preferences.diets];
        if (
          preferences.diets.includes('vegetarian') &&
          !preferences.diets.includes('vegan')
        ) {
          effectivePreferences.push('vegan');
        }

        const hasMatchingDiet = effectivePreferences.some(diet =>
          recipeDiets.includes(diet)
        );

        // For external recipes without diet metadata, check ingredients for vegetarian/vegan
        if (!hasMatchingDiet && recipe.createdBy === 'external') {
          const ingredients = recipe.ingredients.join(' ').toLowerCase();
          const title = recipe.title.toLowerCase();

          // Check for vegetarian indicators (including vegan)
          if (preferences.diets.includes('vegetarian')) {
            const meatKeywords = [
              'chicken',
              'beef',
              'pork',
              'lamb',
              'fish',
              'meat',
              'bacon',
              'ham',
              'turkey',
            ];
            const hasMeat = meatKeywords.some(
              keyword =>
                ingredients.includes(keyword) || title.includes(keyword)
            );
            if (!hasMeat) {
              logger.debug(
                `LOG Dietary Filtering: Recipe "${recipe.title}" accepted as vegetarian (no meat detected)`
              );
            } else {
              logger.debug(
                `LOG Dietary Filtering: Recipe "${recipe.title}" filtered out - contains meat`
              );
              return false;
            }
          }

          // Check for vegan indicators (only if vegan is explicitly selected)
          if (preferences.diets.includes('vegan')) {
            const animalKeywords = [
              'chicken',
              'beef',
              'pork',
              'lamb',
              'fish',
              'meat',
              'bacon',
              'ham',
              'turkey',
              'milk',
              'cheese',
              'butter',
              'egg',
              'yogurt',
              'cream',
            ];
            const hasAnimal = animalKeywords.some(
              keyword =>
                ingredients.includes(keyword) || title.includes(keyword)
            );
            if (!hasAnimal) {
              logger.debug(
                `LOG Dietary Filtering: Recipe "${recipe.title}" accepted as vegan (no animal products detected)`
              );
            } else {
              logger.debug(
                `LOG Dietary Filtering: Recipe "${recipe.title}" filtered out - contains animal products`
              );
              return false;
            }
          }
        } else if (!hasMatchingDiet) {
          logger.debug(
            `LOG Dietary Filtering: Recipe "${recipe.title}" filtered out - no matching diet. Recipe diets: [${recipeDiets.join(', ')}], Effective preferences: [${effectivePreferences.join(', ')}]`
          );
          return false;
        } else {
          logger.debug(
            `LOG Dietary Filtering: Recipe "${recipe.title}" diet match: [${recipeDiets.join(', ')}]`
          );
        }
      }

      // Check cuisines - STRICT MATCHING
      if (preferences.cuisines.length > 0) {
        const recipeCuisines = recipe.cuisines || [];
        const hasMatchingCuisine = preferences.cuisines.some(cuisine =>
          recipeCuisines.includes(cuisine)
        );

        if (!hasMatchingCuisine) {
          logger.debug(
            `LOG Dietary Filtering: Recipe "${recipe.title}" filtered out - no matching cuisine. Recipe cuisines: [${recipeCuisines.join(', ')}], Preferred: [${preferences.cuisines.join(', ')}]`
          );
          return false;
        } else {
          logger.debug(
            `LOG Dietary Filtering: Recipe "${recipe.title}" cuisine match: [${recipeCuisines.join(', ')}]`
          );
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
            `LOG Dietary Filtering: Recipe "${recipe.title}" filtered out - contains allergen`
          );
          return false;
        }
      }

      // Check difficulty
      if (preferences.difficulty !== 'any' && recipe.difficulty) {
        if (recipe.difficulty !== preferences.difficulty) {
          logger.debug(
            `LOG Dietary Filtering: Recipe "${recipe.title}" filtered out - difficulty mismatch. Recipe: ${recipe.difficulty}, Preferred: ${preferences.difficulty}`
          );
          return false;
        }
      }

      // Check nutrition goals
      if (recipe.nutrition && preferences.nutritionGoals) {
        const goals = preferences.nutritionGoals;
        const nutrition = recipe.nutrition;

        if (goals.maxCalories && nutrition.calories > goals.maxCalories) {
          logger.debug(
            `LOG Dietary Filtering: Recipe "${recipe.title}" filtered out - too many calories (${nutrition.calories} > ${goals.maxCalories})`
          );
          return false;
        }
        if (goals.minProtein && nutrition.protein < goals.minProtein) {
          logger.debug(
            `LOG Dietary Filtering: Recipe "${recipe.title}" filtered out - too little protein (${nutrition.protein} < ${goals.minProtein})`
          );
          return false;
        }
        if (goals.maxCarbs && nutrition.carbs > goals.maxCarbs) {
          logger.debug(
            `LOG Dietary Filtering: Recipe "${recipe.title}" filtered out - too many carbs (${nutrition.carbs} > ${goals.maxCarbs})`
          );
          return false;
        }
        if (goals.maxFat && nutrition.fat > goals.maxFat) {
          logger.debug(
            `LOG Dietary Filtering: Recipe "${recipe.title}" filtered out - too much fat (${nutrition.fat} > ${goals.maxFat})`
          );
          return false;
        }
      }

      logger.debug(
        `LOG Dietary Filtering: ✅ Recipe "${recipe.title}" passed all filters`
      );
      return true;
    });

    logger.debug(
      `\nLOG Dietary Filtering: Filtering complete. ${filteredRecipes.length} recipes passed all filters:`
    );
    filteredRecipes.forEach((recipe, index) => {
      logger.debug(
        `  ${index + 1}. ${recipe.title} (${recipe.cuisines?.join(', ') || 'no cuisine'}, ${recipe.diets?.join(', ') || 'no diet'})`
      );
    });

    return filteredRecipes;
  }

  /**
   * Select a recipe for a specific meal type
   */
  private selectRecipeForMeal(
    recipes: Recipe[],
    mealType: string,
    options: MealPlanningOptions,
    usedRecipes: Set<string>
  ): PlannedMeal | undefined {
    logger.debug(`\nLOG Recipe Selection: Starting selection for ${mealType}`);
    logger.debug(
      `LOG Recipe Selection: Total recipes available: ${recipes.length}`
    );
    logger.debug(
      `LOG Recipe Selection: Used recipes count: ${usedRecipes.size}`
    );

    // Filter recipes based on meal type and preferences
    const filteredRecipes = this.filterRecipesForMeal(
      recipes,
      mealType,
      options
    );

    logger.debug(
      `LOG Recipe Selection: ${filteredRecipes.length} recipes available for ${mealType} after meal type filtering`
    );

    // If no recipes match meal type, use any available recipe
    let availableRecipes = filteredRecipes;
    if (filteredRecipes.length === 0) {
      logger.debug(
        `LOG Recipe Selection: No recipes match ${mealType} preferences, using any available recipe`
      );
      availableRecipes = recipes;
    }

    if (availableRecipes.length === 0) {
      logger.debug(
        `LOG Recipe Selection: ❌ No recipes available at all for ${mealType}`
      );
      return undefined;
    }

    // Filter out already used recipes
    const unusedRecipes = availableRecipes.filter(
      recipe => !usedRecipes.has(recipe.id)
    );

    logger.debug(
      `LOG Recipe Selection: ${unusedRecipes.length} unused recipes available for ${mealType}`
    );

    // If all recipes have been used, allow reuse but prefer unused ones
    let selectedRecipes = unusedRecipes;
    if (unusedRecipes.length === 0) {
      logger.debug(
        `LOG Recipe Selection: All recipes used, allowing reuse for ${mealType}`
      );
      selectedRecipes = availableRecipes;
    }

    if (selectedRecipes.length === 0) {
      logger.debug(
        `LOG Recipe Selection: ❌ No recipes available for ${mealType}`
      );
      return undefined;
    }

    // Select a random recipe from available options
    const selectedRecipe =
      selectedRecipes[Math.floor(Math.random() * selectedRecipes.length)];
    usedRecipes.add(selectedRecipe.id);

    logger.debug(
      `LOG Recipe Selection: ✅ Selected "${selectedRecipe.title}" for ${mealType}`
    );
    logger.debug(
      `LOG Recipe Selection: Recipe details - Cuisine: [${selectedRecipe.cuisines?.join(', ') || 'none'}], Diet: [${selectedRecipe.diets?.join(', ') || 'none'}]`
    );
    logger.debug(
      `LOG Recipe Selection: Recipe nutrition:`,
      selectedRecipe.nutrition
    );

    return {
      recipeId: selectedRecipe.id,
      recipeTitle: selectedRecipe.title,
      servings: options.servingsPerMeal,
      nutrition: selectedRecipe.nutrition,
    };
  }

  /**
   * Select snack recipes
   */
  private selectSnackRecipes(
    recipes: Recipe[],
    options: MealPlanningOptions,
    usedRecipes: Set<string>
  ): PlannedMeal[] {
    const snackRecipes = this.filterRecipesForMeal(recipes, 'snack', options);
    const selectedSnacks = [];

    logger.debug(
      `LOG Meal Planning: ${snackRecipes.length} snack recipes available`
    );

    // Select 1-2 snack recipes
    const numSnacks = Math.min(2, snackRecipes.length);
    for (let i = 0; i < numSnacks; i++) {
      const recipe = snackRecipes[i];
      // Ensure the selected snack hasn't been used for breakfast/lunch/dinner on the same day
      if (usedRecipes.has(recipe.id)) {
        logger.debug(
          `LOG Meal Planning: Selected snack "${recipe.title}" is a duplicate. Retrying.`
        );
        // Retry selection for this snack
        const retrySnackRecipes = this.filterRecipesForMeal(
          recipes,
          'snack',
          options
        );
        if (retrySnackRecipes.length > 0) {
          const retryRecipe =
            retrySnackRecipes[
              Math.floor(Math.random() * retrySnackRecipes.length)
            ];
          selectedSnacks.push({
            recipeId: retryRecipe.id,
            recipeTitle: retryRecipe.title,
            servings: 1,
            nutrition: retryRecipe.nutrition,
          });
          usedRecipes.add(retryRecipe.id); // Mark as used
          logger.debug(
            `LOG Meal Planning: Selected snack "${retryRecipe.title}" after retry`
          );
        } else {
          logger.debug(
            `LOG Meal Planning: No more snack recipes available after retry.`
          );
          // If no more snacks, just add a placeholder or skip
          selectedSnacks.push({
            recipeId: 'placeholder',
            recipeTitle: 'No more snacks available',
            servings: 1,
            nutrition: undefined,
          });
        }
      } else {
        selectedSnacks.push({
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          servings: 1,
          nutrition: recipe.nutrition,
        });
        usedRecipes.add(recipe.id); // Mark as used
        logger.debug(`LOG Meal Planning: Selected snack "${recipe.title}"`);
      }
    }

    return selectedSnacks;
  }

  /**
   * Filter recipes for a specific meal type
   */
  private filterRecipesForMeal(
    recipes: Recipe[],
    mealType: string,
    _options: MealPlanningOptions
  ): Recipe[] {
    logger.debug(`LOG Meal Type Filtering: Filtering recipes for ${mealType}`);

    // For now, accept all recipes for any meal type to ensure variety
    // We can make this more sophisticated later with meal-specific keywords
    logger.debug(
      `LOG Meal Type Filtering: Accepting all recipes for ${mealType} (permissive mode)`
    );
    return recipes;

    // Original logic (commented out for now):
    /*
    const breakfastKeywords = ['pancake', 'waffle', 'cereal', 'oatmeal', 'toast', 'egg', 'bacon', 'breakfast', 'morning'];
    const lunchKeywords = ['sandwich', 'salad', 'soup', 'wrap', 'pasta', 'lunch', 'midday'];
    const dinnerKeywords = ['steak', 'chicken', 'fish', 'pasta', 'rice', 'curry', 'dinner', 'evening', 'main'];
    const snackKeywords = ['cookie', 'chips', 'fruit', 'nuts', 'yogurt', 'snack', 'appetizer'];
    
    const title = recipe.title.toLowerCase();
    const ingredients = recipe.ingredients.join(' ').toLowerCase();
    const searchText = `${title} ${ingredients}`;
    
    let isAppropriate = false;
    switch (mealType) {
      case 'breakfast':
        isAppropriate = breakfastKeywords.some(keyword => searchText.includes(keyword));
        break;
      case 'lunch':
        isAppropriate = lunchKeywords.some(keyword => searchText.includes(keyword));
        break;
      case 'dinner':
        isAppropriate = dinnerKeywords.some(keyword => searchText.includes(keyword));
        break;
      case 'snack':
        isAppropriate = snackKeywords.some(keyword => searchText.includes(keyword));
        break;
      default:
        isAppropriate = true;
    }
    
    logger.debug(`LOG Meal Appropriateness: Recipe "${recipe.title}" is ${isAppropriate ? '' : 'NOT '}appropriate for ${mealType}`);
    
    return isAppropriate;
    */
  }

  /**
   * Check if recipe is appropriate for meal type
   */
  private isRecipeAppropriateForMeal(
    recipe: Recipe,
    mealType: string
  ): boolean {
    // For now, accept all recipes for any meal type to ensure variety
    // We can make this more sophisticated later
    logger.debug(
      `LOG Meal Appropriateness: Accepting "${recipe.title}" for ${mealType} (permissive mode)`
    );
    return true;

    // Original logic (commented out for now):
    /*
    const breakfastKeywords = ['pancake', 'waffle', 'cereal', 'oatmeal', 'toast', 'egg', 'bacon', 'breakfast', 'morning'];
    const lunchKeywords = ['sandwich', 'salad', 'soup', 'wrap', 'pasta', 'lunch', 'midday'];
    const dinnerKeywords = ['steak', 'chicken', 'fish', 'pasta', 'rice', 'curry', 'dinner', 'evening', 'main'];
    const snackKeywords = ['cookie', 'chips', 'fruit', 'nuts', 'yogurt', 'snack', 'appetizer'];
    
    const title = recipe.title.toLowerCase();
    const ingredients = recipe.ingredients.join(' ').toLowerCase();
    const searchText = `${title} ${ingredients}`;
    
    logger.debug(`LOG Meal Appropriateness: Checking "${recipe.title}" for ${mealType}`);
    logger.debug(`LOG Meal Appropriateness: Search text: ${searchText.substring(0, 100)}...`);
    
    let isAppropriate = false;
    let matchedKeywords: string[] = [];
    
    switch (mealType) {
      case 'breakfast':
        matchedKeywords = breakfastKeywords.filter(keyword => searchText.includes(keyword));
        isAppropriate = matchedKeywords.length > 0;
        break;
      case 'lunch':
        matchedKeywords = lunchKeywords.filter(keyword => searchText.includes(keyword));
        isAppropriate = matchedKeywords.length > 0;
        break;
      case 'dinner':
        matchedKeywords = dinnerKeywords.filter(keyword => searchText.includes(keyword));
        isAppropriate = matchedKeywords.length > 0;
        break;
      case 'snack':
        matchedKeywords = snackKeywords.filter(keyword => searchText.includes(keyword));
        isAppropriate = matchedKeywords.length > 0;
        break;
      default:
        isAppropriate = true;
    }
    
    logger.debug(`LOG Meal Appropriateness: "${recipe.title}" for ${mealType} - Appropriate: ${isAppropriate}, Matched keywords: ${matchedKeywords.join(', ')}`);
    
    return isAppropriate;
    */
  }

  /**
   * Calculate total nutrition for meal plan
   */
  private calculateTotalNutrition(mealPlan: MealPlan): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    Object.values(mealPlan.meals).forEach(dayMeals => {
      Object.entries(dayMeals).forEach(([mealType, meal]) => {
        if (mealType === 'snacks' && Array.isArray(meal)) {
          // Handle snacks array
          meal.forEach(snack => {
            if (snack.nutrition) {
              totalCalories += snack.nutrition.calories * snack.servings;
              totalProtein += snack.nutrition.protein * snack.servings;
              totalCarbs += snack.nutrition.carbs * snack.servings;
              totalFat += snack.nutrition.fat * snack.servings;
            }
          });
        } else if (meal && typeof meal === 'object' && 'nutrition' in meal) {
          // Handle single meal
          const singleMeal = meal as PlannedMeal;
          if (singleMeal.nutrition) {
            totalCalories +=
              singleMeal.nutrition.calories * singleMeal.servings;
            totalProtein += singleMeal.nutrition.protein * singleMeal.servings;
            totalCarbs += singleMeal.nutrition.carbs * singleMeal.servings;
            totalFat += singleMeal.nutrition.fat * singleMeal.servings;
          }
        }
      });
    });

    logger.debug(
      `LOG Meal Planning: Calculated total nutrition - Calories: ${totalCalories}, Protein: ${totalProtein}g, Carbs: ${totalCarbs}g, Fat: ${totalFat}g`
    );

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
    };
  }

  /**
   * Generate shopping list from meal plan
   */
  private generateShoppingListFromMealPlan(
    mealPlan: MealPlan,
    _pantry: any[]
  ): ShoppingListItem[] {
    const neededIngredients = new Map<
      string,
      { quantity: number; unit: string; recipe: string }
    >();

    // Collect all ingredients from planned meals
    Object.values(mealPlan.meals).forEach(dayMeals => {
      Object.entries(dayMeals).forEach(([mealType, meal]) => {
        if (mealType === 'snacks' && Array.isArray(meal)) {
          // Handle snacks array
          meal.forEach(snack => {
            if (snack.recipeId) {
              // This would need to fetch the actual recipe to get ingredients
              // For now, we'll skip
            }
          });
        } else if (meal && typeof meal === 'object' && 'recipeId' in meal) {
          // Handle single meal
          const singleMeal = meal as PlannedMeal;
          if (singleMeal.recipeId) {
            // This would need to fetch the actual recipe to get ingredients
            // For now, we'll skip
          }
        }
      });
    });

    // Convert to shopping list items
    const shoppingList: ShoppingListItem[] = [];
    neededIngredients.forEach((details, ingredient) => {
      shoppingList.push({
        id: generateId(),
        name: ingredient,
        quantity: details.quantity,
        unit: details.unit,
        isCompleted: false,
        addedBy: mealPlan.userId,
        householdId: mealPlan.householdId,
        isShared: true,
        notes: `From meal plan: ${details.recipe}`,
        createdAt: new Date().toISOString(),
      });
    });

    return shoppingList;
  }

  /**
   * Get the start date of the current week (Monday)
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
   * Save meal plan to database
   */
  async saveMealPlan(mealPlan: MealPlan): Promise<void> {
    try {
      const { error } = await supabaseService.supabase
        .from('meal_plans')
        .upsert(
          {
            id: mealPlan.id,
            user_id: mealPlan.userId,
            household_id: mealPlan.householdId ?? null,
            week_start_date: mealPlan.weekStartDate,
            meals: mealPlan.meals,
            total_nutrition: mealPlan.totalNutrition ?? null,
            created_at: mealPlan.createdAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      if (error) throw error;
    } catch (error) {
      logger.error('Error saving meal plan:', error);
      throw error;
    }
  }

  /**
   * Get the most recent meal plan for the user (or household).
   */
  async getCurrentMealPlan(
    userId: string,
    householdId?: string
  ): Promise<MealPlan | null> {
    try {
      const query = supabaseService.supabase
        .from('meal_plans')
        .select('*')
        .order('week_start_date', { ascending: false })
        .limit(1);

      const { data, error } = householdId
        ? await query.or(`user_id.eq.${userId},household_id.eq.${householdId}`)
        : await query.eq('user_id', userId);

      if (error || !data || data.length === 0) return null;

      const row = data[0];
      return {
        id: row.id,
        userId: row.user_id,
        householdId: row.household_id ?? undefined,
        weekStartDate: row.week_start_date,
        meals: row.meals,
        totalNutrition: row.total_nutrition ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logger.error('Error fetching meal plan:', error);
      return null;
    }
  }
}

export const mealPlanningService = new MealPlanningService();
