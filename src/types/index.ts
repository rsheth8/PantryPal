export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  household_id?: string; // Database column name
  householdId?: string; // Frontend property name
  created_at: string; // Database column name
  createdAt?: string; // Frontend property name
  last_active: string; // Database column name
  lastActive?: string; // Frontend property name
}

export interface Household {
  id: string;
  name: string;
  code: string; // Join code for household
  owner_id: string; // Database column name
  members: string[]; // User IDs
  created_at: string; // Database column name
  settings: {
    allow_private_items: boolean; // Database JSONB key
    allowPrivateItems?: boolean; // Frontend property name
    require_approval_for_shared: boolean; // Database JSONB key
    default_item_visibility: 'shared' | 'private'; // Database JSONB key
  };
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expirationDate: string;
  addedBy: string; // User ID
  isShared: boolean; // true = household shared, false = private
  householdId?: string; // null for private items
  price?: number;
  notes?: string;
  isExpired: boolean;
  isUsed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  image?: string;
  imageUrl?: string;
  canCookNow: boolean;
  missingIngredients: string[];
  tags: string[];
  description?: string;
  createdBy: string; // User ID
  householdId?: string; // null for private recipes
  isShared: boolean;
  createdAt: string;
  updatedAt?: string;

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
  dishTypes?: string[];
  diets?: string[];
  equipment?: string[];
  winePairing?: {
    pairedWines: string[];
    pairingText: string;
  };
  // Scaling support
  originalServings?: number;
  scaledServings?: number;
  scaledIngredients?: Array<{
    name: string;
    amount: number;
    unit: string;
    originalAmount: number;
  }>;

  // New enhancements
  difficulty?: 'easy' | 'medium' | 'hard';
  rating?: number; // 1-5 stars
  isFavorite?: boolean;
  allergens?: string[]; // ['nuts', 'dairy', 'gluten', etc.]
  cookingMethod?: string; // 'bake', 'fry', 'grill', etc.
  seasonality?: string[]; // ['spring', 'summer', 'fall', 'winter']
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  isCompleted: boolean;
  addedBy: string; // User ID
  householdId?: string; // null for private items
  isShared: boolean;
  notes?: string;
  price?: number;
  createdAt: string;
  updatedAt?: string;
}

/** Pantry/app settings stored in user_preferences table */
export interface PantrySettings {
  lowStockThreshold: number;
  expirationReminderDays: number;
  defaultItemVisibility: 'shared' | 'private';
  notifications: {
    expirationReminders: boolean;
    lowStockAlerts: boolean;
    householdUpdates: boolean;
  };
}

/** Recipe/dietary preferences from onboarding quiz */
export interface UserPreferences {
  id: string;
  userId: string;

  // Dietary Preferences
  dietaryRestrictions: string[];
  allergies: string[];
  preferredCuisines: string[];
  dislikedIngredients: string[];
  
  // Cooking Preferences
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
  preferredCookingTime: 'quick' | 'medium' | 'slow';
  preferredServings: number;
  
  // Taste Preferences
  spiceTolerance: 'mild' | 'medium' | 'hot';
  preferredFlavors: string[]; // e.g., ['sweet', 'savory', 'spicy', 'herbaceous']
  
  // Health Goals
  healthGoals: string[]; // e.g., ['weight_loss', 'muscle_gain', 'heart_healthy', 'low_carb']
  calorieTarget?: number;
  macroPreferences?: {
    protein: number; // percentage
    carbs: number;
    fat: number;
  };
  
  // Recipe Preferences
  preferredRecipeTypes: string[]; // e.g., ['breakfast', 'lunch', 'dinner', 'snacks', 'desserts']
  cookingEquipment: string[]; // e.g., ['oven', 'stovetop', 'slow_cooker', 'air_fryer']
  
  createdAt: string;
  updatedAt: string;
}

export interface RecipeRecommendation {
  id: string;
  recipeId: string;
  userId: string;
  score: number; // 0-100, how well it matches preferences
  reasons: string[]; // why this recipe was recommended
  pantryMatch: number; // 0-100, how many ingredients they have
  missingIngredients: string[];
  createdAt: string;
}

export interface AIRecipeRequest {
  prompt: string;
  context: {
    pantryItems: GroceryItem[];
    userPreferences: UserPreferences;
    availableTime?: number; // minutes
    mood?: string; // e.g., 'comfort', 'energetic', 'relaxed'
    occasion?: string; // e.g., 'weeknight', 'weekend', 'special'
  };
}

