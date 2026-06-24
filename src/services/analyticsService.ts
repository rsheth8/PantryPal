import { GroceryItem, ShoppingListItem, Recipe } from '../types';

export interface SimpleAnalyticsData {
  totalItems: number;
  sharedItems: number;
  privateItems: number;
  expiredItems: number;
  expiringSoon: number;
  totalSpent: number;
  shoppingItems: number;
  completedShopping: number;
  totalRecipes: number;
  canCookNow: number;
}

class AnalyticsService {
  getSimpleAnalytics(
    pantry: GroceryItem[],
    shoppingList: ShoppingListItem[],
    recipes: Recipe[]
  ): SimpleAnalyticsData {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return {
      totalItems: pantry.length,
      sharedItems: pantry.filter(item => item.isShared).length,
      privateItems: pantry.filter(item => !item.isShared).length,
      expiredItems: pantry.filter(item => item.isExpired).length,
      expiringSoon: pantry.filter(item => {
        const expirationDate = new Date(item.expirationDate);
        return expirationDate <= threeDaysFromNow && !item.isExpired;
      }).length,
      totalSpent: pantry.reduce((sum, item) => sum + (item.price || 0), 0),
      shoppingItems: shoppingList.length,
      completedShopping: shoppingList.filter(item => item.isCompleted).length,
      totalRecipes: recipes.length,
      canCookNow: recipes.filter(recipe => recipe.canCookNow).length,
    };
  }

  // Placeholder methods for future analytics features
  getSpendingInsights(): string {
    return 'Spending analytics coming soon!';
  }

  getWasteInsights(): string {
    return 'Waste analytics coming soon!';
  }

  getHouseholdInsights(): string {
    return 'Household analytics coming soon!';
  }

  getShoppingInsights(): string {
    return 'Shopping analytics coming soon!';
  }
}

export const analyticsService = new AnalyticsService();
