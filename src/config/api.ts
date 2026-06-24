// API Configuration
//
// These are private, billable API keys and must NOT be committed to source
// control. Set them in a local `.env` file (see `.env.example`) using Expo's
// `EXPO_PUBLIC_` convention so they are inlined at build time.

export const API_CONFIG = {
  // Spoonacular Recipe API
  // Get your key from: https://spoonacular.com/food-api
  SPOONACULAR_API_KEY: process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY ?? '',

  // Google Cloud Vision API (for OCR)
  // Get your key from: https://console.cloud.google.com/
  GOOGLE_CLOUD_VISION_API_KEY:
    process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY ?? '',
};

// API Limits and Usage
export const API_LIMITS = {
  SPOONACULAR: {
    FREE_TIER_DAILY: 150, // requests per day
    FREE_TIER_MONTHLY: 5000, // requests per month
  },
  GOOGLE_CLOUD_VISION: {
    FREE_TIER_MONTHLY: 1000, // requests per month
  },
};
