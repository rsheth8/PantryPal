# 🥫 PantryPal

A modern, collaborative pantry management app built with React Native and Expo. PantryPal helps families and roommates track groceries, plan meals, and reduce food waste together.

> 📋 **Picking up development or getting ready to launch?** Start with
> [`docs/HANDOFF.md`](docs/HANDOFF.md) — current status, architecture map, and the
> go-live checklist for adding API keys.

## ✨ Features

### 🏠 **Household Management**

- Create and join households with unique invite codes
- Manage multiple family members or roommates
- Shared and private item visibility
- **Real-time sync** — members see live pantry & shopping updates instantly
  (Supabase realtime channels, no refresh needed)
- **Activity feed** — a shared timeline of who added, used, or removed what

### 🏆 **Achievements & Streaks**

- Tiered badges across pantry, waste-reduction, recipes, shopping & social
- Daily-use streaks to build a habit
- Animated progress rings and unlock celebrations

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
- **Serving scaling** — rescale ingredient amounts to any number of servings
- **Cooking mode** — full-screen, step-by-step guidance that keeps the screen
  awake while you cook

### 🔎 **Global Search**

- One search box over your pantry, recipes, and shopping list
- Ranked results with tap-to-jump navigation

### ✨ **Instant Start**

- One-tap sample pantry, recipes, and shopping list so the app is useful the
  moment you open it — no empty screens

### 🛒 **Shopping List**

- Create and manage shopping lists
- Sync missing ingredients from recipes
- Track completion progress
- Categorize items for efficient shopping

### 📱 **Smart Scanning**

- Live barcode scanning with the device camera (`expo-camera`)
- Automatic product lookup via the free [Open Food Facts](https://world.openfoodfacts.org/)
  database — **no API key required**, works out of the box
- Prefills product name, brand, and category; pick quantity + expiry and add
- **Receipt scanning** — snap a grocery receipt to bulk-add your whole shop
  (editable review list before saving)
- Manual item entry with smart auto-categorization

### 🍳 **Meal Planning**

- Weekly meal plan generation with a tiered preference-relaxation engine
- Dietary preferences (diets, cuisines) and per-meal serving controls
- Plans persist to Supabase and reload across sessions

### 📊 **Analytics & Insights**

- Pantry health score and freshness breakdown
- Waste-reduction score (used vs. expired)
- Category breakdown and inventory value
- Biggest-investment spend tracking

### 🎨 **Polished, Modern UX**

- Full light / dark / system theme with a persisted preference
- Fluid animations throughout: springy pressables, staggered list entrances,
  skeleton loaders, toasts with undo, confetti celebrations
- Living ambient parallax backgrounds for depth on key screens
- Haptic feedback and an animated launch splash + onboarding carousel

## 🎨 Design System

PantryPal features a unique, food-inspired design system:

- **Fresh Mint Green** - Primary color representing freshness and health
- **Warm Terracotta** - Secondary color for cooking and warmth
- **Vibrant Berry** - Accent color for fresh produce
- **Warm Cream** - Neutral colors for natural, organic feel

The design system is theme-aware: every color is a semantic token
(`theme.colors.*`) that resolves to the right value in light or dark mode.
Screens consume it via the `useThemedStyles(createStyles)` hook.

### Core Components

- `PantryHeader` — safe-area-aware headers with theme-tuned gradients
- `PantryCard` — five surface variants that adapt to the active theme
- `PantryButton` — gradient/solid/outline/ghost buttons with spring press + haptics

### Animated UI Kit (`src/components/ui`)

- `AnimatedPressable`, `FadeSlideIn` — tactile press + staggered entrances
- `Skeleton`, `EmptyState`, `ProgressBar` — loading & empty states
- `Toast` (with undo actions), `Confetti` — feedback & celebration
- `AmbientBackground` — drifting parallax gradient orbs for depth

## 🛠️ Tech Stack

- **Frontend**: React Native 0.79 with Expo SDK 53 (New Architecture enabled)
- **Language**: TypeScript (strict)
- **State Management**: Zustand with AsyncStorage persistence
- **Backend**: Supabase (PostgreSQL) with Row Level Security
- **Auth**: Supabase Auth with a single AsyncStorage-backed client (sessions
  persist across app restarts)
- **Navigation**: React Navigation (bottom tabs + nested stacks)
- **Animations**: React Native `Animated` (native driver) — no heavy deps
- **Design**: Custom theme system (light/dark/system) with food-inspired tokens

### Works before you add API keys

The app is fully usable with **zero paid keys**:

| Feature | Without keys | With keys |
| --- | --- | --- |
| Barcode scanning | ✅ Open Food Facts (free) | ✅ same |
| Recipe discovery | ✅ curated mock recipes | ✅ live Spoonacular |
| Receipt OCR | ✅ mock parsing | ✅ Google Cloud Vision |
| Everything else | ✅ full functionality | ✅ full functionality |

Add keys to `.env` whenever you're ready — no code changes needed.

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
