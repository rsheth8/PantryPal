import {
  parseIngredient,
  formatAmount,
  scaleIngredient,
  scaleIngredients,
} from '../../utils/recipeScaling';

describe('parseIngredient', () => {
  it('parses a whole number', () => {
    const p = parseIngredient('2 cups flour');
    expect(p.amount).toBe(2);
    expect(p.rest).toBe('cups flour');
  });

  it('parses a decimal', () => {
    expect(parseIngredient('0.5 tsp salt').amount).toBe(0.5);
  });

  it('parses an ascii fraction', () => {
    expect(parseIngredient('1/2 cup sugar').amount).toBeCloseTo(0.5);
  });

  it('parses a mixed number', () => {
    expect(parseIngredient('1 1/2 tbsp oil').amount).toBeCloseTo(1.5);
  });

  it('parses a unicode fraction', () => {
    expect(parseIngredient('½ onion').amount).toBeCloseTo(0.5);
  });

  it('returns null amount when there is no leading quantity', () => {
    const p = parseIngredient('salt to taste');
    expect(p.amount).toBeNull();
    expect(p.rest).toBe('salt to taste');
  });
});

describe('formatAmount', () => {
  it('renders whole numbers cleanly', () => {
    expect(formatAmount(3)).toBe('3');
  });

  it('renders common fractions as glyphs', () => {
    expect(formatAmount(0.5)).toBe('½');
    expect(formatAmount(0.25)).toBe('¼');
    expect(formatAmount(1.5)).toBe('1½');
  });

  it('snaps near-whole values', () => {
    expect(formatAmount(1.98)).toBe('2');
  });
});

describe('scaleIngredient', () => {
  it('doubles an amount', () => {
    expect(scaleIngredient('2 cups flour', 2)).toBe('4 cups flour');
  });

  it('halves an amount into a fraction', () => {
    expect(scaleIngredient('1 cup sugar', 0.5)).toBe('½ cup sugar');
  });

  it('leaves unparseable lines untouched', () => {
    expect(scaleIngredient('salt to taste', 2)).toBe('salt to taste');
  });

  it('is a no-op at ratio 1', () => {
    expect(scaleIngredient('2 cups flour', 1)).toBe('2 cups flour');
  });
});

describe('scaleIngredients', () => {
  it('scales a list from 4 to 2 servings', () => {
    const out = scaleIngredients(
      ['2 cups flour', '4 eggs', 'salt to taste'],
      4,
      2
    );
    expect(out).toEqual(['1 cups flour', '2 eggs', 'salt to taste']);
  });

  it('returns the list unchanged when servings match', () => {
    const list = ['2 cups flour'];
    expect(scaleIngredients(list, 4, 4)).toBe(list);
  });

  it('handles a zero/invalid source gracefully', () => {
    const list = ['2 cups flour'];
    expect(scaleIngredients(list, 0, 2)).toBe(list);
  });
});
