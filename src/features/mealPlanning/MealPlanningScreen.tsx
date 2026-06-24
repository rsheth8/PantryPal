import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import {
  mealPlanningService,
  MealPlanningOptions,
} from '../../services/mealPlanningService';
import {
  enhancedMealPlanningService,
  EnhancedMealPlanningOptions,
} from '../../services/enhancedMealPlanningService';
import { MealPlan, DietaryPreferences } from '../../types';

export default function MealPlanningScreen() {
  const { recipes, pantry, currentUser, currentHousehold } =
    useMultiUserStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan | null>(null);
  const [mealPlanningResults, setMealPlanningResults] = useState<{
    tierUsed: number;
    relaxations: string[];
    warnings: string[];
    success: boolean;
  } | null>(null);
  const [isPreferencesModalVisible, setIsPreferencesModalVisible] =
    useState(false);

  // Meal planning options
  const [planningOptions, setPlanningOptions] = useState<MealPlanningOptions>({
    includeBreakfast: true,
    includeLunch: true,
    includeDinner: true,
    includeSnacks: false,
    servingsPerMeal: 2,
    maxPrepTime: 30,
    maxCookTime: 60,
    exploreNewRecipes: true,
  });

  // Enhanced dietary preferences
  const [dietaryPreferences] = useState<DietaryPreferences>({
    userId: currentUser?.id || '',

    // SACRED - Never relaxed
    diets: [],
    allergens: [],
    medicalRestrictions: [],

    // FLEXIBLE - Can be relaxed
    cuisines: [],
    difficulty: 'any',
    maxPrepTime: 30,
    maxCookTime: 60,

    // Nutrition Goals
    nutritionGoals: {
      dailyCalories: 2000,
      proteinPercentage: 25,
      carbsPercentage: 45,
      fatPercentage: 30,
      maxFiber: 30,
      maxSugar: 50,
      maxSodium: 2300,
    },

    // Lifestyle Preferences
    lifestyle: {
      familySize: 2,
      budget: 'moderate',
      mealFrequency: 3,
      prepStyle: 'any',
      skillLevel: 'intermediate',
    },

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleGenerateMealPlan = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to generate a meal plan.');
      return;
    }

    if (recipes.length === 0) {
      Alert.alert(
        'No Recipes',
        'Add some recipes first to generate a meal plan.'
      );
      return;
    }

    setIsGenerating(true);
    try {
      // Create the enhanced meal planning options
      const enhancedOptions: EnhancedMealPlanningOptions = {
        includeBreakfast: planningOptions.includeBreakfast,
        includeLunch: planningOptions.includeLunch,
        includeDinner: planningOptions.includeDinner,
        includeSnacks: planningOptions.includeSnacks,
        servingsPerMeal: planningOptions.servingsPerMeal,
        maxPrepTime: planningOptions.maxPrepTime || 30,
        maxCookTime: planningOptions.maxCookTime || 60,
        exploreNewRecipes: planningOptions.exploreNewRecipes || true,
        dietaryPreferences,
      };

      const result = await enhancedMealPlanningService.generateMealPlan(
        recipes,
        pantry,
        enhancedOptions,
        currentUser.id,
        currentHousehold?.id
      );

      setCurrentMealPlan(result.mealPlan);
      setMealPlanningResults({
        tierUsed: result.tierUsed,
        relaxations: result.relaxations,
        warnings: result.warnings,
        success: result.success,
      });

      // Show results to user
      let message = `Meal plan generated successfully!\n\n`;
      message += `Tier used: ${result.tierUsed}\n`;
      message += `Success: ${result.success ? 'Yes' : 'No'}\n`;

      if (result.relaxations.length > 0) {
        message += `\nRelaxations:\n${result.relaxations.join('\n')}`;
      }

      if (result.warnings.length > 0) {
        message += `\n\nWarnings:\n${result.warnings.join('\n')}`;
      }

      Alert.alert('Enhanced Meal Planning Results', message);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      Alert.alert('Error', 'Failed to generate meal plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveMealPlan = async () => {
    if (!currentMealPlan) return;

    try {
      await mealPlanningService.saveMealPlan(currentMealPlan);
      Alert.alert('Success', 'Meal plan saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal plan.');
    }
  };

  const renderMealPlan = () => {
    if (!currentMealPlan) return null;

    const daysOfWeek = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    return (
      <View style={styles.mealPlanContainer}>
        <Text style={styles.sectionTitle}>Your Meal Plan</Text>

        {/* Nutrition Summary */}
        {currentMealPlan.totalNutrition && (
          <View style={styles.nutritionSummary}>
            <Text style={styles.nutritionTitle}>Weekly Nutrition Summary</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {currentMealPlan.totalNutrition.calories}
                </Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {currentMealPlan.totalNutrition.protein}g
                </Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {currentMealPlan.totalNutrition.carbs}g
                </Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {currentMealPlan.totalNutrition.fat}g
                </Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>
        )}

        {/* Daily Meals */}
        {daysOfWeek.map(day => {
          const dayMeals = currentMealPlan.meals[day];
          if (!dayMeals) return null;

          return (
            <View key={day} style={styles.dayContainer}>
              <Text style={styles.dayTitle}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </Text>

              {dayMeals.breakfast && (
                <View style={styles.mealItem}>
                  <Text style={styles.mealType}>🌅 Breakfast</Text>
                  <Text style={styles.mealTitle}>
                    {dayMeals.breakfast.recipeTitle}
                  </Text>
                  <Text style={styles.mealServings}>
                    {dayMeals.breakfast.servings} servings
                  </Text>
                  {dayMeals.breakfast.nutrition && (
                    <Text style={styles.mealNutrition}>
                      {dayMeals.breakfast.nutrition.calories} cal |{' '}
                      {dayMeals.breakfast.nutrition.protein}g protein
                    </Text>
                  )}
                </View>
              )}

              {dayMeals.lunch && (
                <View style={styles.mealItem}>
                  <Text style={styles.mealType}>🌞 Lunch</Text>
                  <Text style={styles.mealTitle}>
                    {dayMeals.lunch.recipeTitle}
                  </Text>
                  <Text style={styles.mealServings}>
                    {dayMeals.lunch.servings} servings
                  </Text>
                  {dayMeals.lunch.nutrition && (
                    <Text style={styles.mealNutrition}>
                      {dayMeals.lunch.nutrition.calories} cal |{' '}
                      {dayMeals.lunch.nutrition.protein}g protein
                    </Text>
                  )}
                </View>
              )}

              {dayMeals.dinner && (
                <View style={styles.mealItem}>
                  <Text style={styles.mealType}>🌙 Dinner</Text>
                  <Text style={styles.mealTitle}>
                    {dayMeals.dinner.recipeTitle}
                  </Text>
                  <Text style={styles.mealServings}>
                    {dayMeals.dinner.servings} servings
                  </Text>
                  {dayMeals.dinner.nutrition && (
                    <Text style={styles.mealNutrition}>
                      {dayMeals.dinner.nutrition.calories} cal |{' '}
                      {dayMeals.dinner.nutrition.protein}g protein
                    </Text>
                  )}
                </View>
              )}

              {dayMeals.snacks && dayMeals.snacks.length > 0 && (
                <View style={styles.mealItem}>
                  <Text style={styles.mealType}>🍎 Snacks</Text>
                  {dayMeals.snacks.map((snack, index) => (
                    <Text key={index} style={styles.mealTitle}>
                      {snack.recipeTitle}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Planning</Text>
        <Text style={styles.subtitle}>Plan your weekly meals</Text>

        {/* Planning Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planning Options</Text>

          <View style={styles.optionItem}>
            <Text style={styles.optionLabel}>Include Breakfast</Text>
            <Switch
              value={planningOptions.includeBreakfast}
              onValueChange={value =>
                setPlanningOptions({
                  ...planningOptions,
                  includeBreakfast: value,
                })
              }
            />
          </View>

          <View style={styles.optionItem}>
            <Text style={styles.optionLabel}>Include Lunch</Text>
            <Switch
              value={planningOptions.includeLunch}
              onValueChange={value =>
                setPlanningOptions({ ...planningOptions, includeLunch: value })
              }
            />
          </View>

          <View style={styles.optionItem}>
            <Text style={styles.optionLabel}>Include Dinner</Text>
            <Switch
              value={planningOptions.includeDinner}
              onValueChange={value =>
                setPlanningOptions({ ...planningOptions, includeDinner: value })
              }
            />
          </View>

          <View style={styles.optionItem}>
            <Text style={styles.optionLabel}>Include Snacks</Text>
            <Switch
              value={planningOptions.includeSnacks}
              onValueChange={value =>
                setPlanningOptions({ ...planningOptions, includeSnacks: value })
              }
            />
          </View>

          <View style={styles.optionItem}>
            <Text style={styles.optionLabel}>Servings per Meal</Text>
            <TextInput
              style={styles.numberInput}
              value={planningOptions.servingsPerMeal.toString()}
              onChangeText={text =>
                setPlanningOptions({
                  ...planningOptions,
                  servingsPerMeal: parseInt(text) || 2,
                })
              }
              keyboardType='numeric'
            />
          </View>

          <View style={styles.optionItem}>
            <Text style={styles.optionLabel}>Explore New Recipes</Text>
            <Switch
              value={planningOptions.exploreNewRecipes}
              onValueChange={value =>
                setPlanningOptions({
                  ...planningOptions,
                  exploreNewRecipes: value,
                })
              }
            />
          </View>

          <View style={styles.exploreInfo}>
            <Text style={styles.exploreInfoText}>
              🌍 Discover new cuisines and recipes from around the world, even
              if you don&apos;t have all the ingredients yet!
            </Text>
          </View>
        </View>

        {/* Enhanced Preferences Button */}
        <TouchableOpacity
          style={styles.enhancedPreferencesButton}
          onPress={() => {
            setIsPreferencesModalVisible(true);
          }}
        >
          <Text style={styles.enhancedPreferencesButtonText}>
            ⚙️ Enhanced Preferences
          </Text>
        </TouchableOpacity>

        {/* Current Preferences Summary */}
        <View style={styles.preferencesSummary}>
          <Text style={styles.preferencesTitle}>📋 Current Preferences:</Text>
          <Text style={styles.preferencesText}>
            Diets:{' '}
            {dietaryPreferences.diets.length > 0
              ? dietaryPreferences.diets.join(', ')
              : 'None'}
          </Text>
          <Text style={styles.preferencesText}>
            Allergens:{' '}
            {dietaryPreferences.allergens.length > 0
              ? dietaryPreferences.allergens.join(', ')
              : 'None'}
          </Text>
          <Text style={styles.preferencesText}>
            Cuisines:{' '}
            {dietaryPreferences.cuisines.length > 0
              ? dietaryPreferences.cuisines.join(', ')
              : 'None'}
          </Text>
          <Text style={styles.preferencesText}>
            Difficulty: {dietaryPreferences.difficulty}
          </Text>
          {dietaryPreferences.nutritionGoals?.dailyCalories && (
            <Text style={styles.preferencesText}>
              Calories: {dietaryPreferences.nutritionGoals.dailyCalories}
            </Text>
          )}
        </View>

        {/* Dietary Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dietary Preferences</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsPreferencesModalVisible(true)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.preferencesSummary}>
            <Text style={styles.preferenceText}>
              Diets:{' '}
              {dietaryPreferences.diets.length > 0
                ? dietaryPreferences.diets.join(', ')
                : 'None'}
            </Text>
            <Text style={styles.preferenceText}>
              Allergens:{' '}
              {dietaryPreferences.allergens.length > 0
                ? dietaryPreferences.allergens.join(', ')
                : 'None'}
            </Text>
            <Text style={styles.preferenceText}>
              Cuisines:{' '}
              {dietaryPreferences.cuisines.length > 0
                ? dietaryPreferences.cuisines.join(', ')
                : 'Any'}
            </Text>
          </View>
        </View>

        {/* Generate Meal Plan */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateMealPlan}
            disabled={isGenerating}
          >
            <Text style={styles.generateButtonText}>
              {isGenerating ? '🔄 Generating...' : '�� Generate Meal Plan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Modal - Coming Soon */}
        <Modal
          visible={isPreferencesModalVisible}
          animationType='slide'
          presentationStyle='pageSheet'
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Dietary Preferences</Text>
              <Text style={styles.subtitle}>
                Enhanced preferences modal coming soon!
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setIsPreferencesModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Test Simple Modal - Commented out */}
        {/*
        <Modal
          visible={isPreferencesModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsPreferencesModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Test Preferences Modal</Text>
              <Text>Modal is working! Current preferences:</Text>
              <Text>Diets: {dietaryPreferences.diets.join(', ') || 'None'}</Text>
              <Text>Allergens: {dietaryPreferences.allergens.join(', ') || 'None'}</Text>
              <Text>Cuisines: {dietaryPreferences.cuisines.join(', ') || 'None'}</Text>
              
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setIsPreferencesModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        */}

        {/* Meal Plan Display */}
        {renderMealPlan()}

        {/* Save Meal Plan */}
        {currentMealPlan && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveMealPlan}
            >
              <Text style={styles.saveButtonText}>Save Meal Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Meal Planning Results */}
        {mealPlanningResults && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Meal Planning Results</Text>
            <View style={styles.resultsContainer}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Tier Used:</Text>
                <Text style={styles.resultValue}>
                  {mealPlanningResults.tierUsed}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Success:</Text>
                <Text
                  style={[
                    styles.resultValue,
                    {
                      color: mealPlanningResults.success
                        ? '#28a745'
                        : '#dc3545',
                    },
                  ]}
                >
                  {mealPlanningResults.success ? 'Yes' : 'No'}
                </Text>
              </View>

              {mealPlanningResults.relaxations.length > 0 && (
                <View style={styles.resultSection}>
                  <Text style={styles.resultSubtitle}>🔄 Relaxations:</Text>
                  {mealPlanningResults.relaxations.map((relaxation, index) => (
                    <Text key={index} style={styles.resultItem}>
                      • {relaxation}
                    </Text>
                  ))}
                </View>
              )}

              {mealPlanningResults.warnings.length > 0 && (
                <View style={styles.resultSection}>
                  <Text style={styles.resultSubtitle}>⚠️ Warnings:</Text>
                  {mealPlanningResults.warnings.map((warning, index) => (
                    <Text key={index} style={styles.resultItem}>
                      • {warning}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  dayContainer: {
    marginBottom: 20,
  },
  dayTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  enhancedPreferencesButton: {
    alignItems: 'center',
    backgroundColor: '#6f42c1',
    borderRadius: 8,
    marginBottom: 12,
    paddingVertical: 16,
  },
  enhancedPreferencesButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  exploreInfo: {
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    marginTop: 12,
    padding: 12,
  },
  exploreInfoText: {
    color: '#00796b',
    fontSize: 14,
    textAlign: 'center',
  },
  generateButton: {
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 16,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 1,
    padding: 16,
  },
  mealItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
  },
  mealNutrition: {
    color: '#555',
    fontSize: 12,
    marginTop: 4,
  },
  mealPlanContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mealServings: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  mealTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mealType: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 12,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  numberInput: {
    borderColor: '#e0e0e0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    textAlign: 'center',
    width: 60,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionLabel: {
    color: '#666',
    fontSize: 12,
  },
  nutritionSummary: {
    marginBottom: 20,
  },
  nutritionTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  nutritionValue: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  optionItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  optionLabel: {
    color: '#333',
    fontSize: 16,
  },
  preferenceText: {
    color: '#666',
    fontSize: 14,
  },
  preferencesSummary: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  preferencesText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  preferencesTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultItem: {
    color: '#666',
    fontSize: 12,
    marginBottom: 2,
    marginLeft: 8,
  },
  resultLabel: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultSection: {
    marginTop: 12,
  },
  resultSubtitle: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultValue: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    color: '#333',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});
