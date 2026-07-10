import axios from 'axios';
import { barcodeService } from '../../services/barcodeService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('barcodeService.lookupBarcode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps a found product to a PantryPal category', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        status: 1,
        product: {
          product_name: 'Organic Whole Milk',
          brands: 'HappyCow',
          categories_tags: ['en:dairies', 'en:milks'],
          image_front_small_url: 'http://example.com/milk.jpg',
          quantity: '1 L',
        },
      },
    });

    const result = await barcodeService.lookupBarcode('1111111111111');
    expect(result.found).toBe(true);
    expect(result.name).toBe('Organic Whole Milk');
    expect(result.brand).toBe('HappyCow');
    expect(result.category).toBe('Dairy & Eggs');
  });

  it('returns a not-found result when the product is unknown', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { status: 0 } });

    const result = await barcodeService.lookupBarcode('0000000000000');
    expect(result.found).toBe(false);
    expect(result.category).toBe('Other');
  });

  it('degrades gracefully on network error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('network down'));

    const result = await barcodeService.lookupBarcode('2222222222222');
    expect(result.found).toBe(false);
    expect(result.barcode).toBe('2222222222222');
  });

  it('caches repeated lookups (only one network call)', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        status: 1,
        product: {
          product_name: 'Cached Bread',
          categories_tags: ['en:breads'],
        },
      },
    });

    const first = await barcodeService.lookupBarcode('3333333333333');
    const second = await barcodeService.lookupBarcode('3333333333333');
    expect(first).toEqual(second);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });
});
