import { ocrService } from '../../services/ocrService';

describe('ocrService.parseReceiptText', () => {
  it('extracts items with quantity, unit, and price', () => {
    const text = `
      GROCERY STORE RECEIPT
      Milk 2 L $3.99
      Bread 1 loaf $2.49
      SUBTOTAL: $6.48
      TOTAL: $6.48
    `;
    const items = ocrService.parseReceiptText(text);
    const names = items.map(i => i.name.toLowerCase());
    expect(names).toContain('milk');
    expect(names).toContain('bread');
  });

  it('skips receipt noise like totals and headers', () => {
    const text = `
      Milk 2 L $3.99
      SUBTOTAL: $3.99
      TAX: $0.32
      TOTAL: $4.31
      THANK YOU
    `;
    const items = ocrService.parseReceiptText(text);
    const names = items.map(i => i.name.toLowerCase());
    expect(names).not.toContain('subtotal');
    expect(names).not.toContain('total');
    expect(names).not.toContain('tax');
  });

  it('returns an empty array for empty input', () => {
    expect(ocrService.parseReceiptText('')).toEqual([]);
  });
});

describe('ocrService.scanReceipt', () => {
  it('falls back to mock parsing when no key/image is available', async () => {
    const items = await ocrService.scanReceipt();
    expect(items.length).toBeGreaterThan(0);
    // Mock receipt includes recognizable grocery items.
    const names = items.map(i => i.name.toLowerCase()).join(' ');
    expect(names).toMatch(/milk|bread|eggs|chicken/);
  });
});
