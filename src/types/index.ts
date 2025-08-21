export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  household_id?: string; // Database column name
  created_at: string; // Database column name
  last_active: string; // Database column name
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
  canCookNow: boolean;
  missingIngredients: string[];
  tags: string[];
  createdBy: string; // User ID
  householdId?: string; // null for private recipes
  isShared: boolean;
  createdAt: string;

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
}

export interface UserPreferences {
  lowStockThreshold: number;
  expirationReminderDays: number;
  defaultItemVisibility: 'shared' | 'private';
  notifications: {
    expirationReminders: boolean;
    lowStockAlerts: boolean;
    householdUpdates: boolean;
  };
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
  preferences: UserPreferences;

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
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'any';
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
