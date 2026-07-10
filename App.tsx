import 'react-native-gesture-handler';
import React, { useCallback, useEffect, useState } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import OnboardingScreen from './src/features/onboarding/OnboardingScreen';
import SplashOverlay from './src/components/SplashOverlay';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { ToastProvider } from './src/components/ui';
import { authService } from './src/services/authService';
import { useMultiUserStore } from './src/store/useMultiUserStore';
import { notificationService } from './src/services/notificationService';
import { isDevMode } from './src/config/dev';
import { logger } from './src/utils/logger';

const ONBOARDING_KEY = 'pantrypal-onboarding-complete';
const MIN_SPLASH_MS = 1600;

function AppContent() {
  const { theme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const initializeUser = useMultiUserStore(state => state.initializeUser);

  useEffect(() => {
    const bootStart = Date.now();

    const boot = async () => {
      try {
        // Notifications setup is non-blocking; failures shouldn't stall boot.
        notificationService.setupNotifications().catch(err => {
          logger.warn('Notification setup failed:', err);
        });

        const [onboardingDone] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_KEY),
        ]);
        setNeedsOnboarding(onboardingDone !== 'true');

        if (isDevMode()) {
          logger.debug('DEV MODE: Automatically authenticating');
          setIsAuthenticated(true);
          await initializeUser();
        } else {
          const authenticated = await authService.isAuthenticated();
          setIsAuthenticated(authenticated);
          if (authenticated) {
            await initializeUser();
          }
        }
      } catch (error) {
        logger.error('Boot error:', error);
        setIsAuthenticated(false);
        setNeedsOnboarding(prev => (prev === null ? false : prev));
      } finally {
        // Keep the animated splash visible at least MIN_SPLASH_MS so the
        // entrance animation reads as intentional, not jank.
        const elapsed = Date.now() - bootStart;
        setTimeout(
          () => setIsBooting(false),
          Math.max(0, MIN_SPLASH_MS - elapsed)
        );
      }
    };

    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthSuccess = useCallback(async () => {
    setIsAuthenticated(true);
    await initializeUser();
  }, [initializeUser]);

  const handleSignOut = useCallback(async () => {
    try {
      await authService.signOut();
      setIsAuthenticated(false);
    } catch (error) {
      logger.error('Sign out error:', error);
    }
  }, []);

  const handleOnboardingDone = useCallback(() => {
    setNeedsOnboarding(false);
    AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => undefined);
  }, []);

  const navigationTheme = {
    ...(theme.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      card: theme.colors.tabBar,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };

  if (isBooting || isAuthenticated === null || needsOnboarding === null) {
    return (
      <>
        <StatusBar style='light' />
        <SplashOverlay />
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {needsOnboarding ? (
        <OnboardingScreen onDone={handleOnboardingDone} />
      ) : (
        <NavigationContainer theme={navigationTheme}>
          {isAuthenticated ? (
            <MainTabNavigator onSignOut={handleSignOut} />
          ) : (
            <AuthNavigator onAuthSuccess={handleAuthSuccess} />
          )}
        </NavigationContainer>
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
