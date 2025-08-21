// API Configuration
// Replace these with your actual API keys

export const API_CONFIG = {
  // Spoonacular Recipe API
  // Get your key from: https://spoonacular.com/food-api
  SPOONACULAR_API_KEY: '333035f316414e69a90ee5872e94d208',

  // Google Cloud Vision API (for OCR)
  // Get your key from: https://console.cloud.google.com/
  GOOGLE_CLOUD_VISION_API_KEY: 'AIzaSyDY8Uu-PDAQiGQ3uqNUKW4FMcs4xTc1BZs',

  // Example API keys (replace with your actual keys):
  // SPOONACULAR_API_KEY: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
  // GOOGLE_CLOUD_VISION_API_KEY: 'AIzaSyB...',
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
