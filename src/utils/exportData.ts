import { GroceryItem, Recipe, ShoppingListItem } from '../types';

// Escape a value for inclusion in a CSV cell.
function csvCell(value: unknown): string {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function pantryToCsv(items: GroceryItem[]): string {
  const header = [
    'Name',
    'Quantity',
    'Unit',
    'Category',
    'Expiration',
    'Price',
    'Visibility',
  ];
  const rows = items.map(item => [
    item.name,
    item.quantity,
    item.unit,
    item.category,
    item.expirationDate,
    item.price ?? '',
    item.isShared ? 'shared' : 'private',
  ]);
  return [header, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
}

export interface BackupData {
  pantry: GroceryItem[];
  shoppingList: ShoppingListItem[];
  recipes: Recipe[];
}

export function buildBackupJson(data: BackupData): string {
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), ...data },
    null,
    2
  );
}

// Parsed grocery items ready to hand to the store's addGroceryItem action.
export type ImportableItem = Omit<
  GroceryItem,
  'id' | 'isUsed' | 'isExpired' | 'addedBy' | 'createdAt' | 'updatedAt'
>;

// Parse a pasted JSON backup (or a bare array of items) into importable items.
export function parseBackupItems(raw: string): ImportableItem[] {
  const parsed = JSON.parse(raw);
  const source = Array.isArray(parsed) ? parsed : parsed.pantry;
  if (!Array.isArray(source)) {
    throw new Error('No pantry items found in the provided data.');
  }
  return source
    .filter(entry => entry && typeof entry.name === 'string')
    .map(entry => ({
      name: String(entry.name),
      quantity: Number(entry.quantity) || 1,
      unit: typeof entry.unit === 'string' ? entry.unit : 'piece',
      category: typeof entry.category === 'string' ? entry.category : 'Other',
      expirationDate:
        typeof entry.expirationDate === 'string' ? entry.expirationDate : '',
      price: Number(entry.price) || 0,
      notes: typeof entry.notes === 'string' ? entry.notes : '',
      isShared: entry.isShared !== false,
    }));
}
