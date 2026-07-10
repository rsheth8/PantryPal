import { shoppingListSyncService } from '../../services/shoppingListSyncService';
import { GroceryItem, Recipe, ShoppingListItem } from '../../types';

const recipe = (ingredients: string[]): Recipe => ({
  id: 'r1',
  title: 'Test Recipe',
  ingredients,
  instructions: [],
  canCookNow: false,
  missingIngredients: [],
  tags: [],
  createdBy: 'user',
  isShared: true,
  createdAt: new Date().toISOString(),
});

const pantryItem = (name: string): GroceryItem => ({
  id: `p-${name}`,
  name,
  quantity: 2,
  unit: 'pcs',
  category: 'Other',
  expirationDate: '',
  addedBy: 'user',
  isShared: true,
  isExpired: false,
  isUsed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('shoppingListSyncService.syncMissingIngredients', () => {
  it('returns ingredients not present in the pantry', () => {
    const recipes = [recipe(['eggs', 'flour', 'sugar'])];
    const pantry = [pantryItem('eggs')];
    const shoppingList: ShoppingListItem[] = [];

    const missing = shoppingListSyncService.syncMissingIngredients(
      recipes,
      pantry,
      shoppingList
    );
    const names = missing.map(m => m.name.toLowerCase());
    expect(names).toContain('flour');
    expect(names).toContain('sugar');
    expect(names).not.toContain('eggs');
  });

  it('does not duplicate items already on the shopping list', () => {
    const recipes = [recipe(['flour'])];
    const pantry: GroceryItem[] = [];
    const shoppingList: ShoppingListItem[] = [
      {
        id: 's1',
        name: 'flour',
        quantity: 1,
        unit: 'pcs',
        isCompleted: false,
        addedBy: 'user',
        isShared: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const missing = shoppingListSyncService.syncMissingIngredients(
      recipes,
      pantry,
      shoppingList
    );
    expect(missing).toHaveLength(0);
  });

  it('returns nothing when the pantry has everything', () => {
    const recipes = [recipe(['eggs', 'milk'])];
    const pantry = [pantryItem('eggs'), pantryItem('milk')];

    const missing = shoppingListSyncService.syncMissingIngredients(
      recipes,
      pantry,
      []
    );
    expect(missing).toHaveLength(0);
  });
});

describe('shoppingListSyncService.findDuplicates', () => {
  it('groups items with the same name', () => {
    const list: ShoppingListItem[] = [
      {
        id: '1',
        name: 'Milk',
        quantity: 1,
        unit: 'L',
        isCompleted: false,
        addedBy: 'u',
        isShared: true,
        createdAt: '',
      },
      {
        id: '2',
        name: 'milk',
        quantity: 2,
        unit: 'L',
        isCompleted: false,
        addedBy: 'u',
        isShared: true,
        createdAt: '',
      },
      {
        id: '3',
        name: 'Bread',
        quantity: 1,
        unit: 'loaf',
        isCompleted: false,
        addedBy: 'u',
        isShared: true,
        createdAt: '',
      },
    ];
    const duplicates = shoppingListSyncService.findDuplicates(list);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]).toHaveLength(2);
  });
});
