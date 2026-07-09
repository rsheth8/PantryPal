import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import { Recipe } from '../../types';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/designSystem';
import { useMultiUserStore } from '../../store/useMultiUserStore';

type RecipeDetailRouteProp = RouteProp<{
  RecipeDetail: { recipe: Recipe };
}, 'RecipeDetail'>;

export default function RecipeDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RecipeDetailRouteProp>();
  const { recipe } = route.params;
  const { isRecipeFavorited, toggleRecipeFavorite, addMissingIngredientsToShoppingList } = useMultiUserStore();

  const [isFavorite, setIsFavorite] = useState(false);
  const [servings, setServings] = useState(recipe.servings || 4);

  // Ensure recipe has missingIngredients property
  const safeRecipe = {
    ...recipe,
    missingIngredients: recipe.missingIngredients || [],
    canCookNow: recipe.canCookNow || false,
  };

  // Check if recipe is favorited on mount
  useEffect(() => {
    setIsFavorite(isRecipeFavorited(recipe.id));
  }, [recipe.id, isRecipeFavorited]);

  const handleAddToShoppingList = async () => {
    try {
      // Add missing ingredients to shopping list
      const missingIngredients = safeRecipe.missingIngredients;
      
      if (missingIngredients.length === 0) {
        Alert.alert('No Missing Ingredients', 'You have all the ingredients needed for this recipe!');
        return;
      }
      
      const result = await addMissingIngredientsToShoppingList(missingIngredients, safeRecipe.title);
      
      if (result) {
        const { addedCount, updatedCount } = result;
        let message = '';
        
        if (addedCount > 0 && updatedCount > 0) {
          message = `Added ${addedCount} new ingredients and updated ${updatedCount} existing items in your shopping list!`;
        } else if (addedCount > 0) {
          message = `Added ${addedCount} missing ingredients to your shopping list!`;
        } else if (updatedCount > 0) {
          message = `Updated ${updatedCount} existing items in your shopping list!`;
        }

        Alert.alert('Shopping List Updated', message);
      }
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      Alert.alert('Error', 'Failed to add ingredients to shopping list');
    }
  };

  const handleStartCooking = () => {
    Alert.alert(
      'Start Cooking',
      `Ready to cook "${safeRecipe.title}"?`,
      [
        { text: 'Not yet', style: 'cancel' },
        { 
          text: 'Let\'s cook!', 
          onPress: () => {
            navigation.navigate('CookingMode' as never, { recipe: safeRecipe } as never);
          }
        }
      ]
    );
  };

  const toggleFavorite = async () => {
    try {
      await toggleRecipeFavorite(safeRecipe.id);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const adjustServings = (increment: boolean) => {
    const newServings = increment ? servings + 1 : servings - 1;
    if (newServings >= 1 && newServings <= 20) {
      setServings(newServings);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return colors.success;
      case 'medium': return colors.warning;
      case 'hard': return colors.error;
      default: return colors.neutral[500];
    }
  };

  const getTotalTime = () => {
    const prepTime = safeRecipe.prepTime || 0;
    const cookTime = safeRecipe.cookTime || 0;
    return prepTime + cookTime;
  };

  const renderIngredient = (ingredient: string, index: number) => (
    <View key={index} style={styles.ingredientItem}>
      <View style={styles.ingredientBullet} />
      <Text style={styles.ingredientText}>{ingredient}</Text>
    </View>
  );

  const renderInstruction = (instruction: string, index: number) => (
    <View key={index} style={styles.instructionItem}>
      <View style={styles.instructionNumber}>
        <Text style={styles.instructionNumberText}>{index + 1}</Text>
      </View>
      <Text style={styles.instructionText}>{instruction}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <PantryHeader 
        title="Recipe Details" 
        subtitle={safeRecipe.title}
        gradient="berry"
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.contentWrapper}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
        {/* Recipe Image */}
        {safeRecipe.imageUrl && (
          <PantryCard variant="elevated" padding="none" margin="none">
            <Image source={{ uri: safeRecipe.imageUrl }} style={styles.recipeImage} />
          </PantryCard>
        )}

        {/* Recipe Info Cards */}
        <View style={styles.infoCards}>
          <PantryCard variant="fresh" padding="md">
            <View style={styles.recipeStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{getTotalTime()}</Text>
                <Text style={styles.statLabel}>min</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{servings}</Text>
                <Text style={styles.statLabel}>servings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: getDifficultyColor(safeRecipe.difficulty || 'medium') }]}>
                  {safeRecipe.difficulty || 'Medium'}
                </Text>
                <Text style={styles.statLabel}>difficulty</Text>
              </View>
            </View>
          </PantryCard>

          {/* Servings Adjuster */}
          <PantryCard variant="elevated" padding="md">
            <View style={styles.servingsContainer}>
              <Text style={styles.servingsLabel}>Adjust Servings:</Text>
              <View style={styles.servingsControls}>
                <TouchableOpacity 
                  style={styles.servingsButton} 
                  onPress={() => adjustServings(false)}
                  disabled={servings <= 1}
                >
                  <Text style={styles.servingsButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.servingsValue}>{servings}</Text>
                <TouchableOpacity 
                  style={styles.servingsButton} 
                  onPress={() => adjustServings(true)}
                  disabled={servings >= 20}
                >
                  <Text style={styles.servingsButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </PantryCard>
        </View>

        {/* Recipe Description */}
        {safeRecipe.description && (
          <PantryCard variant="fresh" padding="md">
            <Text style={styles.sectionTitle}>About this Recipe</Text>
            <Text style={styles.descriptionText}>{safeRecipe.description}</Text>
          </PantryCard>
        )}

        {/* Ingredients */}
        <PantryCard variant="elevated" padding="md">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.sectionSubtitle}>
              {safeRecipe.ingredients.length} ingredients
              {safeRecipe.missingIngredients.length > 0 && ` • ${safeRecipe.missingIngredients.length} missing`}
            </Text>
          </View>
          
          {/* Missing Ingredients Warning */}
          {safeRecipe.missingIngredients.length > 0 && (
            <View style={styles.missingIngredientsWarning}>
              <Text style={styles.missingIngredientsTitle}>❌ Missing Ingredients:</Text>
              <View style={styles.missingIngredientsList}>
                {safeRecipe.missingIngredients.map((ingredient: string, index: number) => (
                  <Text key={index} style={styles.missingIngredient}>
                    • {ingredient}
                  </Text>
                ))}
              </View>
              <PantryButton
                title="🛒 Add Missing to Shopping List"
                onPress={handleAddToShoppingList}
                variant="secondary"
                size="sm"
                fullWidth
              />
            </View>
          )}
          
          <View style={styles.ingredientsList}>
            {safeRecipe.ingredients.map(renderIngredient)}
          </View>
        </PantryCard>

        {/* Instructions */}
        <PantryCard variant="fresh" padding="md">
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.sectionSubtitle}>
              {safeRecipe.instructions.length} steps
            </Text>
          </View>
          <View style={styles.instructionsList}>
            {safeRecipe.instructions.map(renderInstruction)}
          </View>
        </PantryCard>

        {/* Nutrition Info */}
        {safeRecipe.nutrition && (
          <PantryCard variant="elevated" padding="md">
            <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{safeRecipe.nutrition.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{safeRecipe.nutrition.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{safeRecipe.nutrition.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{safeRecipe.nutrition.fat}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </PantryCard>
        )}

        {/* Tags */}
        {safeRecipe.tags && safeRecipe.tags.length > 0 && (
          <PantryCard variant="fresh" padding="md">
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {safeRecipe.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </PantryCard>
        )}

        {/* Action Buttons */}
        <View style={[styles.actionButtons, { backgroundColor: colors.neutral[50] }]}>
          <PantryButton
            title="❤️ Favorite"
            onPress={toggleFavorite}
            variant={isFavorite ? "primary" : "outline"}
            size="lg"
            fullWidth
          />
          <View style={styles.actionRow}>
            <PantryButton
              title="🛒 Add to Shopping List"
              onPress={handleAddToShoppingList}
              variant="secondary"
              size="md"
              fullWidth
            />
            <PantryButton
              title="👨‍🍳 Start Cooking"
              onPress={handleStartCooking}
              variant="accent"
              size="md"
              fullWidth
            />
          </View>
        </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.xxl || 100,
    minHeight: '100%',
    backgroundColor: colors.neutral[50],
  },
  recipeImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
  },
  infoCards: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  recipeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.primary[600],
    fontWeight: '700',
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.neutral[600],
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.neutral[300],
  },
  servingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servingsLabel: {
    ...typography.bodyMedium,
    color: colors.neutral[700],
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  servingsButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsButtonText: {
    ...typography.h4,
    color: colors.primary[600],
    fontWeight: '700',
  },
  servingsValue: {
    ...typography.h3,
    color: colors.primary[600],
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.neutral[800],
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.neutral[600],
  },
  descriptionText: {
    ...typography.bodyMedium,
    color: colors.neutral[700],
    lineHeight: 24,
  },
  ingredientsList: {
    gap: spacing.sm,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    marginTop: 8,
  },
  ingredientText: {
    ...typography.bodyMedium,
    color: colors.neutral[700],
    flex: 1,
    lineHeight: 22,
  },
  instructionsList: {
    gap: spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  instructionNumberText: {
    ...typography.bodySmall,
    color: '#fff',
    fontWeight: '600',
  },
  instructionText: {
    ...typography.bodyMedium,
    color: colors.neutral[700],
    flex: 1,
    lineHeight: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  nutritionItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  nutritionValue: {
    ...typography.h4,
    color: colors.primary[600],
    fontWeight: '700',
  },
  nutritionLabel: {
    ...typography.bodySmall,
    color: colors.neutral[600],
    marginTop: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    ...typography.bodySmall,
    color: colors.primary[600],
    fontWeight: '500',
  },
  actionButtons: {
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl || 80,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  missingIngredientsWarning: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.warning[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  missingIngredientsTitle: {
    ...typography.bodyMedium,
    color: colors.warning[700],
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  missingIngredientsList: {
    marginBottom: spacing.md,
  },
  missingIngredient: {
    ...typography.bodyMedium,
    color: colors.warning[600],
    marginBottom: spacing.xs,
  },
});
