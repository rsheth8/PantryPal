# 🥫 PantryPal

A modern, collaborative pantry management app built with React Native and Expo. PantryPal helps families and roommates track groceries, plan meals, and reduce food waste together.

## ✨ Features

### 🏠 **Household Management**

- Create and join households with unique codes
- Manage multiple family members or roommates
- Shared and private item visibility
- Real-time collaboration

### 🥫 **Smart Pantry Management**

- Track groceries with expiration dates
- Automatic expiration warnings
- Categorize items (Dairy, Produce, Grains, etc.)
- Search and filter functionality
- Shared vs. private items

### 📖 **Recipe Integration**

- Save and organize recipes
- Check if you can cook recipes with current ingredients
- Missing ingredient detection
- Recipe discovery and favorites

### 🛒 **Shopping List**

- Create and manage shopping lists
- Sync missing ingredients from recipes
- Track completion progress
- Categorize items for efficient shopping

### 📱 **Smart Scanning**

- Barcode scanning for quick item addition
- OCR receipt scanning (coming soon)
- Manual item entry

### 🍳 **Meal Planning**

- AI-powered meal plan generation
- Dietary preference management
- Recipe recommendations based on pantry contents

### 📊 **Analytics & Insights**

- Spending tracking and analysis
- Waste reduction insights
- Household activity monitoring
- Shopping list analytics

## 🎨 Design System

PantryPal features a unique, food-inspired design system:

- **Fresh Mint Green** - Primary color representing freshness and health
- **Warm Terracotta** - Secondary color for cooking and warmth
- **Vibrant Berry** - Accent color for fresh produce
- **Warm Cream** - Neutral colors for natural, organic feel

### Components

- `PantryHeader` - Consistent headers with gradients
- `PantryCard` - Multiple variants for content organization
- `PantryButton` - Unified button system with icons and subtitles

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Zustand with persistence
- **Backend**: Supabase (PostgreSQL)
- **Navigation**: React Navigation
- **Design**: Custom design system with food-inspired theme

## 📱 Screenshots

_Screenshots coming soon_

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd PantryPal
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Then fill in the values in `.env` (see `.env.example` for the full list):
   - `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — your Supabase project
   - `EXPO_PUBLIC_SPOONACULAR_API_KEY` — recipe data ([Spoonacular](https://spoonacular.com/food-api))
   - `EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY` — OCR scanning ([Google Cloud Vision](https://console.cloud.google.com/))

   `.env` is gitignored — never commit real keys. The app reads these at build
   time via Expo's `EXPO_PUBLIC_` convention, so restart the dev server after
   changing them.

4. **Set up Supabase**
   - Create a Supabase project
   - Run the SQL schema from `FINAL_SQL_SCHEMA.sql`
   - Make sure Row Level Security is enabled (the anon key is client-safe with RLS)

5. **Start the development server**

   ```bash
   npx expo start
   ```

6. **Run on device/simulator**
   - Scan QR code with Expo Go app
   - Or press `i` for iOS simulator / `a` for Android emulator

## 🗄️ Database Schema

The app uses PostgreSQL with the following main tables:

- `users` - User profiles and authentication
- `households` - Household information and settings
- `grocery_items` - Pantry items with expiration tracking
- `shopping_list_items` - Shopping list management
- `recipes` - Recipe storage and metadata
- `user_preferences` - Dietary and app preferences
- `meal_plans` - Generated meal plans

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── PantryHeader.tsx
│   ├── PantryCard.tsx
│   ├── PantryButton.tsx
│   └── GradientBackground.tsx
├── features/           # Feature-specific screens
│   ├── auth/          # Authentication
│   ├── dashboard/     # Main dashboard
│   ├── pantry/        # Pantry management
│   ├── recipes/       # Recipe management
│   ├── shoppingList/  # Shopping list
│   ├── scanner/       # Barcode/OCR scanning
│   ├── mealPlanning/  # Meal planning
│   ├── household/     # Household management
│   ├── analytics/     # Analytics and insights
│   └── settings/      # App settings
├── services/          # Business logic and API calls
├── store/            # State management (Zustand)
├── navigation/       # Navigation configuration
├── config/          # Configuration files
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## 🔧 Development

### 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Check code quality
npm run build:check
```

### 📋 Available Scripts

```bash
# Development
npm run dev              # Start Expo development server
npm run start            # Start Expo development server
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run web              # Run on web

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # Run TypeScript type checking
npm run build:check      # Run all quality checks

# Maintenance
npm run clean            # Clean and reinstall dependencies
```

### 🧪 Testing

The project uses Jest and React Native Testing Library for comprehensive testing:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### 📏 Code Quality

The project enforces high code quality standards:

- **ESLint**: Code linting with TypeScript and React Native rules
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Husky**: Git hooks for pre-commit checks
- **Lint-staged**: Run linters on staged files only

### 🔄 Git Workflow

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and commit: `git commit -m "feat: add new feature"`
3. Push and create PR: `git push origin feature/feature-name`
4. Code review and merge

### 📚 Development Guidelines

See [Development Guidelines](docs/DEVELOPMENT_GUIDELINES.md) for detailed coding standards and best practices.

### 🚀 Agile Methodology

See [Agile Methodology](docs/AGILE_METHODOLOGY.md) for project management and development process details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo** for the amazing development platform
- **Supabase** for the backend-as-a-service
- **React Navigation** for navigation
- **Zustand** for state management
- **Spoonacular** for recipe data API

## 📞 Support

For support, email support@pantrypal.app or create an issue in this repository.

---

**Made with ❤️ for better pantry management**
