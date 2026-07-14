// PantryPal Theme Definitions
// Semantic color tokens for light and dark themes. Screens should consume
// these via useTheme()/useThemedStyles() so every surface adapts to the
// active theme automatically.

import {
  colors as basePalette,
  gradients as baseGradients,
} from '../utils/designSystem';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface SemanticColors {
  // Surfaces
  background: string;
  backgroundSubtle: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  surfaceInverse: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textOnGradient: string;

  // Borders & lines
  border: string;
  borderStrong: string;
  divider: string;

  // Interactive
  primary: string;
  primarySoft: string;
  primaryStrong: string;
  secondary: string;
  secondarySoft: string;
  accent: string;
  accentSoft: string;

  // Status
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;
  info: string;
  infoSoft: string;

  // Misc
  overlay: string;
  skeleton: string;
  skeletonHighlight: string;
  tabBar: string;
  inputBackground: string;
  shadow: string;
}

export interface Theme {
  name: 'light' | 'dark';
  isDark: boolean;
  colors: SemanticColors;
  palette: typeof basePalette;
  gradients: typeof baseGradients;
}

const lightColors: SemanticColors = {
  background: basePalette.neutral[50],
  backgroundSubtle: basePalette.neutral[100],
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: basePalette.neutral[200],
  surfaceInverse: '#17211D',

  text: basePalette.neutral[900],
  textSecondary: basePalette.neutral[700],
  textMuted: basePalette.neutral[600],
  textInverse: '#FFFFFF',
  textOnGradient: '#FFFFFF',

  border: basePalette.neutral[200],
  borderStrong: basePalette.neutral[400],
  divider: basePalette.neutral[200],

  primary: basePalette.primary[600],
  primarySoft: basePalette.primary[50],
  primaryStrong: basePalette.primary[700],
  secondary: basePalette.secondary[500],
  secondarySoft: basePalette.secondary[50],
  accent: basePalette.accent[500],
  accentSoft: basePalette.accent[50],

  success: basePalette.sage[600],
  successSoft: basePalette.sage[50],
  warning: basePalette.citrus[600],
  warningSoft: basePalette.citrus[50],
  error: '#DC2626',
  errorSoft: '#FEF2F2',
  info: '#2563EB',
  infoSoft: '#EFF6FF',

  overlay: 'rgba(19, 30, 26, 0.55)',
  skeleton: basePalette.neutral[200],
  skeletonHighlight: basePalette.neutral[100],
  tabBar: '#FFFFFF',
  inputBackground: '#FFFFFF',
  shadow: basePalette.neutral[800],
};

// Dark theme — deep, slightly teal-tinted charcoal with luminous accents.
const darkColors: SemanticColors = {
  background: '#0C1210',
  backgroundSubtle: '#101815',
  surface: '#16201C',
  surfaceElevated: '#1C2823',
  surfaceMuted: '#233029',
  surfaceInverse: '#FDFCF8',

  text: '#F2F5F3',
  textSecondary: '#C4CFC9',
  textMuted: '#8FA098',
  textInverse: '#101815',
  textOnGradient: '#FFFFFF',

  border: '#26332D',
  borderStrong: '#3A4A42',
  divider: '#1F2A25',

  primary: basePalette.primary[400],
  primarySoft: 'rgba(45, 212, 191, 0.12)',
  primaryStrong: basePalette.primary[300],
  secondary: basePalette.secondary[400],
  secondarySoft: 'rgba(252, 133, 51, 0.12)',
  accent: basePalette.accent[400],
  accentSoft: 'rgba(244, 114, 182, 0.12)',

  success: basePalette.sage[400],
  successSoft: 'rgba(74, 222, 128, 0.12)',
  warning: basePalette.citrus[400],
  warningSoft: 'rgba(251, 191, 36, 0.12)',
  error: '#F87171',
  errorSoft: 'rgba(248, 113, 113, 0.14)',
  info: '#60A5FA',
  infoSoft: 'rgba(96, 165, 250, 0.12)',

  overlay: 'rgba(0, 0, 0, 0.7)',
  skeleton: '#1F2A25',
  skeletonHighlight: '#2A382F',
  tabBar: '#121B17',
  inputBackground: '#1C2823',
  shadow: '#000000',
};

// Gradients tuned per theme — dark mode uses deeper stops so headers glow
// against the dark background instead of blinding it.
const darkGradients: typeof baseGradients = {
  ...baseGradients,
  primary: ['#0F766E', '#134E4A'],
  secondary: ['#C2410C', '#7C2D12'],
  accent: ['#BE185D', '#831843'],
  fresh: ['#0D9488', '#15803D'],
  warm: ['#C2410C', '#B45309'],
  berry: ['#BE185D', '#7C3AED'],
  sunrise: ['#C2410C', '#BE185D'],
  garden: ['#15803D', '#0F766E'],
  sunset: ['#B45309', '#C2410C'],
  twilight: ['#6B21A8', '#9D174D'],
  ocean: ['#1D4ED8', '#1E3A8A'],
  dawn: ['#78350F', '#92400E'],
  citrus: ['#B45309', '#92400E'],
};

export const lightTheme: Theme = {
  name: 'light',
  isDark: false,
  colors: lightColors,
  palette: basePalette,
  gradients: baseGradients,
};

export const darkTheme: Theme = {
  name: 'dark',
  isDark: true,
  colors: darkColors,
  palette: basePalette,
  gradients: darkGradients,
};
