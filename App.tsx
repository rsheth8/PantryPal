import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { authService } from './src/services/authService';
import { useMultiUserStore } from './src/store/useMultiUserStore';
import { notificationService } from './src/services/notificationService';
import { isDevMode } from './src/config/dev';
import { ThemeProvider, useTheme } from './src/theme';

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

function AppInner() {
  const { colors, isDark } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializeUser = useMultiUserStore(state => state.initializeUser);
  const storeIsLoading = useMultiUserStore(state => state.isLoading);

  useEffect(() => {
    checkAuthStatus();
    // Setup notifications
    notificationService.setupNotifications();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Development mode bypass
      if (isDevMode()) {
        console.log('DEV MODE: Automatically authenticating');
        setIsAuthenticated(true);
        // Initialize store immediately in dev mode
        await initializeUser();
        setIsLoading(false);
        return;
      }

      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        // Initialize store when authenticated
        await initializeUser();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
    // Initialize store when user successfully authenticates
    await initializeUser();
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.surface,
        },
      }
    : {
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, background: colors.background },
      };

  if (isLoading || storeIsLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View
          style={{
            alignItems: 'center',
            backgroundColor: colors.background,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator size='large' color={colors.primary[500]} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        {isAuthenticated ? (
          <MainTabNavigator onSignOut={handleSignOut} />
        ) : (
          <AuthNavigator onAuthSuccess={handleAuthSuccess} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
