import { GroceryItem, Recipe, ShoppingListItem } from '../types';

// Achievements / streaks engine.
//
// This is pure, deterministic logic derived from the user's data so it can be
// computed on the client with no extra storage and fully unit-tested. Each
// achievement has tiers; progress is a 0..1 ratio toward the next tier.

export type AchievementCategory =
  | 'pantry'
  | 'waste'
  | 'recipes'
  | 'shopping'
  | 'social'
  | 'streak';

export interface AchievementTier {
  threshold: number;
  label: string;
}

export interface AchievementDef {
  id: string;
  icon: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tiers: AchievementTier[];
  // Given the stats, return the current numeric value for this achievement.
  measure: (stats: AchievementStats) => number;
}

export interface AchievementStats {
  totalItemsAdded: number;
  itemsUsed: number;
  itemsExpired: number;
  activeItems: number;
  distinctCategories: number;
  recipesSaved: number;
  recipesCookable: number;
  favoriteRecipes: number;
  shoppingCompleted: number;
  householdMembers: number;
  activeDayStreak: number;
}

export interface AchievementProgress {
  def: AchievementDef;
  value: number;
  unlockedTiers: number; // how many tiers reached
  currentTierLabel: string | null; // highest reached tier label
  nextThreshold: number | null; // null when fully maxed
  progressToNext: number; // 0..1 toward next tier (1 when maxed)
  isMaxed: boolean;
}

// ---------------------------------------------------------------------------
// Definitions
// ---------------------------------------------------------------------------

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'stocker',
    icon: '🥫',
    title: 'Pantry Stocker',
    description: 'Add items to your pantry',
    category: 'pantry',
    tiers: [
      { threshold: 1, label: 'First Item' },
      { threshold: 10, label: 'Getting Started' },
      { threshold: 50, label: 'Well Stocked' },
      { threshold: 150, label: 'Pantry Master' },
    ],
    measure: s => s.totalItemsAdded,
  },
  {
    id: 'waste_saver',
    icon: '♻️',
    title: 'Waste Warrior',
    description: 'Use items before they expire',
    category: 'waste',
    tiers: [
      { threshold: 5, label: 'Mindful' },
      { threshold: 25, label: 'Resourceful' },
      { threshold: 100, label: 'Zero Waste Hero' },
    ],
    measure: s => s.itemsUsed,
  },
  {
    id: 'variety',
    icon: '🌈',
    title: 'Variety Seeker',
    description: 'Stock different food categories',
    category: 'pantry',
    tiers: [
      { threshold: 3, label: 'Balanced' },
      { threshold: 6, label: 'Diverse' },
      { threshold: 9, label: 'Gourmet Pantry' },
    ],
    measure: s => s.distinctCategories,
  },
  {
    id: 'chef',
    icon: '📖',
    title: 'Recipe Collector',
    description: 'Save recipes to your book',
    category: 'recipes',
    tiers: [
      { threshold: 1, label: 'First Recipe' },
      { threshold: 10, label: 'Home Cook' },
      { threshold: 30, label: 'Head Chef' },
    ],
    measure: s => s.recipesSaved,
  },
  {
    id: 'ready_to_cook',
    icon: '🍳',
    title: 'Ready to Cook',
    description: 'Have recipes you can make right now',
    category: 'recipes',
    tiers: [
      { threshold: 1, label: 'Dinner Sorted' },
      { threshold: 5, label: 'Meal Ready' },
    ],
    measure: s => s.recipesCookable,
  },
  {
    id: 'shopper',
    icon: '🛒',
    title: 'Smart Shopper',
    description: 'Complete shopping list items',
    category: 'shopping',
    tiers: [
      { threshold: 10, label: 'Errand Runner' },
      { threshold: 50, label: 'Grocery Guru' },
      { threshold: 200, label: 'Shopping Legend' },
    ],
    measure: s => s.shoppingCompleted,
  },
  {
    id: 'together',
    icon: '🏠',
    title: 'Better Together',
    description: 'Share your pantry with a household',
    category: 'social',
    tiers: [
      { threshold: 2, label: 'Roommates' },
      { threshold: 4, label: 'Full House' },
    ],
    measure: s => s.householdMembers,
  },
  {
    id: 'streak',
    icon: '🔥',
    title: 'On a Roll',
    description: 'Use the app on consecutive days',
    category: 'streak',
    tiers: [
      { threshold: 3, label: '3-Day Streak' },
      { threshold: 7, label: 'Weekly Habit' },
      { threshold: 30, label: 'Monthly Devotee' },
    ],
    measure: s => s.activeDayStreak,
  },
];