export interface AIRecipeSuggestion {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  tags: string[];
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  pantryUtilization: number; // percentage of ingredients from pantry
  confidence: number; // 0-100, how confident AI is in this suggestion
  reasoning: string; // why AI suggested this recipe
}

export interface AppState {
  // User and household management
  currentUser: User | null;
  currentHousehold: Household | null;
  households: Household[];
  users: User[]; // Household members

  // Data with user context
  pantry: GroceryItem[];
  recipes: Recipe[];
  shoppingList: ShoppingListItem[];
  preferences: PantrySettings;
  favoriteRecipes: string[]; // Array of recipe IDs

  // UI state
  isLoading: boolean;
  error: string | null;
}

export interface MealPlan {
  id: string;
  userId: string;
  householdId?: string;
  weekStartDate: string; // ISO date string
  meals: {
    [day: string]: {
      // 'monday', 'tuesday', etc.
      breakfast?: PlannedMeal;
      lunch?: PlannedMeal;
      dinner?: PlannedMeal;
      snacks?: PlannedMeal[];
    };
  };
  totalNutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  shoppingList?: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PlannedMeal {
  recipeId: string;
  recipeTitle: string;
  servings: number;
  scaledServings?: number;
  notes?: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface DietaryPreferences {
  userId: string;

  // SACRED - Never relaxed
  diets: string[]; // ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo']
  allergens: string[]; // ['nuts', 'dairy', 'gluten', 'eggs', 'soy', 'shellfish']
  medicalRestrictions: string[]; // ['diabetic', 'celiac', 'low-sodium']

  // FLEXIBLE - Can be relaxed
  cuisines: string[]; // ['italian', 'mexican', 'asian', 'mediterranean', 'indian', 'american']
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'easy' | 'medium' | 'hard' | 'any';
  maxPrepTime?: number; // in minutes
  maxCookTime?: number; // in minutes

  // Nutrition Goals
  nutritionGoals?: {
    dailyCalories?: number;
    proteinPercentage?: number; // 0-100
    carbsPercentage?: number; // 0-100
    fatPercentage?: number; // 0-100
    maxFiber?: number; // grams
    maxSugar?: number; // grams
    maxSodium?: number; // mg
    maxCalories?: number; // For meal planning
    minProtein?: number; // For meal planning
    maxCarbs?: number; // For meal planning
    maxFat?: number; // For meal planning
  };

  // Lifestyle Preferences
  lifestyle?: {
    familySize: number; // 1, 2, 4, 6+
    budget: 'budget' | 'moderate' | 'premium';
    mealFrequency: 3 | 5 | 6; // meals per day
    prepStyle: 'quick' | 'batch' | 'slow-cooker' | 'any';
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
  };

  createdAt: string;
  updatedAt: string;
}

// Enhanced Recipe Features Interfaces

export interface RecipeFavorite {
  id: string;
  userId: string;
  recipeId: string;
  createdAt: string;
}

export interface UserRecipePreferences {
  userId: string;
  dietaryRestrictions: string[];
  allergies: string[];
  preferredCuisines: string[];
  cookingSkill: 'beginner' | 'intermediate' | 'advanced';
  spiceTolerance: 'low' | 'medium' | 'high';
  healthGoals: string[];
  nutritionGoals: {
    maxCalories: number;
    minProtein: number;
    maxCarbs: number;
    maxFat: number;
  };
  difficultyPreference: 'easy' | 'medium' | 'hard' | 'any';
  maxCookingTime: number;
  servingSizePreference: number;
  createdAt: string;
  updatedAt: string;
}

export interface CookingSession {
  id: string;
  userId: string;
  recipeId: string;
  householdId: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  currentStep: number;
  startTime: string;
  endTime?: string;
  totalDuration?: number; // in minutes
  notes?: string;
  createdAt: string;
}

export interface CookingSessionStep {
  id: string;
  sessionId: string;
  stepNumber: number;
  instruction: string;
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface RecipeRating {
  id: string;
  userId: string;
  recipeId: string;
  rating: number; // 1-5
  review?: string;
  difficultyRating?: number; // 1-5
  tasteRating?: number; // 1-5
  wouldCookAgain?: boolean;
  createdAt: string;
  updatedAt: string;
}
