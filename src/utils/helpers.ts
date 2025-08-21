import { GroceryItem } from '../types';

export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString();
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const getDaysUntilExpiration = (expirationDate: string): number => {
  const today = new Date();
  const expiration = new Date(expirationDate);
  const diffTime = expiration.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isExpiringSoon = (
  item: GroceryItem,
  daysThreshold: number = 3
): boolean => {
  if (!item.expirationDate || item.isUsed || item.isExpired) return false;
  const daysUntil = getDaysUntilExpiration(item.expirationDate);
  return daysUntil <= daysThreshold && daysUntil >= 0;
};

export const isExpired = (item: GroceryItem): boolean => {
  if (!item.expirationDate || item.isUsed) return false;
  const daysUntil = getDaysUntilExpiration(item.expirationDate);
  return daysUntil < 0;
};

export const categorizeItem = (itemName: string): string => {
  const name = itemName.toLowerCase();

  if (
    name.includes('milk') ||
    name.includes('cheese') ||
    name.includes('yogurt') ||
    name.includes('butter') ||
    name.includes('cream') ||
    name.includes('egg')
  ) {
    return 'Dairy & Eggs';
  }

  if (
    name.includes('apple') ||
    name.includes('banana') ||
    name.includes('orange') ||
    name.includes('fruit') ||
    name.includes('berry') ||
    name.includes('grape') ||
    name.includes('peach') ||
    name.includes('pear') ||
    name.includes('plum') ||
    name.includes('strawberry') ||
    name.includes('blueberry') ||
    name.includes('raspberry')
  ) {
    return 'Fruits & Vegetables';
  }

  if (
    name.includes('carrot') ||
    name.includes('broccoli') ||
    name.includes('lettuce') ||
    name.includes('vegetable') ||
    name.includes('tomato') ||
    name.includes('onion') ||
    name.includes('potato') ||
    name.includes('spinach') ||
    name.includes('kale') ||
    name.includes('cucumber') ||
    name.includes('pepper') ||
    name.includes('garlic')
  ) {
    return 'Fruits & Vegetables';
  }

  if (
    name.includes('bread') ||
    name.includes('pasta') ||
    name.includes('rice') ||
    name.includes('cereal') ||
    name.includes('flour') ||
    name.includes('oat') ||
    name.includes('wheat') ||
    name.includes('corn') ||
    name.includes('tortilla')
  ) {
    return 'Grains & Bread';
  }

  if (
    name.includes('chicken') ||
    name.includes('beef') ||
    name.includes('pork') ||
    name.includes('fish') ||
    name.includes('turkey') ||
    name.includes('lamb') ||
    name.includes('salmon') ||
    name.includes('tuna') ||
    name.includes('shrimp')
  ) {
    return 'Meat & Fish';
  }

  if (
    name.includes('oil') ||
    name.includes('sauce') ||
    name.includes('condiment') ||
    name.includes('ketchup') ||
    name.includes('mustard') ||
    name.includes('mayo') ||
    name.includes('vinegar') ||
    name.includes('soy') ||
    name.includes('hot sauce')
  ) {
    return 'Condiments';
  }

  if (
    name.includes('chocolate') ||
    name.includes('candy') ||
    name.includes('chip') ||
    name.includes('cookie') ||
    name.includes('cake') ||
    name.includes('ice cream') ||
    name.includes('popcorn') ||
    name.includes('nut') ||
    name.includes('crackers')
  ) {
    return 'Snacks';
  }

  return 'Other';
};