// ---------------------------------------------------------------------------
// Stats derivation
// ---------------------------------------------------------------------------

export function deriveStats(input: {
  pantry: GroceryItem[];
  recipes: Recipe[];
  shoppingList: ShoppingListItem[];
  householdMembers: number;
  activeDayStreak: number;
  // totalItemsAdded/shoppingCompleted can exceed current list sizes over time;
  // callers may pass cumulative counters. Falls back to current state.
  cumulative?: { totalItemsAdded?: number; shoppingCompleted?: number };
}): AchievementStats {
  const { pantry, recipes, shoppingList, householdMembers, activeDayStreak } =
    input;

  const itemsUsed = pantry.filter(i => i.isUsed).length;
  const itemsExpired = pantry.filter(i => i.isExpired).length;
  const activeItems = pantry.filter(i => !i.isUsed).length;
  const distinctCategories = new Set(
    pantry.filter(i => !i.isUsed).map(i => i.category)
  ).size;

  return {
    totalItemsAdded: input.cumulative?.totalItemsAdded ?? pantry.length,
    itemsUsed,
    itemsExpired,
    activeItems,
    distinctCategories,
    recipesSaved: recipes.length,
    recipesCookable: recipes.filter(r => r.canCookNow).length,
    favoriteRecipes: recipes.filter(r => r.isFavorite).length,
    shoppingCompleted:
      input.cumulative?.shoppingCompleted ??
      shoppingList.filter(i => i.isCompleted).length,
    householdMembers,
    activeDayStreak,
  };
}

// ---------------------------------------------------------------------------
// Progress computation
// ---------------------------------------------------------------------------

export function computeProgress(
  def: AchievementDef,
  stats: AchievementStats
): AchievementProgress {
  const value = Math.max(0, def.measure(stats));
  const tiers = def.tiers;

  let unlockedTiers = 0;
  for (const tier of tiers) {
    if (value >= tier.threshold) unlockedTiers += 1;
    else break;
  }

  const isMaxed = unlockedTiers >= tiers.length;
  const currentTierLabel =
    unlockedTiers > 0 ? tiers[unlockedTiers - 1].label : null;
  const nextThreshold = isMaxed ? null : tiers[unlockedTiers].threshold;

  let progressToNext: number;
  if (isMaxed) {
    progressToNext = 1;
  } else {
    const prevThreshold =
      unlockedTiers > 0 ? tiers[unlockedTiers - 1].threshold : 0;
    const span = tiers[unlockedTiers].threshold - prevThreshold;
    progressToNext = span > 0 ? Math.min(1, (value - prevThreshold) / span) : 0;
  }

  return {
    def,
    value,
    unlockedTiers,
    currentTierLabel,
    nextThreshold,
    progressToNext,
    isMaxed,
  };
}

export function computeAllProgress(
  stats: AchievementStats
): AchievementProgress[] {
  return ACHIEVEMENTS.map(def => computeProgress(def, stats));
}

// Total badges unlocked across every tier of every achievement.
export function totalBadgesUnlocked(stats: AchievementStats): number {
  return computeAllProgress(stats).reduce((sum, p) => sum + p.unlockedTiers, 0);
}

export function totalBadgesAvailable(): number {
  return ACHIEVEMENTS.reduce((sum, a) => sum + a.tiers.length, 0);
}

// Returns ids of achievements that gained a tier between two stat snapshots —
// used to fire unlock celebrations.
export function newlyUnlocked(
  before: AchievementStats,
  after: AchievementStats
): AchievementProgress[] {
  return ACHIEVEMENTS.map(def => {
    const b = computeProgress(def, before);
    const a = computeProgress(def, after);
    return a.unlockedTiers > b.unlockedTiers ? a : null;
  }).filter((p): p is AchievementProgress => p !== null);
}
