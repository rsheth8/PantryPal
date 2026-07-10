import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeMode, lightTheme, darkTheme } from './themes';

const THEME_STORAGE_KEY = 'pantrypal-theme-mode';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  mode: 'system',
  setMode: () => undefined,
  toggleTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(stored => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        }
      })
      .catch(() => undefined);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const resolvedDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const toggleTheme = useCallback(() => {
    setMode(resolvedDark ? 'light' : 'dark');
  }, [resolvedDark, setMode]);

  const value = useMemo(
    () => ({
      theme: resolvedDark ? darkTheme : lightTheme,
      mode,
      setMode,
      toggleTheme,
    }),
    [resolvedDark, mode, setMode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

type NamedStyles<T> = StyleSheet.NamedStyles<T>;

// Memoized themed StyleSheet factory. Usage:
//   const styles = useThemedStyles(createStyles);
//   ...
//   const createStyles = (theme: Theme) => StyleSheet.create({ ... });
export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (theme: Theme) => T
): T {
  const { theme } = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
