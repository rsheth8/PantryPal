import axios from 'axios';
import { API_CONFIG } from '../config/api';

// You'll need to get a Google Cloud Vision API key
// For now, we'll use a mock service that can be easily replaced
const GOOGLE_CLOUD_VISION_API_KEY = API_CONFIG.GOOGLE_CLOUD_VISION_API_KEY;

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  category: string;
}

class OCRService {
  private async callGoogleVisionAPI(imageBase64: string): Promise<string> {
    try {
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
        {
          requests: [
            {
              image: {
                content: imageBase64,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
            },
          ],
        }
      );

      const textAnnotations = response.data.responses[0]?.textAnnotations;
      if (textAnnotations && textAnnotations.length > 0) {
        return textAnnotations[0].description;
      }
      return '';
    } catch (error) {
      console.error('Google Vision API error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  private async mockOCRProcessing(): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return mock receipt text
    return `
      GROCERY STORE RECEIPT
      =====================
      
      Milk 2L $3.99
      Bread 1 loaf $2.49
      Eggs 12 count $4.99
      Bananas 2 lbs $3.49
      Chicken Breast 1 lb $8.99
      Tomatoes 1 lb $2.99
      Yogurt 32 oz $4.49
      Cheese 8 oz $3.99
      Onions 1 lb $1.49
      Potatoes 5 lbs $4.99
      
      SUBTOTAL: $42.90
      TAX: $3.52
      TOTAL: $46.42
    `;
  }

  async extractTextFromImage(imageUri: string): Promise<string> {
    try {
      // For now, use mock processing
      // In production, you would:
      // 1. Convert image to base64
      // 2. Call Google Vision API
      // 3. Return extracted text

      if (GOOGLE_CLOUD_VISION_API_KEY === 'YOUR_GOOGLE_CLOUD_VISION_API_KEY') {
        return await this.mockOCRProcessing();
      } else {
        // Convert image to base64 and call real API
        const base64 = await this.imageToBase64(imageUri);
        return await this.callGoogleVisionAPI(base64);
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      throw error;
    }
  }

  private async imageToBase64(_uri: string): Promise<string> {
    // This would convert the image URI to base64
    // For now, return empty string
    return '';
  }

  parseReceiptText(text: string): ReceiptItem[] {
    const lines = text.split('\n').filter(line => line.trim());
    const items: ReceiptItem[] = [];

    lines.forEach(line => {
      // Enhanced regex to match various receipt formats
      const patterns = [
        // Pattern 1: "Item Name Quantity Unit $Price"
        /^([A-Za-z\s]+)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s*\$?(\d+\.\d+)?/i,
        // Pattern 2: "Item Name $Price"
        /^([A-Za-z\s]+)\s+\$(\d+\.\d+)/i,
        // Pattern 3: "Item Name Quantity $Price"
        /^([A-Za-z\s]+)\s+(\d+(?:\.\d+)?)\s+\$(\d+\.\d+)/i,
      ];

      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const [, name, quantity, unit, price] = match;

          // Clean up the item name
          const cleanName = name.trim().replace(/\s+/g, ' ');

          // Skip if it's clearly not an item (headers, totals, etc.)
          if (this.isItemName(cleanName)) {
            items.push({
              name: cleanName,
              quantity: parseFloat(quantity) || 1,
              unit: unit?.toLowerCase() || 'item',
              price: price ? parseFloat(price) : undefined,
              category: this.categorizeItem(cleanName),
            });
          }
          break;
        }
      }
    });

    return items;
  }

  private isItemName(name: string): boolean {
    const skipWords = [
      'total',
      'subtotal',
      'tax',
      'receipt',
      'store',
      'grocery',
      'cash',
      'change',
      'card',
      'debit',
      'credit',
      'thank',
      'you',
    ];

    const lowerName = name.toLowerCase();
    return !skipWords.some(word => lowerName.includes(word));
  }

  private categorizeItem(name: string): string {
    const lowerName = name.toLowerCase();

    if (
      lowerName.includes('milk') ||
      lowerName.includes('cheese') ||
      lowerName.includes('yogurt') ||
      lowerName.includes('butter') ||
      lowerName.includes('cream')
    ) {
      return 'Dairy';
    }
    if (
      lowerName.includes('apple') ||
      lowerName.includes('banana') ||
      lowerName.includes('orange') ||
      lowerName.includes('fruit') ||
      lowerName.includes('berry')
    ) {
      return 'Fruits';
    }
    if (
      lowerName.includes('carrot') ||
      lowerName.includes('broccoli') ||
      lowerName.includes('lettuce') ||
      lowerName.includes('vegetable') ||
      lowerName.includes('tomato') ||
      lowerName.includes('onion')
    ) {
      return 'Vegetables';
    }
    if (
      lowerName.includes('bread') ||
      lowerName.includes('pasta') ||
      lowerName.includes('rice') ||
      lowerName.includes('cereal') ||
      lowerName.includes('flour')
    ) {
      return 'Grains';
    }
    if (
      lowerName.includes('chicken') ||
      lowerName.includes('beef') ||
      lowerName.includes('pork') ||
      lowerName.includes('fish') ||
      lowerName.includes('meat')
    ) {
      return 'Meat';
    }
    if (lowerName.includes('egg')) {
      return 'Dairy';
    }
    if (
      lowerName.includes('oil') ||
      lowerName.includes('sauce') ||
      lowerName.includes('condiment') ||
      lowerName.includes('spice')
    ) {
      return 'Condiments';
    }

    return 'Other';
  }
}

export const ocrService = new OCRService();
