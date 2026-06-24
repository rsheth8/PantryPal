import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { authService } from './src/services/authService';
import { useMultiUserStore } from './src/store/useMultiUserStore';
import { notificationService } from './src/services/notificationService';
import { isDevMode } from './src/config/dev';

export default function App() {
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

  if (isLoading || storeIsLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#4CAF50' />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isAuthenticated ? (
          <MainTabNavigator onSignOut={handleSignOut} />
        ) : (
          <AuthNavigator onAuthSuccess={handleAuthSuccess} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
});
