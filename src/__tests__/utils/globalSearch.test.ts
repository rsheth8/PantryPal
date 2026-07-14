import { searchAll } from '../../utils/globalSearch';
import { GroceryItem, Recipe, ShoppingListItem } from '../../types';

const pantryItem = (o: Partial<GroceryItem>): GroceryItem => ({
  id: Math.random().toString(),
  name: 'Milk',
  quantity: 1,
  unit: 'L',
  category: 'Dairy & Eggs',
  expirationDate: '',
  addedBy: 'u',
  isShared: true,
  isExpired: false,
  isUsed: false,
  createdAt: '',
  updatedAt: '',
  ...o,
});

const recipe = (o: Partial<Recipe>): Recipe => ({
  id: Math.random().toString(),
  title: 'Pancakes',
  ingredients: [],
  instructions: [],
  canCookNow: false,
  missingIngredients: [],
  tags: [],
  createdBy: 'u',
  isShared: true,
  createdAt: '',
  ...o,
});

const shopping = (o: Partial<ShoppingListItem>): ShoppingListItem => ({
  id: Math.random().toString(),
  name: 'Eggs',
  quantity: 12,
  unit: 'pcs',
  isCompleted: false,
  addedBy: 'u',
  isShared: true,
  createdAt: '',
  ...o,
});

const data = {
  pantry: [
    pantryItem({ id: 'p1', name: 'Whole Milk' }),
    pantryItem({ id: 'p2', name: 'Cheddar Cheese' }),
    pantryItem({ id: 'p3', name: 'Old Milk', isUsed: true }),
  ],
  recipes: [
    recipe({ id: 'r1', title: 'Milkshake', canCookNow: true }),
    recipe({ id: 'r2', title: 'Omelette', tags: ['breakfast'] }),
  ],
  shoppingList: [
    shopping({ id: 's1', name: 'Almond Milk' }),
    shopping({ id: 's2', name: 'Bread', isCompleted: true }),
  ],
};

describe('searchAll', () => {
  it('returns nothing for an empty query', () => {
    expect(searchAll('', data)).toEqual([]);
  });

  it('finds matches across all three types', () => {
    const results = searchAll('milk', data);
    const ids = results.map(r => r.id);
    expect(ids).toContain('p1'); // Whole Milk
    expect(ids).toContain('r1'); // Milkshake
    expect(ids).toContain('s1'); // Almond Milk
  });

  it('excludes used pantry items and completed shopping items', () => {
    const ids = searchAll('milk', data).map(r => r.id);
    expect(ids).not.toContain('p3'); // used
    const bread = searchAll('bread', data).map(r => r.id);
    expect(bread).not.toContain('s2'); // completed
  });

  it('matches recipes by tag', () => {
    const ids = searchAll('breakfast', data).map(r => r.id);
    expect(ids).toContain('r2');
  });

  it('ranks exact/prefix matches higher', () => {
    const results = searchAll('cheddar', data);
    expect(results[0].id).toBe('p2');
  });

  it('respects the result limit', () => {
    const many = {
      pantry: Array.from({ length: 30 }, (_, i) =>
        pantryItem({ id: `m${i}`, name: `Milk ${i}` })
      ),
      recipes: [],
      shoppingList: [],
    };
    expect(searchAll('milk', many, 5)).toHaveLength(5);
  });
});
