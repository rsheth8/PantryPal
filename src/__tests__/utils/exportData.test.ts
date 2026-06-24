import {
  pantryToCsv,
  buildBackupJson,
  parseBackupItems,
} from '../../utils/exportData';
import { GroceryItem } from '../../types';

const makeItem = (overrides: Partial<GroceryItem> = {}): GroceryItem => ({
  id: '1',
  name: 'Milk',
  quantity: 2,
  unit: 'L',
  category: 'Dairy & Eggs',
  expirationDate: '2026-07-01',
  addedBy: 'user1',
  isShared: true,
  price: 3.99,
  isExpired: false,
  isUsed: false,
  createdAt: '2026-06-01',
  updatedAt: '2026-06-01',
  ...overrides,
});

describe('pantryToCsv', () => {
  it('includes a header row', () => {
    const csv = pantryToCsv([]);
    expect(csv.split('\n')[0]).toBe(
      'Name,Quantity,Unit,Category,Expiration,Price,Visibility'
    );
  });

  it('serializes an item with visibility', () => {
    const csv = pantryToCsv([makeItem()]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Milk');
    expect(lines[1]).toContain('shared');
  });

  it('escapes commas and quotes', () => {
    const csv = pantryToCsv([makeItem({ name: 'Salt, "fine"' })]);
    expect(csv).toContain('"Salt, ""fine"""');
  });

  it('marks private items', () => {
    const csv = pantryToCsv([makeItem({ isShared: false })]);
    expect(csv).toContain('private');
  });
});

describe('buildBackupJson / parseBackupItems', () => {
  it('round-trips pantry items through a backup', () => {
    const json = buildBackupJson({
      pantry: [makeItem()],
      shoppingList: [],
      recipes: [],
    });
    const items = parseBackupItems(json);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Milk');
    expect(items[0].isShared).toBe(true);
  });

  it('accepts a bare array of items', () => {
    const items = parseBackupItems(
      JSON.stringify([{ name: 'Eggs', quantity: 12 }])
    );
    expect(items[0]).toMatchObject({
      name: 'Eggs',
      quantity: 12,
      unit: 'piece',
      category: 'Other',
    });
  });

  it('skips entries without a name', () => {
    const items = parseBackupItems(
      JSON.stringify([{ quantity: 1 }, { name: 'Bread' }])
    );
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Bread');
  });

  it('defaults a private flag only when explicitly false', () => {
    const items = parseBackupItems(
      JSON.stringify([{ name: 'A' }, { name: 'B', isShared: false }])
    );
    expect(items[0].isShared).toBe(true);
    expect(items[1].isShared).toBe(false);
  });

  it('throws on data with no pantry array', () => {
    expect(() => parseBackupItems(JSON.stringify({ foo: 'bar' }))).toThrow();
  });

  it('throws on invalid JSON', () => {
    expect(() => parseBackupItems('not json')).toThrow();
  });
});
