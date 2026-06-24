import { GroceryItem, ShoppingListItem, Recipe } from '../types';

export interface MissingIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  sourceRecipe?: string;
}

class ShoppingListSyncService {
  /**
   * Sync missing ingredients from recipes to shopping list
   */
  syncMissingIngredients(
    recipes: Recipe[],
    pantry: GroceryItem[],
    shoppingList: ShoppingListItem[]
  ): MissingIngredient[] {
    const missingIngredients: MissingIngredient[] = [];

    // Get available ingredients from pantry
    const availableIngredients = pantry
      .filter(item => !item.isExpired && item.quantity > 0)
      .map(item => item.name.toLowerCase());

    recipes.forEach(recipe => {
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        return;
      }

      // Calculate missing ingredients
      const { missing } = this.checkIngredientAvailability(
        recipe.ingredients,
        availableIngredients
      );

      missing.forEach(ingredientName => {
        // Check if already in shopping list
        const alreadyInList = shoppingList.some(
          item =>
            item.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
            ingredientName.toLowerCase().includes(item.name.toLowerCase())
        );

        if (!alreadyInList) {
          const category = this.categorizeIngredient(ingredientName);
          const quantity = this.suggestQuantity(ingredientName, category);
          const unit = this.suggestUnit(ingredientName, category);
          const priority = this.calculatePriority(ingredientName, pantry);

          missingIngredients.push({
            name: ingredientName,
            quantity,
            unit,
            category,
            priority,
            sourceRecipe: recipe.title,
          });
        }
      });
    });

    return missingIngredients;
  }

  /**
   * Check ingredient availability
   */
  private checkIngredientAvailability(
    ingredients: string[],
    availableIngredients: string[]
  ): { available: string[]; missing: string[] } {
    const available: string[] = [];
    const missing: string[] = [];

    ingredients.forEach(ingredient => {
      const ingredientName = ingredient.toLowerCase();
      const isAvailable = availableIngredients.some(
        available =>
          available.includes(ingredientName) ||
          ingredientName.includes(available)
      );

      if (isAvailable) {
        available.push(ingredient);
      } else {
        missing.push(ingredient);
      }
    });

    return { available, missing };
  }

  /**
   * Categorize ingredient
   */
  private categorizeIngredient(ingredientName: string): string {
    const name = ingredientName.toLowerCase();

    if (
      name.includes('milk') ||
      name.includes('cheese') ||
      name.includes('yogurt') ||
      name.includes('cream')
    ) {
      return 'Dairy & Eggs';
    } else if (
      name.includes('apple') ||
      name.includes('banana') ||
      name.includes('tomato') ||
      name.includes('lettuce')
    ) {
      return 'Fruits & Vegetables';
    } else if (
      name.includes('chicken') ||
      name.includes('beef') ||
      name.includes('fish') ||
      name.includes('pork')
    ) {
      return 'Meat & Fish';
    } else if (
      name.includes('bread') ||
      name.includes('rice') ||
      name.includes('pasta') ||
      name.includes('flour')
    ) {
      return 'Grains & Bread';
    } else {
      return 'Other';
    }
  }

  /**
   * Suggest quantity
   */
  private suggestQuantity(_ingredientName: string, _category: string): number {
    // Simple quantity suggestions
    return 1;
  }

  /**
   * Suggest unit
   */
  private suggestUnit(ingredientName: string, _category: string): string {
    const name = ingredientName.toLowerCase();

    if (
      name.includes('milk') ||
      name.includes('water') ||
      name.includes('juice')
    ) {
      return 'cup';
    } else if (
      name.includes('flour') ||
      name.includes('sugar') ||
      name.includes('salt')
    ) {
      return 'tbsp';
    } else {
      return 'piece';
    }
  }

  /**
   * Calculate priority
   */
  private calculatePriority(
    _ingredientName: string,
    _pantry: GroceryItem[]
  ): 'high' | 'medium' | 'low' {
    // Simple priority calculation
    return 'medium';
  }

  /**
   * Find duplicates in shopping list
   */
  findDuplicates(shoppingList: ShoppingListItem[]): ShoppingListItem[][] {
    const duplicates: ShoppingListItem[][] = [];
    const seen = new Map<string, ShoppingListItem[]>();

    shoppingList.forEach(item => {
      const key = item.name.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key)!.push(item);
    });

    seen.forEach(items => {
      if (items.length > 1) {
        duplicates.push(items);
      }
    });

    return duplicates;
  }

  /**
   * Merge duplicate items
   */
  mergeDuplicateItems(
    duplicates: ShoppingListItem[][],
    updateShoppingListItem: (
      id: string,
      updates: Partial<ShoppingListItem>
    ) => void,
    removeShoppingListItem: (id: string) => void
  ): void {
    duplicates.forEach(group => {
      if (group.length < 2) return;

      const firstItem = group[0];
      const totalQuantity = group.reduce((sum, item) => sum + item.quantity, 0);
      const combinedNotes = group
        .map(item => item.notes)
        .filter(note => note && note.trim())
        .join('; ');

      // Update first item with combined data
      updateShoppingListItem(firstItem.id, {
        quantity: totalQuantity,
        notes: combinedNotes,
      });

      // Remove other items
      group.slice(1).forEach(item => {
        removeShoppingListItem(item.id);
      });
    });
  }

  /**
   * Add missing ingredients to shopping list
   */
  addMissingIngredientsToShoppingList(
    missingIngredients: MissingIngredient[],
    addShoppingListItem: (item: Omit<ShoppingListItem, 'id'>) => void
  ): void {
    missingIngredients.forEach(ingredient => {
      addShoppingListItem({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category,
        notes: `From recipe: ${ingredient.sourceRecipe}`,
        price: 0,
        isShared: true,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        addedBy: 'current-user', // This should be passed from the calling function
      });
    });
  }

  // Placeholder methods for future features
  getShoppingListInsights(): string {
    return 'Shopping list insights coming soon!';
  }
}

export const shoppingListSyncService = new ShoppingListSyncService();
