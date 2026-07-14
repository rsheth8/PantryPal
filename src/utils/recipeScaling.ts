// Ingredient scaling.
//
// Recipe ingredients are free-text strings like "2 cups flour" or
// "1 1/2 tbsp olive oil". To rescale a recipe for a different number of
// servings we parse the leading quantity (supporting decimals, fractions, and
// mixed numbers plus common unicode fractions), multiply it, and re-render it
// as a clean human-readable amount — leaving the rest of the text untouched.

const UNICODE_FRACTIONS: Record<string, number> = {
  '¼': 0.25,
  '½': 0.5,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

export interface ParsedIngredient {
  amount: number | null; // null when no leading quantity was found
  rest: string; // the remaining text (unit + name)
  original: string;
}

const UNICODE_CLASS = '[¼½¾⅓⅔⅛⅜⅝⅞]';

// Ordered patterns, most specific first, each capturing an amount + consumed
// length. Trying them in order avoids a greedy whole-number eating a fraction.
const MATCHERS: { re: RegExp; amount: (m: RegExpMatchArray) => number }[] = [
  // Mixed number: "1 1/2"
  {
    re: /^(\d+)\s+(\d+)\/(\d+)\s*/,
    amount: m => Number(m[1]) + Number(m[2]) / Number(m[3]),
  },
  // Whole + unicode fraction: "1½"
  {
    re: new RegExp(`^(\\d+)\\s*(${UNICODE_CLASS})\\s*`),
    amount: m => Number(m[1]) + (UNICODE_FRACTIONS[m[2]] ?? 0),
  },
  // Plain ascii fraction: "1/2"
  {
    re: /^(\d+)\/(\d+)\s*/,
    amount: m => Number(m[1]) / Number(m[2]),
  },
  // Lone unicode fraction: "½"
  {
    re: new RegExp(`^(${UNICODE_CLASS})\\s*`),
    amount: m => UNICODE_FRACTIONS[m[1]] ?? 0,
  },
  // Decimal or whole: "0.75", "2"
  {
    re: /^(\d+(?:\.\d+)?)\s*/,
    amount: m => parseFloat(m[1]),
  },
];

export function parseIngredient(text: string): ParsedIngredient {
  const trimmed = text.trim();

  for (const { re, amount } of MATCHERS) {
    const match = trimmed.match(re);
    if (match) {
      return {
        amount: amount(match),
        rest: trimmed.slice(match[0].length).trim(),
        original: text,
      };
    }
  }

  return { amount: null, rest: trimmed, original: text };
}

// Render a number as a friendly cooking amount using common fractions.
export function formatAmount(value: number): string {
  if (value <= 0) return '0';
  const whole = Math.floor(value);
  const frac = value - whole;

  const commonFractions: [number, string][] = [
    [1 / 8, '⅛'],
    [1 / 4, '¼'],
    [1 / 3, '⅓'],
    [3 / 8, '⅜'],
    [1 / 2, '½'],
    [5 / 8, '⅝'],
    [2 / 3, '⅔'],
    [3 / 4, '¾'],
    [7 / 8, '⅞'],
  ];

  // Snap the fractional part to the nearest common fraction (tolerance ~0.06).
  let best: string | null = null;
  let bestDiff = 0.06;
  for (const [f, glyph] of commonFractions) {
    const diff = Math.abs(frac - f);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = glyph;
    }
  }
  // Close to a whole number?
  if (frac < 0.06) return String(whole || 0);
  if (frac > 0.94) return String(whole + 1);

  if (best) return whole > 0 ? `${whole}${best}` : best;

  // Fall back to one decimal place.
  return (Math.round(value * 10) / 10).toString();
}

// Scale a single ingredient line by a ratio. Lines with no parseable leading
// quantity are returned unchanged.
export function scaleIngredient(text: string, ratio: number): string {
  if (ratio === 1) return text;
  const parsed = parseIngredient(text);
  if (parsed.amount === null) return text;
  const scaled = parsed.amount * ratio;
  const amountStr = formatAmount(scaled);
  return parsed.rest ? `${amountStr} ${parsed.rest}` : amountStr;
}

export function scaleIngredients(
  ingredients: string[],
  fromServings: number,
  toServings: number
): string[] {
  if (!fromServings || fromServings <= 0 || fromServings === toServings) {
    return ingredients;
  }
  const ratio = toServings / fromServings;
  return ingredients.map(line => scaleIngredient(line, ratio));
}
