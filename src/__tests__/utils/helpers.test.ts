import {
  categorizeItem,
  formatCurrency,
  getDaysUntilExpiration,
  isExpired,
  isExpiringSoon,
  generateId,
} from '../../utils/helpers';
import { GroceryItem } from '../../types';

const baseItem = (overrides: Partial<GroceryItem> = {}): GroceryItem => ({
  id: '1',
  name: 'Test',
  quantity: 1,
  unit: 'piece',
  category: 'Other',
  expirationDate: '',
  addedBy: 'u1',
  isShared: true,
  isExpired: false,
  isUsed: false,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const inDays = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

describe('categorizeItem', () => {
  it('categorizes dairy', () => {
    expect(categorizeItem('Whole Milk')).toBe('Dairy & Eggs');
    expect(categorizeItem('cheddar cheese')).toBe('Dairy & Eggs');
  });

  it('categorizes produce', () => {
    expect(categorizeItem('Banana')).toBe('Fruits & Vegetables');
    expect(categorizeItem('carrot')).toBe('Fruits & Vegetables');
  });

  it('categorizes meat and grains', () => {
    expect(categorizeItem('Chicken breast')).toBe('Meat & Fish');
    expect(categorizeItem('white rice')).toBe('Grains & Bread');
  });

  it('falls back to Other', () => {
    expect(categorizeItem('Mystery thing')).toBe('Other');
  });
});

describe('expiration helpers', () => {
  it('computes days until expiration', () => {
    expect(getDaysUntilExpiration(inDays(5))).toBeGreaterThanOrEqual(4);
    expect(getDaysUntilExpiration(inDays(5))).toBeLessThanOrEqual(5);
  });

  it('detects expired items', () => {
    expect(isExpired(baseItem({ expirationDate: inDays(-2) }))).toBe(true);
    expect(isExpired(baseItem({ expirationDate: inDays(5) }))).toBe(false);
  });

  it('ignores used items for expiry checks', () => {
    expect(
      isExpired(baseItem({ expirationDate: inDays(-2), isUsed: true }))
    ).toBe(false);
  });

  it('detects items expiring soon', () => {
    expect(isExpiringSoon(baseItem({ expirationDate: inDays(2) }))).toBe(true);
    expect(isExpiringSoon(baseItem({ expirationDate: inDays(10) }))).toBe(
      false
    );
  });
});

describe('formatCurrency', () => {
  it('formats USD', () => {
    expect(formatCurrency(3.5)).toBe('$3.50');
  });
});

describe('generateId', () => {
  it('produces unique UUID-shaped ids', () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe(b);
    expect(a).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });
});
