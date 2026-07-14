import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import {
  enhancedMealPlanningService,
  EnhancedMealPlanningOptions,
} from '../../services/enhancedMealPlanningService';
import { mealPlanningService } from '../../services/mealPlanningService';
import { MealPlan, DietaryPreferences } from '../../types';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  FadeSlideIn,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles, useTheme } from '../../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import { haptics } from '../../utils/haptics';
import { logger } from '../../utils/logger';

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const MEAL_SLOTS: {
  key: 'breakfast' | 'lunch' | 'dinner';
  label: string;
  icon: string;
}[] = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch', label: 'Lunch', icon: '🌞' },
  { key: 'dinner', label: 'Dinner', icon: '🌙' },
];

const DIET_OPTIONS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'keto',
  'paleo',
];

const CUISINE_OPTIONS = [
  'italian',
  'mexican',
  'asian',
  'mediterranean',
  'indian',
  'american',
];

export default function MealPlanningScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const { showToast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const { recipes, pantry, currentUser, currentHousehold } =
    useMultiUserStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan | null>(null);
  const [saved, setSaved] = useState(false);

  const [includeBreakfast, setIncludeBreakfast] = useState(true);
  const [includeLunch, setIncludeLunch] = useState(true);
  const [includeDinner, setIncludeDinner] = useState(true);
  const [includeSnacks, setIncludeSnacks] = useState(false);
  const [exploreNew, setExploreNew] = useState(true);
  const [servings, setServings] = useState(2);

  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

  const toggleInList = (
    value: string,
    list: string[],
    setter: (next: string[]) => void
  ) => {
    haptics.selection();
    setter(
      list.includes(value) ? list.filter(v => v !== value) : [...list, value]
    );
  };

  const handleGenerate = async () => {
    if (!currentUser) {
      showToast('Please log in to generate a meal plan', { type: 'warning' });
      return;
    }
    if (recipes.length === 0) {
      showToast('Add some recipes first — try the Discover tab', {
        type: 'warning',
      });
      return;
    }

    setIsGenerating(true);
    setSaved(false);
    haptics.medium();

    const dietaryPreferences: DietaryPreferences = {
      userId: currentUser.id,
      diets: selectedDiets,
      allergens: [],
      medicalRestrictions: [],
      cuisines: selectedCuisines,
      difficulty: 'any',
      maxPrepTime: 30,
      maxCookTime: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const options: EnhancedMealPlanningOptions = {
      includeBreakfast,
      includeLunch,
      includeDinner,
      includeSnacks,
      servingsPerMeal: servings,
      maxPrepTime: 30,
      maxCookTime: 60,
      exploreNewRecipes: exploreNew,
      dietaryPreferences,
    };

    try {
      const result = await enhancedMealPlanningService.generateMealPlan(
        recipes,
        pantry,
        options,
        currentUser.id,
        currentHousehold?.id
      );
      setCurrentMealPlan(result.mealPlan);
      if (result.warnings.length > 0) {
        showToast(result.warnings[0], { type: 'info' });
      } else {
        showToast('Your week is planned! 🍽️', { type: 'success' });
      }
    } catch (error) {
      logger.error('Error generating meal plan:', error);
      showToast('Could not generate meal plan — try again', { type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!currentMealPlan) return;
    try {
      await mealPlanningService.saveMealPlan(currentMealPlan);
      setSaved(true);
      haptics.success();
      showToast('Meal plan saved', { type: 'success' });
    } catch (error) {
      logger.error('Error saving meal plan:', error);
      showToast('Could not save meal plan', { type: 'error' });
    }
  };

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Meal Planning'
        subtitle='Plan a delicious week'
        gradient='sunset'
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Meal selection */}
        <FadeSlideIn>
          <PantryCard variant='elevated' padding='lg'>
            <Text style={styles.sectionTitle}>🍴 Which meals?</Text>
            {(
              [
                ['Breakfast', includeBreakfast, setIncludeBreakfast],
                ['Lunch', includeLunch, setIncludeLunch],
                ['Dinner', includeDinner, setIncludeDinner],
                ['Snacks', includeSnacks, setIncludeSnacks],
              ] as const
            ).map(([label, value, setter]) => (
              <View key={label} style={styles.optionRow}>
                <Text style={styles.optionLabel}>{label}</Text>
                <Switch
                  value={value}
                  onValueChange={next => {
                    haptics.selection();
                    setter(next);
                  }}
                  trackColor={{
                    false: theme.colors.surfaceMuted,
                    true: theme.palette.primary[300],
                  }}
                  thumbColor={
                    value
                      ? theme.palette.primary[600]
                      : theme.colors.borderStrong
                  }
                />
              </View>
            ))}

            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Servings per meal</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => {
                    haptics.selection();
                    setServings(s => Math.max(1, s - 1));
                  }}
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{servings}</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => {
                    haptics.selection();
                    setServings(s => Math.min(12, s + 1));
                  }}
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionTextBox}>
                <Text style={styles.optionLabel}>Explore new recipes</Text>
                <Text style={styles.optionSubtitle}>
                  Discover meals beyond your saved collection
                </Text>
              </View>
              <Switch
                value={exploreNew}
                onValueChange={next => {
                  haptics.selection();
                  setExploreNew(next);
                }}
                trackColor={{
                  false: theme.colors.surfaceMuted,
                  true: theme.palette.primary[300],
                }}
                thumbColor={
                  exploreNew
                    ? theme.palette.primary[600]
                    : theme.colors.borderStrong
                }
              />
            </View>
          </PantryCard>
        </FadeSlideIn>

        {/* Dietary preferences */}
        <FadeSlideIn delay={80}>
          <PantryCard variant='fresh' padding='lg'>
            <Text style={styles.sectionTitle}>🥗 Diets</Text>
            <View style={styles.chipWrap}>
              {DIET_OPTIONS.map(diet => {
                const active = selectedDiets.includes(diet);
                return (
                  <TouchableOpacity
                    key={diet}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() =>
                      toggleInList(diet, selectedDiets, setSelectedDiets)
                    }
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {diet}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, styles.subheading]}>
              🌍 Preferred cuisines
            </Text>
            <View style={styles.chipWrap}>
              {CUISINE_OPTIONS.map(cuisine => {
                const active = selectedCuisines.includes(cuisine);
                return (
                  <TouchableOpacity
                    key={cuisine}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() =>
                      toggleInList(
                        cuisine,
                        selectedCuisines,
                        setSelectedCuisines
                      )
                    }
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {cuisine}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </PantryCard>
        </FadeSlideIn>

        {/* Generate */}
        <FadeSlideIn delay={140}>
          <PantryButton
            title={
              isGenerating ? 'Generating your week...' : 'Generate Meal Plan'
            }
            onPress={handleGenerate}
            variant='primary'
            size='lg'
            loading={isGenerating}
            icon={isGenerating ? undefined : '✨'}
            fullWidth
          />
        </FadeSlideIn>

        {/* Loading skeletons */}
        {isGenerating && (
          <View style={styles.skeletonWrap}>
            {[0, 1, 2].map(i => (
              <View key={i} style={styles.skeletonCard}>
                <Skeleton height={18} width='40%' />
                <Skeleton height={14} width='80%' style={styles.skeletonGap} />
                <Skeleton height={14} width='60%' style={styles.skeletonGap} />
              </View>
            ))}
          </View>
        )}

        {/* Result */}
        {!isGenerating && currentMealPlan && (
          <MealPlanView
            mealPlan={currentMealPlan}
            styles={styles}
            onSave={handleSave}
            saved={saved}
          />
        )}

        {/* Empty state */}
        {!isGenerating && !currentMealPlan && (
          <EmptyState
            emoji='🗓️'
            title='No meal plan yet'
            message='Pick your meals and preferences above, then generate a personalized week of meals.'
          />
        )}
      </ScrollView>
    </View>
  );
}

function MealPlanView({
  mealPlan,
  styles,
  onSave,
  saved,
}: {
  mealPlan: MealPlan;
  styles: ReturnType<typeof createStyles>;
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <View>
      {mealPlan.totalNutrition && (
        <FadeSlideIn>
          <PantryCard variant='warm' padding='lg'>
            <Text style={styles.sectionTitle}>📊 Weekly Nutrition</Text>
            <View style={styles.nutritionGrid}>
              {[
                ['Calories', `${Math.round(mealPlan.totalNutrition.calories)}`],
                ['Protein', `${Math.round(mealPlan.totalNutrition.protein)}g`],
                ['Carbs', `${Math.round(mealPlan.totalNutrition.carbs)}g`],
                ['Fat', `${Math.round(mealPlan.totalNutrition.fat)}g`],
              ].map(([label, value]) => (
                <View key={label} style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{value}</Text>
                  <Text style={styles.nutritionLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </PantryCard>
        </FadeSlideIn>
      )}

      {DAYS_OF_WEEK.map((day, index) => {
        const dayMeals = mealPlan.meals[day];
        if (!dayMeals) return null;
        const hasAnyMeal =
          dayMeals.breakfast ||
          dayMeals.lunch ||
          dayMeals.dinner ||
          (dayMeals.snacks && dayMeals.snacks.length > 0);
        if (!hasAnyMeal) return null;

        return (
          <FadeSlideIn key={day} delay={Math.min(index, 6) * 60}>
            <PantryCard variant='default' padding='lg'>
              <Text style={styles.dayTitle}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </Text>
              {MEAL_SLOTS.map(slot => {
                const meal = dayMeals[slot.key];
                if (!meal) return null;
                return (
                  <View key={slot.key} style={styles.mealRow}>
                    <Text style={styles.mealIcon}>{slot.icon}</Text>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealTitle} numberOfLines={2}>
                        {meal.recipeTitle}
                      </Text>
                      <Text style={styles.mealMeta}>
                        {meal.servings} serving
                        {meal.servings === 1 ? '' : 's'}
                        {meal.nutrition
                          ? ` · ${Math.round(meal.nutrition.calories)} cal`
                          : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
              {dayMeals.snacks && dayMeals.snacks.length > 0 && (
                <View style={styles.mealRow}>
                  <Text style={styles.mealIcon}>🍎</Text>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealTitle}>
                      {dayMeals.snacks.map(s => s.recipeTitle).join(', ')}
                    </Text>
                    <Text style={styles.mealMeta}>Snacks</Text>
                  </View>
                </View>
              )}
            </PantryCard>
          </FadeSlideIn>
        );
      })}

      <PantryButton
        title={saved ? '✓ Saved' : 'Save Meal Plan'}
        onPress={onSave}
        variant={saved ? 'success' : 'secondary'}
        size='lg'
        disabled={saved}
        fullWidth
        style={styles.saveButton}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    chip: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.pill,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
    },
    chipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipText: {
      ...typography.bodySmall,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    chipTextActive: {
      color: '#fff',
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    dayTitle: {
      ...typography.h4,
      color: theme.colors.primary,
      marginBottom: spacing.sm,
    },
    mealIcon: {
      fontSize: 22,
      marginRight: spacing.sm,
    },
    mealInfo: {
      flex: 1,
    },
    mealMeta: {
      ...typography.caption,
      color: theme.colors.textMuted,
    },
    mealRow: {
      alignItems: 'center',
      borderTopColor: theme.colors.divider,
      borderTopWidth: 1,
      flexDirection: 'row',
      paddingVertical: spacing.sm,
    },
    mealTitle: {
      ...typography.body,
      color: theme.colors.text,
      fontWeight: '600',
    },
    nutritionGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    nutritionItem: {
      alignItems: 'center',
      flex: 1,
    },
    nutritionLabel: {
      ...typography.caption,
      color: theme.colors.textMuted,
    },
    nutritionValue: {
      ...typography.h4,
      color: theme.colors.text,
      fontWeight: '700',
    },
    optionLabel: {
      ...typography.body,
      color: theme.colors.text,
      fontWeight: '500',
    },
    optionRow: {
      alignItems: 'center',
      borderTopColor: theme.colors.divider,
      borderTopWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    optionSubtitle: {
      ...typography.caption,
      color: theme.colors.textMuted,
    },
    optionTextBox: {
      flex: 1,
      marginRight: spacing.md,
    },
    saveButton: {
      marginTop: spacing.md,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    sectionTitle: {
      ...typography.h4,
      color: theme.colors.text,
      marginBottom: spacing.sm,
    },
    skeletonCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.card,
      borderWidth: 1,
      marginBottom: spacing.sm,
      padding: spacing.md,
    },
    skeletonGap: {
      marginTop: spacing.sm,
    },
    skeletonWrap: {
      marginTop: spacing.md,
    },
    stepper: {
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundSubtle,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.pill,
      borderWidth: 1,
      flexDirection: 'row',
    },
    stepperButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 32,
      width: 34,
    },
    stepperButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 18,
      fontWeight: '600',
    },
    stepperValue: {
      ...typography.body,
      color: theme.colors.primary,
      fontWeight: '700',
      minWidth: 28,
      textAlign: 'center',
    },
    subheading: {
      marginTop: spacing.lg,
    },
  });
