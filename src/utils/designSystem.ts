// PantryPal Design System - "Fresh & Modern" Theme
// A unique, food-inspired design system that makes PantryPal stand out

export const colors = {
  // Primary Colors - Fresh Mint Green (represents freshness and health)
  primary: {
    50: '#F0FDF9',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6', // Main brand color
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
  },

  // Secondary Colors - Warm Terracotta (represents cooking and warmth)
  secondary: {
    50: '#FEF7F0',
    100: '#FEE4CC',
    200: '#FECB99',
    300: '#FDA866',
    400: '#FC8533',
    500: '#F97316', // Cooking/kitchen color
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },

  // Accent Colors - Vibrant Berry (represents fresh produce)
  accent: {
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#EC4899', // Fresh berries/fruits
    600: '#DB2777',
    700: '#BE185D',
    800: '#9D174D',
    900: '#831843',
  },

  // Neutral Colors - Warm Cream (represents natural, organic feel)
  neutral: {
    50: '#FEFEFC',
    100: '#FDFCF8',
    200: '#FAF8F0',
    300: '#F5F2E8',
    400: '#E8E4D8',
    500: '#C7C2B5',
    600: '#A8A397',
    700: '#8A857A',
    800: '#6B675E',
    900: '#4D4A42',
  },

  // Status Colors - Food-inspired
  success: '#22C55E', // Fresh green
  warning: '#F59E0B', // Ripe orange
  error: '#EF4444', // Ripe red
  info: '#3B82F6', // Fresh blue

  // Special PantryPal Colors
  pantry: {
    fresh: '#10B981', // Fresh produce green
    dairy: '#FEF3C7', // Cream color
    meat: '#FEE2E2', // Light red
    grains: '#FEF7F0', // Warm wheat
    spices: '#FDF2F8', // Light purple
    herbs: '#F0FDF4', // Light mint
  },

  // Extended Color Palette
  citrus: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Citrus orange
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  lavender: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7', // Lavender purple
    600: '#9333EA',
    700: '#7C3AED',
    800: '#6B21A8',
    900: '#581C87',
  },

  sage: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Sage green
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  honey: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Honey gold
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
};

export const gradients = {
  // Primary Gradients - Fresh & Modern
  primary: ['#14B8A6', '#0D9488'],
  secondary: ['#F97316', '#EA580C'],
  accent: ['#EC4899', '#DB2777'],

  // Food-Inspired Gradients
  fresh: ['#14B8A6', '#22C55E'], // Mint to sage
  warm: ['#F97316', '#F59E0B'], // Terracotta to citrus
  berry: ['#EC4899', '#A855F7'], // Berry to lavender
  earth: ['#8A857A', '#6B675E'], // Warm neutrals

  // Special PantryPal Gradients
  sunrise: ['#F97316', '#EC4899'], // Warm sunrise
  garden: ['#22C55E', '#14B8A6'], // Fresh garden
  sunset: ['#F59E0B', '#F97316'], // Golden hour
  twilight: ['#A855F7', '#EC4899'], // Evening sky
  ocean: ['#3B82F6', '#1D4ED8'], // Deep ocean
  dawn: ['#FEF3C7', '#FDE68A'], // Morning light
  citrus: ['#F59E0B', '#D97706'], // Citrus burst

  // Functional Gradients
  success: ['#22C55E', '#16A34A'],
  warning: ['#F59E0B', '#D97706'],
  error: ['#EF4444', '#DC2626'],
  info: ['#3B82F6', '#2563EB'],
};

export const shadows = {
  // Soft, natural shadows
  sm: {
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },

  // Special PantryPal shadows
  fresh: {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  warm: {
    shadowColor: colors.secondary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,

  // Special PantryPal border radius
  pill: 50,
  card: 16,
  button: 12,
  input: 8,
};

export const typography = {
  // Modern, clean typography
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.1,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.1,
  },

  // Special PantryPal typography
  display: {
    fontSize: 36,
    fontWeight: '800' as const,
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
};

export const commonStyles = {
  // Base container styles
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  // Card styles with PantryPal theme
  card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },

  // Gradient card styles
  gradientCard: {
    borderRadius: borderRadius.card,
    padding: spacing.md,
    ...shadows.lg,
  },

  // Button styles
  button: {
    borderRadius: borderRadius.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },

  // Input styles
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    backgroundColor: '#fff',
    color: colors.neutral[800],
  },

  // Special PantryPal styles
  freshCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    ...shadows.fresh,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },

  warmCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    ...shadows.warm,
    borderWidth: 1,
    borderColor: colors.secondary[100],
  },

  // Header styles
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },

  // Section styles
  section: {
    marginBottom: spacing.lg,
  },

  // List item styles
  listItem: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
};

// PantryPal-specific design tokens
export const pantryTokens = {
  // Food category colors
  categories: {
    produce: colors.pantry.fresh,
    dairy: colors.pantry.dairy,
    meat: colors.pantry.meat,
    grains: colors.pantry.grains,
    spices: colors.pantry.spices,
    herbs: colors.pantry.herbs,
  },

  // Status indicators
  status: {
    fresh: colors.success,
    expiring: colors.warning,
    expired: colors.error,
    low: colors.citrus[500],
  },

  // Icons and emojis
  icons: {
    pantry: '🥫',
    recipes: '📖',
    shopping: '🛒',
    scanner: '📱',
    settings: '⚙️',
    dashboard: '📊',
    household: '🏠',
    mealPlanning: '🍳',
    analytics: '📈',
  },

  // Animation durations
  animations: {
    fast: 200,
    normal: 300,
    slow: 500,
  },

  // Z-index layers
  layers: {
    base: 1,
    card: 10,
    modal: 100,
    overlay: 200,
    tooltip: 300,
  },
};
