import { GroceryItem, Recipe, ShoppingListItem } from '../types';

// Starter content used to seed an empty account so the app feels alive on the
// very first run. These are plain data descriptions; the store attaches ids,
// ownership, and timestamps when inserting.

type SeedGrocery = Omit<
  GroceryItem,
  'id' | 'isUsed' | 'isExpired' | 'addedBy' | 'createdAt' | 'updatedAt'
>;
type SeedRecipe = Omit<Recipe, 'id' | 'createdBy' | 'createdAt'>;
type SeedShopping = Omit<
  ShoppingListItem,
  'id' | 'isCompleted' | 'addedBy' | 'createdAt'
>;

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function samplePantry(): SeedGrocery[] {
  return [
    {
      name: 'Whole Milk',
      quantity: 1,
      unit: 'L',
      category: 'Dairy & Eggs',
      expirationDate: daysFromNow(5),
      isShared: true,
      price: 3.49,
    },
    {
      name: 'Free-range Eggs',
      quantity: 12,
      unit: 'pcs',
      category: 'Dairy & Eggs',
      expirationDate: daysFromNow(18),
      isShared: true,
      price: 4.99,
    },
    {
      name: 'Cheddar Cheese',
      quantity: 1,
      unit: 'block',
      category: 'Dairy & Eggs',
      expirationDate: daysFromNow(24),
      isShared: true,
      price: 5.5,
    },
    {
      name: 'Bananas',
      quantity: 6,
      unit: 'pcs',
      category: 'Fruits & Vegetables',
      expirationDate: daysFromNow(3),
      isShared: true,
      price: 2.1,
    },
    {
      name: 'Baby Spinach',
      quantity: 1,
      unit: 'bag',
      category: 'Fruits & Vegetables',
      expirationDate: daysFromNow(2),
      isShared: true,
      price: 2.99,
    },
    {
      name: 'Roma Tomatoes',
      quantity: 5,
      unit: 'pcs',
      category: 'Fruits & Vegetables',
      expirationDate: daysFromNow(6),
      isShared: true,
      price: 2.5,
    },
    {
      name: 'Yellow Onions',
      quantity: 3,
      unit: 'pcs',
      category: 'Fruits & Vegetables',
      expirationDate: daysFromNow(30),
      isShared: true,
      price: 1.49,
    },
    {
      name: 'Garlic',
      quantity: 1,
      unit: 'bulb',
      category: 'Fruits & Vegetables',
      expirationDate: daysFromNow(40),
      isShared: true,
      price: 0.79,
    },
    {
      name: 'Chicken Breast',
      quantity: 2,
      unit: 'lbs',
      category: 'Meat & Fish',
      expirationDate: daysFromNow(2),
      isShared: true,
      price: 8.99,
    },
    {
      name: 'Sourdough Bread',
      quantity: 1,
      unit: 'loaf',
      category: 'Grains & Bread',
      expirationDate: daysFromNow(5),
      isShared: true,
      price: 3.99,
    },
    {
      name: 'Spaghetti',
      quantity: 1,
      unit: 'box',
      category: 'Grains & Bread',
      expirationDate: daysFromNow(300),
      isShared: true,
      price: 1.79,
    },
    {
      name: 'Basmati Rice',
      quantity: 1,
      unit: 'bag',
      category: 'Grains & Bread',
      expirationDate: daysFromNow(300),
      isShared: true,
      price: 6.99,
    },
    {
      name: 'Olive Oil',
      quantity: 1,
      unit: 'bottle',
      category: 'Condiments',
      expirationDate: daysFromNow(400),
      isShared: true,
      price: 9.99,
    },
    {
      name: 'Greek Yogurt',
      quantity: 1,
      unit: 'tub',
      category: 'Dairy & Eggs',
      expirationDate: daysFromNow(10),
      isShared: true,
      price: 4.49,
    },
  ];
}

export function sampleRecipes(): SeedRecipe[] {
  return [
    {
      title: 'Garlic Butter Chicken',
      ingredients: [
        '2 chicken breasts',
        '3 cloves garlic',
        '2 tbsp butter',
        '1 tbsp olive oil',
        'salt and pepper to taste',
      ],
      instructions: [
        'Season the chicken breasts with salt and pepper on both sides.',
        'Heat olive oil in a pan over medium-high heat.',
        'Sear the chicken 5–6 minutes per side until golden and cooked through.',
        'Lower the heat, add butter and minced garlic, and spoon over the chicken for 1 minute.',
        'Rest for 5 minutes, then serve.',
      ],
      prepTime: 10,
      cookTime: 20,
      servings: 2,
      canCookNow: false,
      missingIngredients: [],
      tags: ['dinner', 'quick', 'high-protein'],
      isShared: true,
      isFavorite: true,
    },
    {
      title: 'Simple Tomato Spaghetti',
      ingredients: [
        '1 box spaghetti',
        '5 roma tomatoes',
        '2 cloves garlic',
        '2 tbsp olive oil',
        'salt to taste',
      ],
      instructions: [
        'Boil the spaghetti in salted water until al dente.',
        'Meanwhile, sauté chopped garlic in olive oil until fragrant.',
        'Add diced tomatoes and simmer 10 minutes into a light sauce.',
        'Toss the drained pasta with the sauce and serve.',
      ],
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      canCookNow: false,
      missingIngredients: [],
      tags: ['dinner', 'vegetarian', 'budget'],
      isShared: true,
    },
    {
      title: 'Banana Yogurt Breakfast Bowl',
      ingredients: [
        '1 cup greek yogurt',
        '2 bananas',
        '1 tbsp honey',
        'handful of granola',
      ],
      instructions: [
        'Spoon the yogurt into a bowl.',
        'Slice the bananas over the top.',
        'Drizzle with honey and finish with granola.',
      ],
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      canCookNow: false,
      missingIngredients: [],
      tags: ['breakfast', 'no-cook', 'vegetarian'],
      isShared: true,
    },
  ];
}

export function sampleShopping(): SeedShopping[] {
  return [
    {
      name: 'Coffee Beans',
      quantity: 1,
      unit: 'bag',
      category: 'Beverages',
      isShared: true,
    },
    {
      name: 'Butter',
      quantity: 1,
      unit: 'pack',
      category: 'Dairy & Eggs',
      isShared: true,
    },
    {
      name: 'Honey',
      quantity: 1,
      unit: 'jar',
      category: 'Condiments',
      isShared: true,
    },
    {
      name: 'Granola',
      quantity: 1,
      unit: 'box',
      category: 'Grains & Bread',
      isShared: true,
    },
  ];
}
