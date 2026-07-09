import { Recipe } from '../types';

export type RecipesStackParamList = {
  RecipesMain: undefined;
  AIChef: undefined;
  Preferences: undefined;
  EnhancedSearch: undefined;
  RecipeDetail: { recipe: Recipe };
  CookingMode: { recipe: Recipe };
};

export type PantryStackParamList = {
  PantryMain: {
    prefillName?: string;
    showAddModal?: boolean;
    filter?: 'all' | 'expiring' | 'lowStock';
  };
};

export type RootTabParamList = {
  Dashboard: undefined;
  Pantry: PantryStackParamList['PantryMain'];
  Recipes: undefined;
  Shopping: undefined;
  Household: undefined;
  Scanner: undefined;
  Settings: undefined;
};
