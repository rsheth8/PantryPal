import { shoppingListSyncService } from '../../services/shoppingListSyncService';
import { GroceryItem, Recipe, ShoppingListItem } from '../../types';

const makePantryItem = (overrides: Partial<GroceryItem> = {}): GroceryItem => ({
  id: '1',
  name: 'Milk',
  quantity: 2,
  unit: 'gallon',
  category: 'Dairy & Eggs',
  expirationDate: '2026-12-31',
  addedBy: 'user-1',
  isShared: true,
  isExpired: false,
  isUsed: false,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...overrides,
});

const makeShoppingItem = (
  overrides: Partial<ShoppingListItem> = {}
): ShoppingListItem => ({
  id: 's1',
  name: 'Milk',
  quantity: 1,
  unit: 'gallon',
  category: 'Dairy & Eggs',
  isCompleted: false,
  addedBy: 'user-1',
  isShared: true,
  createdAt: '2026-01-01',
  ...overrides,
});

const makeRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'r1',
  title: 'Pancakes',
  ingredients: ['flour', 'eggs', 'milk'],
  instructions: ['Mix', 'Cook'],
  canCookNow: false,
  missingIngredients: ['flour'],
  tags: [],
  createdBy: 'user-1',
  isShared: true,
  createdAt: '2026-01-01',
  ...overrides,
});

describe('shoppingListSyncService', () => {
  it('finds shopping items already in pantry', () => {
    const pantry = [makePantryItem({ name: 'Milk' })];
    const shoppingList = [
      makeShoppingItem({ name: 'Milk' }),
      makeShoppingItem({ id: 's2', name: 'Bread' }),
    ];

    const stocked = shoppingListSyncService.findItemsAlreadyInPantry(
      shoppingList,
      pantry
    );

    expect(stocked).toHaveLength(1);
    expect(stocked[0].name).toBe('Milk');
  });

  it('detects missing recipe ingredients not in shopping list', () => {
    const recipes = [makeRecipe()];
    const pantry: GroceryItem[] = [makePantryItem({ name: 'eggs' })];
    const shoppingList: ShoppingListItem[] = [];

    const missing = shoppingListSyncService.syncMissingIngredients(
      recipes,
      pantry,
      shoppingList
    );

    expect(missing.length).toBeGreaterThan(0);
    expect(missing.some((m: { name: string }) => m.name === 'flour')).toBe(true);
  });

  it('isInPantry matches partial names', () => {
    const pantry = [makePantryItem({ name: 'Whole Milk' })];
    expect(shoppingListSyncService.isInPantry('milk', pantry)).toBe(true);
    expect(shoppingListSyncService.isInPantry('bread', pantry)).toBe(false);
  });
});
