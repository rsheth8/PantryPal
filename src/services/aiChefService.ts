import { AIRecipeRequest, AIRecipeSuggestion, UserPreferences, GroceryItem, Recipe } from '../types';

// Mock AI Chef service - in production, this would connect to an actual LLM API
export class AIChefService {
  private static instance: AIChefService;
  
  static getInstance(): AIChefService {
    if (!AIChefService.instance) {
      AIChefService.instance = new AIChefService();
    }
    return AIChefService.instance;
  }

  /**
   * Generate AI-powered recipe suggestions based on user prompt and context
   */
  async generateRecipeSuggestions(request: AIRecipeRequest): Promise<AIRecipeSuggestion[]> {
    try {
      // In production, this would call an actual LLM API (OpenAI, Anthropic, etc.)
      const suggestions = await this.mockAIGeneration(request);
      return suggestions;
    } catch (error) {
      console.error('AI Chef error:', error);
      throw new Error('Failed to generate recipe suggestions');
    }
  }

  /**
   * Get personalized recipe recommendations based on user preferences and pantry
   */
  async getPersonalizedRecommendations(
    userPreferences: UserPreferences,
    pantryItems: GroceryItem[],
    limit: number = 10
  ): Promise<Recipe[]> {
    try {
      // Mock implementation - in production, this would use ML algorithms
      const recommendations = await this.mockPersonalizedRecommendations(
        userPreferences,
        pantryItems,
        limit
      );
      return recommendations;
    } catch (error) {
      console.error('Recommendation error:', error);
      throw new Error('Failed to get personalized recommendations');
    }
  }

  /**
   * Calculate recipe match score based on user preferences and pantry
   */
  calculateRecipeMatch(
    recipe: Recipe,
    userPreferences: UserPreferences,
    pantryItems: GroceryItem[]
  ): { score: number; reasons: string[]; pantryMatch: number; missingIngredients: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const missingIngredients: string[] = [];

    // Check dietary restrictions
    if (userPreferences.dietaryRestrictions.length > 0) {
      const hasDietaryMatch = userPreferences.dietaryRestrictions.some(restriction =>
        recipe.diets.includes(restriction.toLowerCase())
      );
      if (hasDietaryMatch) {
        score += 20;
        reasons.push('Matches your dietary preferences');
      }
    }

    // Check cuisine preferences
    if (userPreferences.preferredCuisines.length > 0) {
      const hasCuisineMatch = userPreferences.preferredCuisines.some(cuisine =>
        recipe.cuisines.includes(cuisine.toLowerCase())
      );
      if (hasCuisineMatch) {
        score += 15;
        reasons.push('Matches your preferred cuisines');
      }
    }

    // Check cooking skill level
    if (recipe.difficulty === userPreferences.cookingSkill) {
      score += 10;
      reasons.push('Matches your cooking skill level');
    }

    // Check cooking time preferences
    const recipeTime = recipe.prepTime + recipe.cookTime;
    if (userPreferences.preferredCookingTime === 'quick' && recipeTime <= 30) {
      score += 10;
      reasons.push('Quick to prepare');
    } else if (userPreferences.preferredCookingTime === 'medium' && recipeTime <= 60) {
      score += 10;
      reasons.push('Moderate preparation time');
    }

    // Check pantry match
    const pantryMatch = this.calculatePantryMatch(recipe, pantryItems);
    score += pantryMatch.score;
    missingIngredients.push(...pantryMatch.missingIngredients);

    if (pantryMatch.score > 0) {
      reasons.push(`Uses ${Math.round(pantryMatch.percentage)}% of your pantry items`);
    }

    // Check health goals
    if (userPreferences.healthGoals.length > 0) {
      const hasHealthMatch = this.checkHealthGoals(recipe, userPreferences.healthGoals);
      if (hasHealthMatch) {
        score += 10;
        reasons.push('Aligns with your health goals');
      }
    }

    return {
      score: Math.min(score, 100),
      reasons,
      pantryMatch: pantryMatch.percentage,
      missingIngredients,
    };
  }

  private calculatePantryMatch(recipe: Recipe, pantryItems: GroceryItem[]): {
    score: number;
    percentage: number;
    missingIngredients: string[];
  } {
    const pantryItemNames = pantryItems.map(item => item.name.toLowerCase());
    const recipeIngredients = recipe.ingredients.map(ingredient => ingredient.toLowerCase());
    
    let matches = 0;
    const missingIngredients: string[] = [];

    recipeIngredients.forEach(ingredient => {
      const hasMatch = pantryItemNames.some(pantryItem =>
        pantryItem.includes(ingredient) || ingredient.includes(pantryItem)
      );
      
      if (hasMatch) {
        matches++;
      } else {
        missingIngredients.push(ingredient);
      }
    });

    const percentage = recipeIngredients.length > 0 ? (matches / recipeIngredients.length) * 100 : 0;
    const score = percentage * 0.3; // 30% of total score

    return { score, percentage, missingIngredients };
  }

