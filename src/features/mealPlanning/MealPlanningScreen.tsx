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
  const [dietaryPreferences, setDietaryPreferences] =
    useState<DietaryPreferences>({
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
        maxPrepTime: planningOptions.maxPrepTime,
        maxCookTime: planningOptions.maxCookTime,
        exploreNewRecipes: planningOptions.exploreNewRecipes,
        dietaryPreferences: dietaryPreferences,
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

  const handleQuickTest = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to run a quick test.');
      return;
    }

    // Test the filtering logic directly
    const { enhancedMealPlanningService } = await import(
      '../../services/enhancedMealPlanningService'
    );

    // Simulate the filtering process
    let availableRecipes = recipes;
    if (dietaryPreferences.cuisines.length > 0) {
      availableRecipes = availableRecipes.filter(recipe => {
        const recipeCuisines = recipe.cuisines || [];
        const hasMatchingCuisine = dietaryPreferences.cuisines.some(cuisine =>
          recipeCuisines.includes(cuisine)
        );
        return hasMatchingCuisine;
      });
    }

    if (dietaryPreferences.diets.length > 0) {
      // If vegetarian is selected, also include vegan dishes
      const effectiveDiets = [...dietaryPreferences.diets];
      if (
        dietaryPreferences.diets.includes('vegetarian') &&
        !dietaryPreferences.diets.includes('vegan')
      ) {
        effectiveDiets.push('vegan');
      }

      availableRecipes = availableRecipes.filter(recipe => {
        const recipeDiets = recipe.diets || [];
        const hasMatchingDiet = effectiveDiets.some(diet =>
          recipeDiets.includes(diet)
        );
        return hasMatchingDiet;
      });
    }

    Alert.alert(
      'Quick Test Results',
      `Found ${availableRecipes.length} recipes matching your preferences.`
    );
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
              if you don't have all the ingredients yet!
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
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Dietary Preferences</Text>
              <Text style={styles.modalPlaceholder}>
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
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  debugToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  debugToggleText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 8,
    width: 60,
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  preferencesSummary: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  preferenceText: {
    fontSize: 14,
    color: '#666',
  },
  generateButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  mealPlanContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nutritionSummary: {
    marginBottom: 20,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
  },
  dayContainer: {
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  mealItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  mealServings: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  mealNutrition: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  debugSection: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  quickTestButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  quickTestButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  preferencesContent: {
    maxHeight: 400,
  },
  preferenceSection: {
    marginBottom: 20,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  preferenceNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  preferenceOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
  },
  preferenceOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#9e9e9e',
  },
  modalSaveButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exploreInfo: {
    backgroundColor: '#e0f7fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  exploreInfoText: {
    fontSize: 14,
    color: '#00796b',
    textAlign: 'center',
  },
  enhancedPreferencesButton: {
    backgroundColor: '#6f42c1',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  enhancedPreferencesButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  preferencesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  preferencesText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resultValue: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
  },
  resultSection: {
    marginTop: 12,
  },
  resultSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultItem: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    marginBottom: 2,
  },
});
