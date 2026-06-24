import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as baseColors } from '../utils/designSystem';

// In dark mode the neutral ramp is inverted: 50 is the darkest (app
// background) and 900 the lightest (highest-contrast text). Because every
// screen already references `colors.neutral[50]` for surfaces and
// `colors.neutral[800/900]` for text, inverting the ramp flips the whole UI
// correctly with no per-style changes.
const darkNeutral = {
  50: '#15140F', // app background
  100: '#1E1D17', // cards / inputs
  200: '#2B2A22', // borders
  300: '#3A3830',
  400: '#6F6A5E', // placeholder text
  500: '#8C8678',
  600: '#A8A397', // secondary text
  700: '#C7C2B5',
  800: '#E8E4D8', // primary text
  900: '#FAF8F0', // strongest text
};

export const lightColors = {
  ...baseColors,
  surface: '#FFFFFF',
  background: baseColors.neutral[50],
};

export const darkColors = {
  ...baseColors,
  neutral: darkNeutral,
  surface: '#1E1D17',
  background: '#15140F',
};

export type ThemeColors = typeof lightColors;
export type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const STORAGE_KEY = 'theme_mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved === 'dark' || saved === 'light') setModeState(saved);
    });
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  };

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = mode === 'dark';
    return {
      colors: isDark ? darkColors : lightColors,
      isDark,
      mode,
      setMode,
      toggle: () => setMode(isDark ? 'light' : 'dark'),
    };
  }, [mode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Falls back to the light theme when used outside a provider (e.g. in unit
// tests that render a component in isolation).
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx;
  return {
    colors: lightColors,
    isDark: false,
    mode: 'light',
    setMode: () => undefined,
    toggle: () => undefined,
  };
}
