import { GroceryItem, Recipe, ShoppingListItem } from '../types';

// Unified search across the user's pantry, recipes, and shopping list.
// Pure and deterministic so it can be unit-tested and run on every keystroke.

export type SearchResultType = 'pantry' | 'recipe' | 'shopping';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  score: number;
}

function scoreMatch(haystack: string, needle: string): number {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (!n) return 0;
  const idx = h.indexOf(n);
  if (idx === -1) return 0;
  // Prefix matches rank highest, then earlier positions, then shorter strings.
  let score = 100 - idx;
  if (idx === 0) score += 50;
  if (h === n) score += 100;
  return score;
}

export function searchAll(
  query: string,
  data: {
    pantry: GroceryItem[];
    recipes: Recipe[];
    shoppingList: ShoppingListItem[];
  },
  limit = 20
): SearchResult[] {
  const q = query.trim();
  if (q.length < 1) return [];

  const results: SearchResult[] = [];

  for (const item of data.pantry) {
    if (item.isUsed) continue;
    const score = Math.max(
      scoreMatch(item.name, q),
      scoreMatch(item.category, q) * 0.5
    );
    if (score > 0) {
      results.push({
        type: 'pantry',
        id: item.id,
        title: item.name,
        subtitle: `${item.quantity} ${item.unit} · ${item.category}`,
        icon: '🥫',
        score,
      });
    }
  }

  for (const recipe of data.recipes) {
    const tagMatch = (recipe.tags ?? []).some(t =>
      t.toLowerCase().includes(q.toLowerCase())
    );
    const score = Math.max(scoreMatch(recipe.title, q), tagMatch ? 40 : 0);
    if (score > 0) {
      results.push({
        type: 'recipe',
        id: recipe.id,
        title: recipe.title,
        subtitle: recipe.canCookNow
          ? 'Can cook now'
          : `${recipe.missingIngredients?.length ?? 0} missing`,
        icon: '📖',
        score,
      });
    }
  }

  for (const item of data.shoppingList) {
    if (item.isCompleted) continue;
    const score = scoreMatch(item.name, q);
    if (score > 0) {
      results.push({
        type: 'shopping',
        id: item.id,
        title: item.name,
        subtitle: `${item.quantity} ${item.unit} · to buy`,
        icon: '🛒',
        score,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
