import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../features/auth/LoginScreen';
import SignUpScreen from '../features/auth/SignUpScreen';

const Stack = createStackNavigator();

interface AuthNavigatorProps {
  onAuthSuccess: () => void;
}

export default function AuthNavigator({ onAuthSuccess }: AuthNavigatorProps) {
  const [isLogin, setIsLogin] = useState(true);

  const handleLoginSuccess = () => {
    onAuthSuccess();
  };

  const handleSignUpSuccess = () => {
    onAuthSuccess();
  };

  const switchToSignUp = () => {
    setIsLogin(false);
  };

  const switchToLogin = () => {
    setIsLogin(true);
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {isLogin ? (
        <Stack.Screen name='Login'>
          {() => (
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              onSwitchToSignUp={switchToSignUp}
            />
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name='SignUp'>
          {() => (
            <SignUpScreen
              onSignUpSuccess={handleSignUpSuccess}
              onSwitchToLogin={switchToLogin}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
