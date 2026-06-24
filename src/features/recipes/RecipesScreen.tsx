import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import { recipeService } from '../../services/recipeService';
import { Recipe } from '../../types';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import { useTheme, ThemeColors } from '../../theme';

export default function RecipesScreen() {
  const { recipes, pantry, addRecipe } = useMultiUserStore();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'canCook' | 'favorites'
  >('all');
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Discovery state
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<Recipe[]>([]);

  // Add-recipe form state
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState('');
  const [recipeServings, setRecipeServings] = useState('2');
  const [recipePrep, setRecipePrep] = useState('10');
  const [recipeCook, setRecipeCook] = useState('20');

  const handleRecipePress = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleAddRecipe = () => {
    setShowAddModal(true);
  };

  const resetRecipeForm = () => {
    setRecipeTitle('');
    setRecipeIngredients('');
    setRecipeInstructions('');
    setRecipeServings('2');
    setRecipePrep('10');
    setRecipeCook('20');
  };

  const handleSaveRecipe = async () => {
    if (!recipeTitle.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return;
    }
    const ingredients = recipeIngredients
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    const instructions = recipeInstructions
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    await addRecipe({
      title: recipeTitle.trim(),
      ingredients,
      instructions,
      prepTime: parseInt(recipePrep) || 0,
      cookTime: parseInt(recipeCook) || 0,
      servings: parseInt(recipeServings) || 1,
      canCookNow: false,
      missingIngredients: [],
      tags: [],
      isShared: true,
    });

    resetRecipeForm();
    setShowAddModal(false);
  };

  const handleRecipeDiscovery = () => {
    setShowDiscoveryModal(true);
  };

  const runDiscovery = async (mode: 'pantry' | 'query' | 'random') => {
    setDiscoveryLoading(true);
    setDiscoveryResults([]);
    try {
      let results: Recipe[] = [];
      if (mode === 'random') {
        results = await recipeService.getRandomRecipes(8);
      } else {
        const ingredients =
          mode === 'pantry'
            ? pantry.map(item => item.name)
            : discoveryQuery
                .split(',')
                .map(part => part.trim())
                .filter(Boolean);
        if (ingredients.length === 0) {
          Alert.alert(
            'Recipe Discovery',
            mode === 'pantry'
              ? 'Your pantry is empty — add some items first.'
              : 'Enter at least one ingredient.'
          );
          return;
        }
        results = await recipeService.searchRecipesByIngredients(ingredients);
      }
      setDiscoveryResults(results);
    } catch (error) {
      console.error('Recipe discovery failed:', error);
      Alert.alert('Recipe Discovery', 'Could not load recipes right now.');
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const handleAddDiscovered = async (recipe: Recipe) => {
    await addRecipe(recipe);
    setDiscoveryResults(prev => prev.filter(item => item !== recipe));
    Alert.alert('Added', `${recipe.title} added to your recipes`);
  };

  const handleFilterChange = (filter: 'all' | 'canCook' | 'favorites') => {
    setSelectedFilter(filter);
  };

  // Filter recipes based on search and selected filter
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch =
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.tags.some((tag: string) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    switch (selectedFilter) {
      case 'canCook':
        return matchesSearch && recipe.canCookNow;
      case 'favorites':
        return matchesSearch && recipe.isFavorite;
      default:
        return matchesSearch;
    }
  });

  const renderRecipeCard = ({ item }: { item: any }) => (
    <PantryCard variant='default' padding='md'>
      <TouchableOpacity
        onPress={() => handleRecipePress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.recipeHeader}>
          <View style={styles.recipeInfo}>
            <Text style={styles.recipeTitle}>{item.title}</Text>
            <View style={styles.recipeMeta}>
              <Text style={styles.recipeTime}>
                ⏱️ {item.prepTime + item.cookTime} min
              </Text>
              <Text style={styles.recipeServings}>
                👥 {item.servings} servings
              </Text>
            </View>
          </View>
          <View style={styles.recipeStatus}>
            {item.canCookNow ? (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>🍳 Can Cook</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.missingBadge]}>
                <Text style={styles.missingText}>
                  ❌ {item.missingIngredients.length} missing
                </Text>
              </View>
            )}
          </View>
        </View>

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag: string, index: number) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={styles.moreTags}>+{item.tags.length - 3} more</Text>
            )}
          </View>
        )}

        <View style={styles.recipeActions}>
          <PantryButton
            title='View'
            onPress={() => handleRecipePress(item)}
            variant='outline'
            size='sm'
          />
          <PantryButton
            title='Cook'
            onPress={() =>
              Alert.alert('Cook Recipe', `Start cooking ${item.title}`)
            }
            variant='primary'
            size='sm'
            disabled={!item.canCookNow}
          />
        </View>
      </TouchableOpacity>
    </PantryCard>
  );

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Recipes'
        subtitle='Discover and cook delicious meals'
        gradient='sunset'
        rightAction={{
          icon: '➕',
          onPress: handleAddRecipe,
        }}
      />

      <View style={styles.content}>
        {/* Search and Discovery */}
        <PantryCard variant='elevated' padding='md' margin='none'>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder='Search recipes, ingredients, or tags...'
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.neutral[400]}
            />
            <PantryButton
              title='Discover'
              onPress={handleRecipeDiscovery}
              variant='secondary'
              size='sm'
            />
          </View>
        </PantryCard>

        {/* Quick Filters */}
        <PantryCard variant='fresh' padding='md'>
          <Text style={styles.sectionTitle}>🔍 Quick Filters</Text>
          <View style={styles.filterContainer}>
            {[
              { key: 'all', label: 'All Recipes', count: recipes.length },
              {
                key: 'canCook',
                label: 'Can Cook Now',
                count: recipes.filter(r => r.canCookNow).length,
              },
              {
                key: 'favorites',
                label: 'Favorites',
                count: recipes.filter(r => r.isFavorite).length,
              },
            ].map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  selectedFilter === filter.key && styles.filterChipActive,
                ]}
                onPress={() => handleFilterChange(filter.key as any)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === filter.key &&
                      styles.filterChipTextActive,
                  ]}
                >
                  {filter.label} ({filter.count})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </PantryCard>

        {/* Recipe Stats */}
        <PantryCard variant='warm' padding='md'>
          <Text style={styles.sectionTitle}>📊 Recipe Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{recipes.length}</Text>
              <Text style={styles.statLabel}>Total Recipes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {recipes.filter(r => r.canCookNow).length}
              </Text>
              <Text style={styles.statLabel}>Can Cook Now</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {recipes.filter(r => r.isFavorite).length}
              </Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {recipes.filter(r => r.missingIngredients.length > 0).length}
              </Text>
              <Text style={styles.statLabel}>Need Ingredients</Text>
            </View>
          </View>
        </PantryCard>

        {/* Recipes List */}
        <View style={styles.recipesContainer}>
          {filteredRecipes.length > 0 ? (
            <FlatList
              data={filteredRecipes}
              renderItem={renderRecipeCard}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <PantryCard variant='outlined' padding='xl'>
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📖</Text>
                <Text style={styles.emptyStateText}>No recipes found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Add your first recipe to get started!'}
                </Text>
                <PantryButton
                  title='Add First Recipe'
                  onPress={handleAddRecipe}
                  variant='primary'
                  size='md'
                  fullWidth
                />
              </View>
            </PantryCard>
          )}
        </View>
      </View>

      {/* Recipe Discovery Modal */}
      <Modal
        visible={showDiscoveryModal}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <View style={styles.modalContainer}>
          <PantryHeader
            title='Recipe Discovery'
            subtitle='Find recipes based on your ingredients'
            gradient='primary'
            showBackButton
            onBackPress={() => setShowDiscoveryModal(false)}
          />

          <ScrollView style={styles.modalContent}>
            <PantryCard variant='elevated' padding='lg'>
              <TextInput
                style={styles.formInput}
                placeholder='Ingredients, comma separated (e.g., eggs, rice)'
                value={discoveryQuery}
                onChangeText={setDiscoveryQuery}
                placeholderTextColor={colors.neutral[400]}
              />
              <View style={styles.discoveryButtons}>
                <PantryButton
                  title='Search'
                  onPress={() => runDiscovery('query')}
                  variant='primary'
                  size='sm'
                />
                <PantryButton
                  title='From My Pantry'
                  onPress={() => runDiscovery('pantry')}
                  variant='outline'
                  size='sm'
                />
                <PantryButton
                  title='Surprise Me'
                  onPress={() => runDiscovery('random')}
                  variant='outline'
                  size='sm'
                />
              </View>
            </PantryCard>

            {discoveryLoading ? (
              <PantryCard variant='outlined' padding='xl'>
                <ActivityIndicator size='large' color={colors.primary[500]} />
                <Text style={styles.loadingText}>Finding recipes…</Text>
              </PantryCard>
            ) : discoveryResults.length === 0 ? (
              <PantryCard variant='outlined' padding='lg'>
                <Text style={styles.helperText}>
                  Search by ingredient, use your pantry, or get a surprise to
                  discover new recipes.
                </Text>
              </PantryCard>
            ) : (
              discoveryResults.map((recipe, index) => (
                <PantryCard
                  key={`${recipe.id}-${index}`}
                  variant='default'
                  padding='md'
                >
                  <View style={styles.resultRow}>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultName}>{recipe.title}</Text>
                      <Text style={styles.resultMeta}>
                        {recipe.ingredients.length} ingredients
                        {recipe.missingIngredients.length > 0
                          ? ` · ${recipe.missingIngredients.length} missing`
                          : ''}
                      </Text>
                    </View>
                    <PantryButton
                      title='Add'
                      onPress={() => handleAddDiscovered(recipe)}
                      variant='success'
                      size='sm'
                    />
                  </View>
                </PantryCard>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Add Recipe Modal */}
      <Modal
        visible={showAddModal}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <View style={styles.modalContainer}>
          <PantryHeader
            title='Add Recipe'
            subtitle='Create your own recipe'
            gradient='sunset'
            showBackButton
            onBackPress={() => {
              resetRecipeForm();
              setShowAddModal(false);
            }}
          />

          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps='handled'
          >
            <PantryCard variant='elevated' padding='lg'>
              <Text style={styles.formLabel}>Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder='e.g., Veggie Stir Fry'
                value={recipeTitle}
                onChangeText={setRecipeTitle}
                placeholderTextColor={colors.neutral[400]}
              />

              <Text style={styles.formLabel}>Ingredients (one per line)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder={'2 eggs\n1 cup rice\n1 tbsp soy sauce'}
                value={recipeIngredients}
                onChangeText={setRecipeIngredients}
                multiline
                placeholderTextColor={colors.neutral[400]}
              />

              <Text style={styles.formLabel}>Instructions (one per line)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder={'Heat oil\nAdd rice\nStir in eggs'}
                value={recipeInstructions}
                onChangeText={setRecipeInstructions}
                multiline
                placeholderTextColor={colors.neutral[400]}
              />

              <Text style={styles.formLabel}>Servings</Text>
              <TextInput
                style={styles.formInput}
                placeholder='2'
                value={recipeServings}
                onChangeText={setRecipeServings}
                keyboardType='numeric'
                placeholderTextColor={colors.neutral[400]}
              />

              <Text style={styles.formLabel}>Prep time (min)</Text>
              <TextInput
                style={styles.formInput}
                placeholder='10'
                value={recipePrep}
                onChangeText={setRecipePrep}
                keyboardType='numeric'
                placeholderTextColor={colors.neutral[400]}
              />

              <Text style={styles.formLabel}>Cook time (min)</Text>
              <TextInput
                style={styles.formInput}
                placeholder='20'
                value={recipeCook}
                onChangeText={setRecipeCook}
                keyboardType='numeric'
                placeholderTextColor={colors.neutral[400]}
              />

              <View style={styles.recipeActions}>
                <PantryButton
                  title='Cancel'
                  onPress={() => {
                    resetRecipeForm();
                    setShowAddModal(false);
                  }}
                  variant='outline'
                  size='md'
                />
                <PantryButton
                  title='Save Recipe'
                  onPress={handleSaveRecipe}
                  variant='primary'
                  size='md'
                />
              </View>
            </PantryCard>
          </ScrollView>
        </View>
      </Modal>

      {/* Recipe Detail Modal */}
      <Modal
        visible={selectedRecipe !== null}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <View style={styles.modalContainer}>
          <PantryHeader
            title={selectedRecipe?.title ?? 'Recipe'}
            subtitle='Recipe details'
            gradient='sunset'
            showBackButton
            onBackPress={() => setSelectedRecipe(null)}
          />
          <ScrollView style={styles.modalContent}>
            <PantryCard variant='elevated' padding='lg'>
              <Text style={styles.detailMeta}>
                ⏱️{' '}
                {(selectedRecipe?.prepTime ?? 0) +
                  (selectedRecipe?.cookTime ?? 0)}{' '}
                min · 👥 {selectedRecipe?.servings ?? 1} servings
              </Text>

              <Text style={styles.detailHeading}>Ingredients</Text>
              {(selectedRecipe?.ingredients ?? []).length > 0 ? (
                selectedRecipe?.ingredients.map((ingredient, index) => (
                  <Text key={index} style={styles.detailText}>
                    • {ingredient}
                  </Text>
                ))
              ) : (
                <Text style={styles.detailText}>No ingredients listed.</Text>
              )}

              <Text style={styles.detailHeading}>Instructions</Text>
              {(selectedRecipe?.instructions ?? []).length > 0 ? (
                selectedRecipe?.instructions.map((step, index) => (
                  <Text key={index} style={styles.detailText}>
                    {index + 1}. {step}
                  </Text>
                ))
              ) : (
                <Text style={styles.detailText}>No instructions listed.</Text>
              )}

              <View style={styles.recipeActions}>
                <PantryButton
                  title='Close'
                  onPress={() => setSelectedRecipe(null)}
                  variant='primary'
                  size='md'
                  fullWidth
                />
              </View>
            </PantryCard>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.neutral[50],
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    detailHeading: {
      ...typography.h4,
      color: colors.neutral[800],
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    detailMeta: {
      ...typography.bodySmall,
      color: colors.neutral[600],
      marginBottom: spacing.sm,
    },
    detailText: {
      ...typography.body,
      color: colors.neutral[700],
      marginBottom: spacing.xs,
    },
    discoveryButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
    },
    emptyStateIcon: {
      fontSize: 64,
      marginBottom: spacing.md,
    },
    emptyStateSubtext: {
      ...typography.bodySmall,
      color: colors.neutral[500],
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    emptyStateText: {
      ...typography.h4,
      color: colors.neutral[600],
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    filterChip: {
      backgroundColor: colors.neutral[100],
      borderColor: colors.neutral[200],
      borderRadius: borderRadius.pill,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    filterChipActive: {
      backgroundColor: colors.primary[500],
      borderColor: colors.primary[500],
    },
    filterChipText: {
      ...typography.bodySmall,
      color: colors.neutral[700],
      fontWeight: '500',
    },
    filterChipTextActive: {
      color: '#fff',
    },
    filterContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    formInput: {
      backgroundColor: colors.neutral[100],
      borderColor: colors.neutral[200],
      borderRadius: borderRadius.input,
      borderWidth: 1,
      color: colors.neutral[900],
      fontSize: 16,
      marginBottom: spacing.sm,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    formLabel: {
      ...typography.bodySmall,
      color: colors.neutral[700],
      fontWeight: '600',
      marginBottom: spacing.xs,
      marginTop: spacing.sm,
    },
    formTextArea: {
      height: 90,
      textAlignVertical: 'top',
    },
    helperText: {
      ...typography.bodySmall,
      color: colors.neutral[600],
      textAlign: 'center',
    },
    listContent: {
      paddingBottom: spacing.xl,
    },
    loadingText: {
      ...typography.body,
      color: colors.neutral[600],
      marginTop: spacing.md,
      textAlign: 'center',
    },
    missingBadge: {
      backgroundColor: `${colors.warning}20`,
    },
    missingText: {
      ...typography.caption,
      color: colors.warning,
      fontWeight: '600',
    },
    modalContainer: {
      backgroundColor: colors.neutral[50],
      flex: 1,
    },
    modalContent: {
      flex: 1,
      padding: spacing.md,
    },
    moreTags: {
      ...typography.caption,
      alignSelf: 'center',
      color: colors.neutral[500],
    },
    recipeActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    recipeHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    recipeInfo: {
      flex: 1,
    },
    recipeMeta: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    recipeServings: {
      ...typography.bodySmall,
      color: colors.neutral[600],
    },
    recipeStatus: {
      alignItems: 'flex-end',
    },
    recipeTime: {
      ...typography.bodySmall,
      color: colors.neutral[600],
    },
    recipeTitle: {
      ...typography.body,
      color: colors.neutral[800],
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    recipesContainer: {
      flex: 1,
      padding: spacing.md,
    },
    resultInfo: {
      flex: 1,
    },
    resultMeta: {
      ...typography.bodySmall,
      color: colors.neutral[600],
    },
    resultName: {
      ...typography.body,
      color: colors.neutral[800],
      fontWeight: '600',
    },
    resultRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    searchContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
    },
    searchInput: {
      backgroundColor: colors.neutral[100],
      borderColor: colors.neutral[200],
      borderRadius: borderRadius.input,
      borderWidth: 1,
      color: colors.neutral[900],
      flex: 1,
      fontSize: 16,
      height: 44,
      paddingHorizontal: spacing.md,
    },
    sectionTitle: {
      ...typography.h4,
      color: colors.neutral[800],
      marginBottom: spacing.md,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statLabel: {
      ...typography.caption,
      color: colors.neutral[600],
      textAlign: 'center',
    },
    statValue: {
      ...typography.h3,
      color: colors.neutral[900],
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statusBadge: {
      backgroundColor: `${colors.success}20`,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    statusText: {
      ...typography.caption,
      color: colors.success,
      fontWeight: '600',
    },
    tag: {
      backgroundColor: colors.primary[100],
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    tagText: {
      ...typography.caption,
      color: colors.primary[700],
      fontWeight: '500',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
  });
