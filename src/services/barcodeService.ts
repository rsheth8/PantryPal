import axios from 'axios';
import { categorizeItem } from '../utils/helpers';
import { logger } from '../utils/logger';

// Product lookup backed by Open Food Facts — a free, community-run database
// of 3M+ products. No API key required, so barcode scanning works out of the
// box even before any paid keys are configured.
// Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/

const OFF_API_URL = 'https://world.openfoodfacts.org/api/v2/product';

export interface ScannedProduct {
  barcode: string;
  name: string;
  brand?: string;
  category: string;
  imageUrl?: string;
  quantity?: string; // e.g. "500 g" as printed on packaging
  found: boolean;
}

// Map Open Food Facts category tags to PantryPal categories.
const CATEGORY_MAP: [RegExp, string][] = [
  [/dairy|milk|cheese|yogurt|butter|cream|egg/i, 'Dairy & Eggs'],
  [/fruit|vegetable|produce|salad|legume/i, 'Fruits & Vegetables'],
  [/meat|poultry|fish|seafood|sausage|ham/i, 'Meat & Fish'],
  [/bread|cereal|pasta|rice|grain|flour|bakery/i, 'Grains & Bread'],
  [/sauce|condiment|oil|vinegar|spread|dressing/i, 'Condiments'],
  [/snack|chip|chocolate|candy|cookie|biscuit|dessert/i, 'Snacks'],
  [/beverage|drink|juice|soda|water|coffee|tea/i, 'Beverages'],
  [/frozen/i, 'Frozen'],
];

function mapCategory(
  categoriesTags: string[] | undefined,
  name: string
): string {
  if (categoriesTags?.length) {
    const joined = categoriesTags.join(' ');
    for (const [pattern, category] of CATEGORY_MAP) {
      if (pattern.test(joined)) return category;
    }
  }
  return categorizeItem(name);
}

class BarcodeService {
  private cache = new Map<string, ScannedProduct>();

  async lookupBarcode(barcode: string): Promise<ScannedProduct> {
    const cached = this.cache.get(barcode);
    if (cached) return cached;

    try {
      const response = await axios.get(`${OFF_API_URL}/${barcode}.json`, {
        params: {
          fields:
            'product_name,brands,categories_tags,image_front_small_url,quantity',
        },
        timeout: 8000,
        headers: {
          'User-Agent': 'PantryPal/1.0 (pantry management app)',
        },
      });

      const product = response.data?.product;
      if (response.data?.status === 1 && product?.product_name) {
        const name: string = product.product_name;
        const result: ScannedProduct = {
          barcode,
          name,
          brand: product.brands?.split(',')[0]?.trim(),
          category: mapCategory(product.categories_tags, name),
          imageUrl: product.image_front_small_url,
          quantity: product.quantity,
          found: true,
        };
        this.cache.set(barcode, result);
        return result;
      }
    } catch (error) {
      logger.warn('Barcode lookup failed:', error);
    }

    return {
      barcode,
      name: '',
      category: 'Other',
      found: false,
    };
  }
}

export const barcodeService = new BarcodeService();
