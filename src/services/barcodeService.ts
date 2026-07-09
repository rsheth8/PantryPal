export interface BarcodeProduct {
  name: string;
  category?: string;
  brand?: string;
}

export async function lookupBarcode(
  barcode: string
): Promise<BarcodeProduct | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );
    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const product = data.product;
    const name =
      product.product_name ||
      product.generic_name ||
      product.brands ||
      `Product ${barcode}`;

    const categoryTag = product.categories_tags?.[0] as string | undefined;

    return {
      name: name.trim(),
      category: categoryTag?.replace(/^en:/, '').replace(/-/g, ' '),
      brand: product.brands,
    };
  } catch (error) {
    console.error('Barcode lookup failed:', error);
    return null;
  }
}
