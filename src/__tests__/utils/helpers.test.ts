import {
  generateId,
  formatCurrency,
  getDaysUntilExpiration,
  isExpiringSoon,
  isExpired,
  categorizeItem,
} from '../../utils/helpers';
import { GroceryItem } from '../../types';

const makeItem = (overrides: Partial<GroceryItem> = {}): GroceryItem => ({
  id: 'id',
  name: 'Milk',
  quantity: 1,
  unit: 'L',
  category: 'Dairy & Eggs',
  expirationDate: '',
  addedBy: 'user',
  isShared: true,
  isExpired: false,
  isUsed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const daysFromNow = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

describe('generateId', () => {
  it('generates a v4-style UUID', () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateId()));
    expect(ids.size).toBe(200);
  });
});

describe('formatCurrency', () => {
  it('formats numbers as USD', () => {
    expect(formatCurrency(3)).toBe('$3.00');
    expect(formatCurrency(3.5)).toBe('$3.50');
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('getDaysUntilExpiration', () => {
  it('returns a positive number for future dates', () => {
    expect(getDaysUntilExpiration(daysFromNow(5))).toBeGreaterThan(3);
  });

  it('returns a negative number for past dates', () => {
    expect(getDaysUntilExpiration(daysFromNow(-5))).toBeLessThan(0);
  });
});

describe('isExpiringSoon', () => {
  it('flags items expiring within the threshold', () => {
    expect(isExpiringSoon(makeItem({ expirationDate: daysFromNow(2) }))).toBe(
      true
    );
  });

  it('does not flag items far from expiring', () => {
    expect(isExpiringSoon(makeItem({ expirationDate: daysFromNow(30) }))).toBe(
      false
    );
  });

  it('does not flag used or already-expired items', () => {
    expect(
      isExpiringSoon(makeItem({ expirationDate: daysFromNow(2), isUsed: true }))
    ).toBe(false);
    expect(
      isExpiringSoon(
        makeItem({ expirationDate: daysFromNow(2), isExpired: true })
      )
    ).toBe(false);
  });

  it('does not flag items with no expiration date', () => {
    expect(isExpiringSoon(makeItem({ expirationDate: '' }))).toBe(false);
  });
});

describe('isExpired', () => {
  it('detects past-dated items', () => {
    expect(isExpired(makeItem({ expirationDate: daysFromNow(-1) }))).toBe(true);
  });

  it('does not treat future items as expired', () => {
    expect(isExpired(makeItem({ expirationDate: daysFromNow(1) }))).toBe(false);
  });
});

describe('categorizeItem', () => {
  it.each([
    ['whole milk', 'Dairy & Eggs'],
    ['cheddar cheese', 'Dairy & Eggs'],
    ['red apple', 'Fruits & Vegetables'],
    ['fresh broccoli', 'Fruits & Vegetables'],
    ['sourdough bread', 'Grains & Bread'],
    ['chicken breast', 'Meat & Fish'],
    ['soy sauce', 'Condiments'],
    ['chocolate chip cookie', 'Snacks'],
    ['random gizmo', 'Other'],
  ])('categorizes "%s" as %s', (name, expected) => {
    expect(categorizeItem(name)).toBe(expected);
  });
});