  private checkHealthGoals(recipe: Recipe, healthGoals: string[]): boolean {
    // Mock health goal checking
    const healthGoalKeywords = {
      'weight_loss': ['low-calorie', 'light', 'vegetable'],
      'muscle_gain': ['protein', 'high-protein'],
      'heart_healthy': ['heart-healthy', 'low-fat', 'omega-3'],
      'low_carb': ['low-carb', 'keto'],
    };

    return healthGoals.some(goal => {
      const keywords = healthGoalKeywords[goal as keyof typeof healthGoalKeywords] || [];
      return keywords.some(keyword =>
        recipe.tags.includes(keyword) || recipe.title.toLowerCase().includes(keyword)
      );
    });
  }

  private async mockAIGeneration(request: AIRecipeRequest): Promise<AIRecipeSuggestion[]> {
    // Mock AI-generated recipes based on the prompt and context
    const mockSuggestions: AIRecipeSuggestion[] = [
      {
        id: 'ai-1',
        title: 'Pantry-Friendly Mediterranean Bowl',
        description: 'A healthy bowl using your available ingredients with Mediterranean flavors',
        ingredients: [
          'quinoa',
          'chickpeas',
          'tomatoes',
          'cucumber',
          'olive oil',
          'lemon',
          'herbs',
        ],
        instructions: [
          'Cook quinoa according to package instructions',
          'Drain and rinse chickpeas',
          'Chop tomatoes and cucumber',
          'Mix all ingredients with olive oil and lemon juice',
          'Season with herbs and serve',
        ],
        estimatedTime: 25,
        difficulty: 'easy',
        cuisine: 'mediterranean',
        tags: ['healthy', 'quick', 'vegetarian'],
        nutritionInfo: {
          calories: 320,
          protein: 12,
          carbs: 45,
          fat: 8,
        },
        pantryUtilization: 85,
        confidence: 92,
        reasoning: 'Based on your Mediterranean preferences and available pantry items, this recipe maximizes your existing ingredients while providing a healthy, quick meal.',
      },
      {
        id: 'ai-2',
        title: 'Quick Pantry Pasta',
        description: 'A simple pasta dish using your pantry staples',
        ingredients: [
          'pasta',
          'canned tomatoes',
          'garlic',
          'olive oil',
          'herbs',
          'cheese',
        ],
        instructions: [
          'Boil pasta until al dente',
          'Sauté garlic in olive oil',
          'Add canned tomatoes and herbs',
          'Combine with pasta',
          'Top with cheese and serve',
        ],
        estimatedTime: 20,
        difficulty: 'easy',
        cuisine: 'italian',
        tags: ['quick', 'comfort', 'easy'],
        nutritionInfo: {
          calories: 450,
          protein: 15,
          carbs: 65,
          fat: 12,
        },
        pantryUtilization: 90,
        confidence: 88,
        reasoning: 'Perfect for a quick weeknight meal using your Italian cuisine preferences and available pantry items.',
      },
    ];

    // Filter based on user preferences
    return mockSuggestions.filter(suggestion => {
      if (request.context.mood === 'comfort') {
        return suggestion.tags.includes('comfort');
      }
      if (request.context.availableTime && request.context.availableTime < 30) {
        return suggestion.estimatedTime <= request.context.availableTime;
      }
      return true;
    });
  }

  private async mockPersonalizedRecommendations(
    userPreferences: UserPreferences,
    pantryItems: GroceryItem[],
    limit: number
  ): Promise<Recipe[]> {
    // Mock personalized recommendations
    const mockRecipes: Recipe[] = [
      {
        id: 'rec-1',
        title: 'Vegetarian Buddha Bowl',
        cuisines: ['asian'],
        diets: ['vegetarian'],
        difficulty: 'easy',
        prepTime: 15,
        cookTime: 20,
        servings: 2,
        ingredients: ['quinoa', 'tofu', 'vegetables', 'soy sauce'],
        instructions: ['Cook quinoa', 'Prepare tofu', 'Assemble bowl'],
        tags: ['healthy', 'vegetarian', 'asian'],
        nutrition: {
          calories: 350,
          protein: 15,
          carbs: 45,
          fat: 8,
          fiber: 8,
          sugar: 4,
          sodium: 400,
        },
        isFavorite: false,
        rating: 4.5,
        canCookNow: true,
        missingIngredients: [],
        createdBy: 'system',
        isShared: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'rec-2',
        title: 'Quick Mediterranean Pasta',
        cuisines: ['mediterranean'],
        diets: ['vegetarian'],
        difficulty: 'easy',
        prepTime: 10,
        cookTime: 15,
        servings: 2,
        ingredients: ['pasta', 'olive oil', 'garlic', 'herbs'],
        instructions: ['Boil pasta', 'Sauté garlic', 'Combine'],
        tags: ['quick', 'mediterranean', 'easy'],
        nutrition: {
          calories: 400,
          protein: 12,
          carbs: 60,
          fat: 10,
          fiber: 4,
          sugar: 2,
          sodium: 300,
        },
        isFavorite: false,
        rating: 4.2,
        canCookNow: true,
        missingIngredients: [],
        createdBy: 'system',
        isShared: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Sort by match score
    const scoredRecipes = mockRecipes.map(recipe => ({
      recipe,
      match: this.calculateRecipeMatch(recipe, userPreferences, pantryItems),
    }));

    scoredRecipes.sort((a, b) => b.match.score - a.match.score);

    return scoredRecipes.slice(0, limit).map(item => item.recipe);
  }
}

export const aiChefService = AIChefService.getInstance();
