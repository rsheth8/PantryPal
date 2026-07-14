import {
  ACHIEVEMENTS,
  computeProgress,
  computeAllProgress,
  deriveStats,
  totalBadgesUnlocked,
  totalBadgesAvailable,
  newlyUnlocked,
  AchievementStats,
} from '../../services/achievementsService';
import { GroceryItem, Recipe, ShoppingListItem } from '../../types';

const baseStats: AchievementStats = {
  totalItemsAdded: 0,
  itemsUsed: 0,
  itemsExpired: 0,
  activeItems: 0,
  distinctCategories: 0,
  recipesSaved: 0,
  recipesCookable: 0,
  favoriteRecipes: 0,
  shoppingCompleted: 0,
  householdMembers: 1,
  activeDayStreak: 0,
};

const stocker = ACHIEVEMENTS.find(a => a.id === 'stocker')!;

describe('computeProgress', () => {
  it('reports zero unlocked tiers below the first threshold', () => {
    const p = computeProgress(stocker, { ...baseStats, totalItemsAdded: 0 });
    expect(p.unlockedTiers).toBe(0);
    expect(p.currentTierLabel).toBeNull();
    expect(p.nextThreshold).toBe(1);
    expect(p.isMaxed).toBe(false);
  });

  it('unlocks the first tier at the threshold', () => {
    const p = computeProgress(stocker, { ...baseStats, totalItemsAdded: 1 });
    expect(p.unlockedTiers).toBe(1);
    expect(p.currentTierLabel).toBe('First Item');
    expect(p.nextThreshold).toBe(10);
  });

  it('computes fractional progress toward the next tier', () => {
    // stocker tiers: 1, 10, 50, 150. Value 5 is between tier1(1) and tier2(10).
    const p = computeProgress(stocker, { ...baseStats, totalItemsAdded: 5 });
    expect(p.unlockedTiers).toBe(1);
    // (5 - 1) / (10 - 1) = 4/9
    expect(p.progressToNext).toBeCloseTo(4 / 9, 5);
  });

  it('maxes out at the final tier', () => {
    const p = computeProgress(stocker, { ...baseStats, totalItemsAdded: 999 });
    expect(p.unlockedTiers).toBe(stocker.tiers.length);
    expect(p.isMaxed).toBe(true);
    expect(p.nextThreshold).toBeNull();
    expect(p.progressToNext).toBe(1);
  });
});

describe('computeAllProgress', () => {
  it('returns one entry per achievement', () => {
    expect(computeAllProgress(baseStats)).toHaveLength(ACHIEVEMENTS.length);
  });
});

describe('badge totals', () => {
  it('counts unlocked badges across tiers', () => {
    const stats: AchievementStats = {
      ...baseStats,
      totalItemsAdded: 10, // 2 tiers of stocker
      householdMembers: 2, // 1 tier of "together"
    };
    expect(totalBadgesUnlocked(stats)).toBe(3);
  });

  it('reports the total available badges', () => {
    const expected = ACHIEVEMENTS.reduce((s, a) => s + a.tiers.length, 0);
    expect(totalBadgesAvailable()).toBe(expected);
  });
});

describe('newlyUnlocked', () => {
  it('detects achievements that gained a tier', () => {
    const before: AchievementStats = { ...baseStats, totalItemsAdded: 0 };
    const after: AchievementStats = { ...baseStats, totalItemsAdded: 1 };
    const unlocked = newlyUnlocked(before, after);
    expect(unlocked.map(u => u.def.id)).toContain('stocker');
  });

  it('returns nothing when no new tier is reached', () => {
    const before: AchievementStats = { ...baseStats, totalItemsAdded: 2 };
    const after: AchievementStats = { ...baseStats, totalItemsAdded: 3 };
    expect(newlyUnlocked(before, after)).toHaveLength(0);
  });
});

describe('deriveStats', () => {
  const item = (o: Partial<GroceryItem>): GroceryItem => ({
    id: Math.random().toString(),
    name: 'x',
    quantity: 1,
    unit: 'pcs',
    category: 'Other',
    expirationDate: '',
    addedBy: 'u',
    isShared: true,
    isExpired: false,
    isUsed: false,
    createdAt: '',
    updatedAt: '',
    ...o,
  });

  it('derives pantry-based counts', () => {
    const pantry = [
      item({ category: 'Dairy & Eggs', isUsed: true }),
      item({ category: 'Fruits & Vegetables' }),
      item({ category: 'Fruits & Vegetables' }),
      item({ category: 'Snacks', isExpired: true }),
    ];
    const recipes: Recipe[] = [
      {
        id: 'r',
        title: 'R',
        ingredients: [],
        instructions: [],
        canCookNow: true,
        missingIngredients: [],
        tags: [],
        createdBy: 'u',
        isShared: true,
        createdAt: '',
        isFavorite: true,
      },
    ];
    const shoppingList: ShoppingListItem[] = [
      {
        id: 's',
        name: 'x',
        quantity: 1,
        unit: 'pcs',
        isCompleted: true,
        addedBy: 'u',
        isShared: true,
        createdAt: '',
      },
    ];

    const stats = deriveStats({
      pantry,
      recipes,
      shoppingList,
      householdMembers: 3,
      activeDayStreak: 4,
    });

    expect(stats.itemsUsed).toBe(1);
    expect(stats.itemsExpired).toBe(1);
    expect(stats.activeItems).toBe(3);
    // active distinct categories: Fruits & Vegetables, Snacks = 2
    expect(stats.distinctCategories).toBe(2);
    expect(stats.recipesSaved).toBe(1);
    expect(stats.recipesCookable).toBe(1);
    expect(stats.favoriteRecipes).toBe(1);
    expect(stats.shoppingCompleted).toBe(1);
    expect(stats.householdMembers).toBe(3);
    expect(stats.activeDayStreak).toBe(4);
  });

  it('prefers cumulative counters when provided', () => {
    const stats = deriveStats({
      pantry: [],
      recipes: [],
      shoppingList: [],
      householdMembers: 1,
      activeDayStreak: 0,
      cumulative: { totalItemsAdded: 42, shoppingCompleted: 17 },
    });
    expect(stats.totalItemsAdded).toBe(42);
    expect(stats.shoppingCompleted).toBe(17);
  });
});
