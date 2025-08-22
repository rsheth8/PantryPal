import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RecipesScreen from '../features/recipes/RecipesScreen';
import AIChefScreen from '../features/recipes/AIChefScreen';
import OnboardingQuizScreen from '../features/recipes/OnboardingQuizScreen';
import EnhancedSearchScreen from '../features/recipes/EnhancedSearchScreen';
import RecipeDetailScreen from '../features/recipes/RecipeDetailScreen';

const Stack = createStackNavigator();

export default function RecipesNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="RecipesMain" component={RecipesScreen} />
      <Stack.Screen name="AIChef" component={AIChefScreen} />
      <Stack.Screen name="Preferences" component={OnboardingQuizScreen} />
      <Stack.Screen name="EnhancedSearch" component={EnhancedSearchScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
    </Stack.Navigator>
  );
}
