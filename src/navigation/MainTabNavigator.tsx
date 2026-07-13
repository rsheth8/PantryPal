import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Animated, Text } from 'react-native';
import { typography } from '../utils/designSystem';
import { useTheme } from '../theme/ThemeContext';
import DashboardScreen from '../features/dashboard/DashboardScreen';
import PantryScreen from '../features/pantry/PantryScreen';
import RecipesScreen from '../features/recipes/RecipesScreen';
import ShoppingListScreen from '../features/shoppingList/ShoppingListScreen';
import ScannerScreen from '../features/scanner/ScannerScreen';
import SettingsScreen from '../features/settings/SettingsScreen';
import MealPlanningScreen from '../features/mealPlanning/MealPlanningScreen';
import HouseholdScreen from '../features/household/HouseholdScreen';
import AnalyticsScreen from '../features/analytics/AnalyticsScreen';
import AchievementsScreen from '../features/achievements/AchievementsScreen';
import ActivityScreen from '../features/activity/ActivityScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

// Dashboard hosts a stack so deeper features (meal planning, household,
// analytics) are reachable without crowding the tab bar.
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name='DashboardHome' component={DashboardScreen} />
      <HomeStack.Screen name='MealPlanning' component={MealPlanningScreen} />
      <HomeStack.Screen name='Household' component={HouseholdScreen} />
      <HomeStack.Screen name='Analytics' component={AnalyticsScreen} />
      <HomeStack.Screen name='Achievements' component={AchievementsScreen} />
      <HomeStack.Screen name='Activity' component={ActivityScreen} />
    </HomeStack.Navigator>
  );
}

interface MainTabNavigatorProps {
  onSignOut?: () => void;
}

// Tab icon that springs up slightly when focused.
function TabIcon({
  emoji,
  color,
  size,
  focused,
}: {
  emoji: string;
  color: string;
  size: number;
  focused: boolean;
}) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 0.9,
      useNativeDriver: true,
      speed: 30,
      bounciness: 10,
    }).start();
  }, [focused, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Text style={{ color, fontSize: size }}>{emoji}</Text>
    </Animated.View>
  );
}

export default function MainTabNavigator({ onSignOut }: MainTabNavigatorProps) {
  const { theme } = useTheme();

  const makeIcon = (emoji: string) => {
    const IconRenderer = ({
      color,
      size,
      focused,
    }: {
      color: string;
      size: number;
      focused: boolean;
    }) => <TabIcon emoji={emoji} color={color} size={size} focused={focused} />;
    IconRenderer.displayName = `TabIcon(${emoji})`;
    return IconRenderer;
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: theme.isDark ? 0.4 : 0.1,
          shadowRadius: 12,
          height: 88,
          paddingBottom: 20,
          paddingTop: 12,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          ...typography.caption,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tab.Screen
        name='Dashboard'
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: makeIcon('📊'),
        }}
      />
      <Tab.Screen
        name='Pantry'
        component={PantryScreen}
        options={{
          tabBarLabel: 'Pantry',
          tabBarIcon: makeIcon('🥫'),
        }}
      />
      <Tab.Screen
        name='Scanner'
        component={ScannerScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: makeIcon('📷'),
        }}
      />
      <Tab.Screen
        name='Recipes'
        component={RecipesScreen}
        options={{
          tabBarLabel: 'Recipes',
          tabBarIcon: makeIcon('📖'),
        }}
      />
      <Tab.Screen
        name='Shopping'
        component={ShoppingListScreen}
        options={{
          tabBarLabel: 'Shopping',
          tabBarIcon: makeIcon('🛒'),
        }}
      />
      <Tab.Screen
        name='Settings'
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: makeIcon('⚙️'),
        }}
      >
        {() => <SettingsScreen onSignOut={onSignOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
