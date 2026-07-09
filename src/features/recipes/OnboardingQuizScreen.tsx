import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import { UserPreferences } from '../../types';
import { useMultiUserStore } from '../../store/useMultiUserStore';

interface QuizStep {
  id: string;
  title: string;
  subtitle: string;
  type: 'multiple_choice' | 'multi_select' | 'slider' | 'text';
  options?: string[];
  field: keyof UserPreferences;
}

const QUIZ_STEPS: QuizStep[] = [
  {
    id: 'dietary',
    title: 'Dietary Preferences',
    subtitle: 'Let us know about any dietary restrictions or preferences',
    type: 'multi_select',
    options: [
      'Vegetarian',
      'Vegan',
      'Gluten-Free',
      'Dairy-Free',
      'Keto',
      'Paleo',
      'Mediterranean',
      'None',
    ],
    field: 'dietaryRestrictions',
  },
  {
    id: 'allergies',
    title: 'Food Allergies',
    subtitle: 'Select any ingredients you need to avoid',
    type: 'multi_select',
    options: [
      'Peanuts',
      'Tree Nuts',
      'Milk',
      'Eggs',
      'Soy',
      'Fish',
      'Shellfish',
      'Wheat',
      'None',
    ],
    field: 'allergies',
  },
  {
    id: 'cuisines',
    title: 'Favorite Cuisines',
    subtitle: 'What types of food do you enjoy most?',
    type: 'multi_select',
    options: [
      'Italian',
      'Mexican',
      'Asian',
      'Indian',
      'Mediterranean',
      'American',
      'French',
      'Thai',
      'Japanese',
      'Greek',
      'Middle Eastern',
      'African',
    ],
    field: 'preferredCuisines',
  },
  {
    id: 'cooking_skill',
    title: 'Cooking Experience',
    subtitle: 'How comfortable are you in the kitchen?',
    type: 'multiple_choice',
    options: ['Beginner', 'Intermediate', 'Advanced'],
    field: 'cookingSkill',
  },
  {
    id: 'cooking_time',
    title: 'Preferred Cooking Time',
    subtitle: 'How much time do you usually have for cooking?',
    type: 'multiple_choice',
    options: ['Quick (15-30 min)', 'Medium (30-60 min)', 'Slow (60+ min)'],
    field: 'preferredCookingTime',
  },
  {
    id: 'spice_tolerance',
    title: 'Spice Tolerance',
    subtitle: 'How spicy do you like your food?',
    type: 'multiple_choice',
    options: ['Mild', 'Medium', 'Hot'],
    field: 'spiceTolerance',
  },
  {
    id: 'health_goals',
    title: 'Health Goals',
    subtitle: 'What are your primary health and nutrition goals?',
    type: 'multi_select',
    options: [
      'Weight Loss',
      'Muscle Gain',
      'Heart Healthy',
      'Low Carb',
      'High Protein',
      'Balanced Nutrition',
      'Energy Boost',
      'None',
    ],
    field: 'healthGoals',
  },
];

export default function OnboardingQuizScreen() {
  const navigation = useNavigation();
  const { currentUser } = useMultiUserStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    dietaryRestrictions: [],
    allergies: [],
    preferredCuisines: [],
    cookingSkill: 'beginner',
    preferredCookingTime: 'medium',
    spiceTolerance: 'medium',
    healthGoals: [],
    preferredServings: 2,
    preferredFlavors: [],
    preferredRecipeTypes: ['breakfast', 'lunch', 'dinner'],
    cookingEquipment: ['stovetop', 'oven'],
    dislikedIngredients: [],
  });

  const handleOptionSelect = (option: string, field: keyof UserPreferences) => {
    const currentValue = preferences[field];
    
    if (Array.isArray(currentValue)) {
      const newArray = currentValue.includes(option)
        ? currentValue.filter(item => item !== option)
        : [...currentValue, option];
      
      setPreferences(prev => ({
        ...prev,
        [field]: newArray,
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        [field]: option.toLowerCase(),
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < QUIZ_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      if (!currentUser) {
        Alert.alert('Error', 'User not found. Please try again.');
        return;
      }

      // Save preferences to backend
      const { userPreferencesService } = await import('../../services/userPreferencesService');
      await userPreferencesService.saveOnboardingPreferences(currentUser.id, preferences as UserPreferences);
      
      console.log('Saving preferences:', preferences);
      
      Alert.alert(
        'Preferences Saved!',
        'Your preferences have been saved. We\'ll use these to recommend personalized recipes for you.',
        [
          {
            text: 'Continue',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  const currentQuizStep = QUIZ_STEPS[currentStep];
  const progress = ((currentStep + 1) / QUIZ_STEPS.length) * 100;

  return (
    <View style={styles.container}>
      <PantryHeader
        title="Recipe Preferences"
        subtitle="Help us recommend the perfect recipes for you"
        gradient="sunset"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {QUIZ_STEPS.length}
          </Text>
        </View>

        {/* Current Question */}
        <PantryCard variant="elevated" margin="lg">
          <Text style={styles.questionTitle}>{currentQuizStep.title}</Text>
          <Text style={styles.questionSubtitle}>{currentQuizStep.subtitle}</Text>
          
          <View style={styles.optionsContainer}>
            {currentQuizStep.options?.map((option) => {
              const isSelected = Array.isArray(preferences[currentQuizStep.field])
                ? (preferences[currentQuizStep.field] as string[])?.includes(option)
                : preferences[currentQuizStep.field] === option.toLowerCase();
              
              return (
                <PantryButton
                  key={option}
                  title={option}
                  variant={isSelected ? 'primary' : 'outline'}
                  onPress={() => handleOptionSelect(option, currentQuizStep.field)}
                  style={styles.optionButton}
                  textStyle={styles.optionButtonText}
                />
              );
            })}
          </View>
        </PantryCard>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 0 && (
            <PantryButton
              title="Back"
              variant="outline"
              onPress={handleBack}
              style={styles.navButton}
            />
          )}
          
          <PantryButton
            title={currentStep === QUIZ_STEPS.length - 1 ? 'Complete' : 'Next'}
            variant="primary"
            onPress={handleNext}
            style={styles.navButton}
            fullWidth={currentStep === 0}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    marginBottom: 8,
  },
  optionButtonText: {
    fontSize: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 32,
  },
  navButton: {
    flex: 1,
  },
});
