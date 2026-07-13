import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  AnimatedPressable,
  FadeSlideIn,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles, useTheme } from '../../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import { haptics } from '../../utils/haptics';
import { recipeService } from '../../services/recipeService';
import { scaleIngredients } from '../../utils/recipeScaling';
import CookingModeModal from './CookingModeModal';
import { Recipe } from '../../types';

// Live ingredient availability against the current pantry.
function getAvailability(
  recipe: Recipe,
  pantryNames: string[]
): { canCook: boolean; missing: string[]; have: string[] } {
  const have: string[] = [];
  const missing: string[] = [];
  for (const ingredient of recipe.ingredients ?? []) {
    const normalized = ingredient.toLowerCase().trim();
    const available = pantryNames.some(
      name => name.includes(normalized) || normalized.includes(name)
    );
    if (available) have.push(ingredient);
    else missing.push(ingredient);
  }
  return { canCook: missing.length === 0, missing, have };
}

interface RecipeFormState {
  title: string;
  ingredients: string;
  instructions: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  tags: string;
}

const emptyRecipeForm: RecipeFormState = {
  title: '',
  ingredients: '',
  instructions: '',
  prepTime: '',
  cookTime: '',
  servings: '4',
  tags: '',
};

export default function RecipesScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const { showToast } = useToast();
  const {
    recipes,
    pantry,
    addRecipe,
    updateRecipe,
    removeRecipe,
    addShoppingListItem,
  } = useMultiUserStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'canCook' | 'favorites'
  >('all');
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);
  const [detailServings, setDetailServings] = useState(4);
  const [cooking, setCooking] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<RecipeFormState>(emptyRecipeForm);
  const [saving, setSaving] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState<Recipe[]>([]);

  const pantryNames = useMemo(
    () =>
      pantry
        .filter(item => !item.isUsed && !item.isExpired)
        .map(item => item.name.toLowerCase().trim()),
    [pantry]
  );

  const enriched = useMemo(
    () =>
      recipes.map(recipe => {
        const availability = getAvailability(recipe, pantryNames);
        return { recipe, availability };
      }),
    [recipes, pantryNames]
  );

  const filteredRecipes = useMemo(
    () =>
      enriched.filter(({ recipe, availability }) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          recipe.title.toLowerCase().includes(q) ||
          (recipe.tags ?? []).some(tag => tag.toLowerCase().includes(q));
        switch (selectedFilter) {
          case 'canCook':
            return matchesSearch && availability.canCook;
          case 'favorites':
            return matchesSearch && recipe.isFavorite;
          default:
            return matchesSearch;
        }
      }),
    [enriched, searchQuery, selectedFilter]
  );

  const canCookCount = enriched.filter(e => e.availability.canCook).length;
  const favoriteCount = recipes.filter(r => r.isFavorite).length;

  const openDetail = (recipe: Recipe) => {
    setDetailServings(
      recipe.servings && recipe.servings > 0 ? recipe.servings : 4
    );
    setDetailRecipe(recipe);
  };

  const handleToggleFavorite = (recipe: Recipe) => {
    haptics.light();
    updateRecipe(recipe.id, { isFavorite: !recipe.isFavorite });
    // Keep the open detail modal in sync.
    setDetailRecipe(prev =>
      prev && prev.id === recipe.id
        ? { ...prev, isFavorite: !recipe.isFavorite }
        : prev
    );
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    Alert.alert('Delete recipe', `Delete "${recipe.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeRecipe(recipe.id);
          setDetailRecipe(null);
          showToast(`Deleted ${recipe.title}`, { type: 'info' });
        },
      },
    ]);
  };

  const handleAddMissingToList = async (recipe: Recipe) => {
    const { missing } = getAvailability(recipe, pantryNames);
    if (missing.length === 0) {
      showToast('You have everything you need! 🎉', { type: 'success' });
      return;
    }
    for (const ingredient of missing) {
      await addShoppingListItem({
        name: ingredient,
        quantity: 1,
        unit: 'pcs',
        category: 'Other',
        notes: `For: ${recipe.title}`,
        isShared: true,
      });
    }
    showToast(
      `Added ${missing.length} ingredient${missing.length === 1 ? '' : 's'} to shopping list`,
      { type: 'success' }
    );
  };

  const handleSaveRecipe = async () => {
    const title = form.title.trim();
    const ingredients = form.ingredients
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    if (!title || ingredients.length === 0) {
      showToast('A title and at least one ingredient are required', {
        type: 'warning',
      });
      return;
    }
    const instructions = form.instructions
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    const tags = form.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      await addRecipe(
        {
          title,
          ingredients,
          instructions,
          prepTime: parseInt(form.prepTime) || undefined,
          cookTime: parseInt(form.cookTime) || undefined,
          servings: parseInt(form.servings) || undefined,
          canCookNow: false,
          missingIngredients: [],
          tags,
          isShared: true,
        },
        true
      );
      setShowAddModal(false);
      setForm(emptyRecipeForm);
      showToast(`Saved "${title}"`, { type: 'success' });
    } catch {
      showToast('Could not save recipe', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscover = async () => {
    setShowDiscovery(true);
    setDiscovering(true);
    try {
      const names = pantry
        .filter(item => !item.isUsed && !item.isExpired)
        .map(item => item.name);
      const results =
        names.length > 0
          ? await recipeService.searchRecipesByAvailableIngredients(names)
          : await recipeService.getRandomRecipes(8);
      setDiscovered(results);
    } catch {
      setDiscovered([]);
    } finally {
      setDiscovering(false);
    }
  };

  const handleSaveDiscovered = async (recipe: Recipe) => {
    await addRecipe(
      {
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        image: recipe.image,
        canCookNow: recipe.canCookNow,
        missingIngredients: recipe.missingIngredients,
        tags: recipe.tags,
        isShared: true,
        nutrition: recipe.nutrition,
      },
      true
    );
    showToast(`Saved "${recipe.title}" to your collection`, {
      type: 'success',
    });
  };

  const renderRecipeCard = ({
    item,
    index,
  }: {
    item: { recipe: Recipe; availability: ReturnType<typeof getAvailability> };
    index: number;
  }) => {
    const { recipe, availability } = item;
    return (
      <FadeSlideIn delay={Math.min(index, 8) * 50}>
        <AnimatedPressable onPress={() => openDetail(recipe)}>
          <PantryCard variant='default' padding='md'>
            <View style={styles.recipeHeader}>
              <View style={styles.recipeInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.recipeTitle} numberOfLines={1}>
                    {recipe.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleToggleFavorite(recipe)}
                    style={styles.favoriteButton}
                    accessibilityLabel={
                      recipe.isFavorite ? 'Remove favorite' : 'Add favorite'
                    }
                  >
                    <Text style={styles.favoriteIcon}>
                      {recipe.isFavorite ? '⭐' : '☆'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.recipeMeta}>
                  {(recipe.prepTime || recipe.cookTime) && (
                    <Text style={styles.recipeMetaText}>
                      ⏱️ {(recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)} min
                    </Text>
                  )}
                  {recipe.servings ? (
                    <Text style={styles.recipeMetaText}>
                      👥 {recipe.servings}
                    </Text>
                  ) : null}
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: availability.canCook
                          ? theme.colors.successSoft
                          : theme.colors.warningSoft,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: availability.canCook
                            ? theme.colors.success
                            : theme.colors.warning,
                        },
                      ]}
                    >
                      {availability.canCook
                        ? '🍳 Can cook now'
                        : `${availability.missing.length} missing`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {recipe.tags && recipe.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {recipe.tags.slice(0, 3).map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
                {recipe.tags.length > 3 && (
                  <Text style={styles.moreTags}>+{recipe.tags.length - 3}</Text>
                )}
              </View>
            )}
          </PantryCard>
        </AnimatedPressable>
      </FadeSlideIn>
    );
  };

  const detailAvailability = detailRecipe
    ? getAvailability(detailRecipe, pantryNames)
    : null;

  const baseServings =
    detailRecipe?.servings && detailRecipe.servings > 0
      ? detailRecipe.servings
      : 4;
  const scaledIngredients = detailRecipe
    ? scaleIngredients(detailRecipe.ingredients, baseServings, detailServings)
    : [];

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Recipes'
        subtitle={
          canCookCount > 0
            ? `You can cook ${canCookCount} recipe${canCookCount === 1 ? '' : 's'} right now`
            : 'Discover and cook delicious meals'
        }
        gradient='sunset'
        rightAction={{ icon: '➕', onPress: () => setShowAddModal(true) }}
      />

      <View style={styles.content}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder='Search recipes or tags...'
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType='search'
          />
          <PantryButton
            title='Discover'
            onPress={handleDiscover}
            variant='secondary'
            size='md'
            icon='✨'
          />
        </View>

        <View style={styles.filterRow}>
          {(
            [
              { key: 'all', label: `All (${recipes.length})` },
              { key: 'canCook', label: `Can cook (${canCookCount})` },
              { key: 'favorites', label: `⭐ (${favoriteCount})` },
            ] as const
          ).map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                selectedFilter === filter.key && styles.filterChipActive,
              ]}
              onPress={() => {
                haptics.selection();
                setSelectedFilter(filter.key);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filter.key && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredRecipes.length > 0 ? (
          <FlatList
            data={filteredRecipes}
            renderItem={renderRecipeCard}
            keyExtractor={item => item.recipe.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <EmptyState
            emoji='📖'
            title={searchQuery ? 'No recipes found' : 'No recipes yet'}
            message={
              searchQuery
                ? 'Try a different search or filter.'
                : 'Add your own recipe, or let PantryPal suggest meals from what you have.'
            }
            actionLabel={searchQuery ? undefined : 'Discover Recipes'}
            onAction={handleDiscover}
          />
        )}
      </View>

      {/* Recipe detail modal */}
      <Modal
        visible={detailRecipe !== null}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setDetailRecipe(null)}
      >
        {detailRecipe && (
          <View style={styles.modalContainer}>
            <PantryHeader
              title={detailRecipe.title}
              subtitle={
                detailAvailability?.canCook
                  ? 'You can cook this now! 🎉'
                  : `Missing ${detailAvailability?.missing.length} ingredient${detailAvailability?.missing.length === 1 ? '' : 's'}`
              }
              gradient='sunset'
              showBackButton
              onBackPress={() => setDetailRecipe(null)}
              rightAction={{
                icon: detailRecipe.isFavorite ? '⭐' : '☆',
                onPress: () => handleToggleFavorite(detailRecipe),
              }}
            />
            <ScrollView style={styles.modalContent}>
              {detailRecipe.image ? (
                <Image
                  source={{ uri: detailRecipe.image }}
                  style={styles.detailImage}
                />
              ) : null}

              <View style={styles.detailMetaRow}>
                {detailRecipe.prepTime != null && (
                  <View style={styles.detailMetaItem}>
                    <Text style={styles.detailMetaValue}>
                      {detailRecipe.prepTime}m
                    </Text>
                    <Text style={styles.detailMetaLabel}>Prep</Text>
                  </View>
                )}
                {detailRecipe.cookTime != null && (
                  <View style={styles.detailMetaItem}>
                    <Text style={styles.detailMetaValue}>
                      {detailRecipe.cookTime}m
                    </Text>
                    <Text style={styles.detailMetaLabel}>Cook</Text>
                  </View>
                )}
                {detailRecipe.servings != null && (
                  <View style={styles.detailMetaItem}>
                    <Text style={styles.detailMetaValue}>
                      {detailRecipe.servings}
                    </Text>
                    <Text style={styles.detailMetaLabel}>Serves</Text>
                  </View>
                )}
                {detailRecipe.nutrition?.calories != null && (
                  <View style={styles.detailMetaItem}>
                    <Text style={styles.detailMetaValue}>
                      {Math.round(detailRecipe.nutrition.calories)}
                    </Text>
                    <Text style={styles.detailMetaLabel}>Cal</Text>
                  </View>
                )}
              </View>

              <View style={styles.ingredientsHeader}>
                <Text style={styles.detailSectionTitle}>🧺 Ingredients</Text>
                <View style={styles.servingsStepper}>
                  <TouchableOpacity
                    style={styles.servingsButton}
                    onPress={() => {
                      haptics.selection();
                      setDetailServings(s => Math.max(1, s - 1));
                    }}
                    accessibilityLabel='Fewer servings'
                  >
                    <Text style={styles.servingsButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.servingsValue}>
                    {detailServings} serv
                  </Text>
                  <TouchableOpacity
                    style={styles.servingsButton}
                    onPress={() => {
                      haptics.selection();
                      setDetailServings(s => Math.min(24, s + 1));
                    }}
                    accessibilityLabel='More servings'
                  >
                    <Text style={styles.servingsButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {scaledIngredients.map((ingredient, i) => {
                const has = detailAvailability?.have.includes(
                  detailRecipe.ingredients[i]
                );
                return (
                  <View key={i} style={styles.ingredientRow}>
                    <Text style={styles.ingredientMark}>
                      {has ? '✅' : '🛒'}
                    </Text>
                    <Text
                      style={[
                        styles.ingredientText,
                        !has && styles.ingredientMissing,
                      ]}
                    >
                      {ingredient}
                    </Text>
                  </View>
                );
              })}

              {detailRecipe.instructions.length > 0 && (
                <>
                  <Text style={styles.detailSectionTitle}>👨‍🍳 Steps</Text>
                  {detailRecipe.instructions.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </>
              )}

              <View style={styles.detailActions}>
                {detailRecipe.instructions.length > 0 && (
                  <PantryButton
                    title='Start Cooking'
                    onPress={() => {
                      haptics.medium();
                      setCooking(true);
                    }}
                    variant='primary'
                    size='lg'
                    icon='👨‍🍳'
                    fullWidth
                  />
                )}
                {!detailAvailability?.canCook && (
                  <PantryButton
                    title='Add missing to shopping list'
                    onPress={() => handleAddMissingToList(detailRecipe)}
                    variant='secondary'
                    size='md'
                    icon='🛒'
                    fullWidth
                  />
                )}
                <PantryButton
                  title='Delete recipe'
                  onPress={() => handleDeleteRecipe(detailRecipe)}
                  variant='ghost'
                  size='sm'
                  fullWidth
                />
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      <CookingModeModal
        visible={cooking}
        recipe={detailRecipe}
        ingredients={scaledIngredients}
        onClose={() => setCooking(false)}
      />

      {/* Add recipe modal */}
      <Modal
        visible={showAddModal}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <PantryHeader
            title='New Recipe'
            subtitle='Save a family favorite'
            gradient='sunset'
            showBackButton
            onBackPress={() => setShowAddModal(false)}
          />
          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps='handled'
          >
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder='e.g. Grandma’s lasagna'
              placeholderTextColor={theme.colors.textMuted}
              value={form.title}
              onChangeText={title => setForm(prev => ({ ...prev, title }))}
            />

            <Text style={styles.fieldLabel}>Ingredients * (one per line)</Text>
            <TextInput
              style={[styles.fieldInput, styles.multiline]}
              placeholder={'2 cups flour\n1 lb ground beef\n...'}
              placeholderTextColor={theme.colors.textMuted}
              value={form.ingredients}
              onChangeText={ingredients =>
                setForm(prev => ({ ...prev, ingredients }))
              }
              multiline
            />

            <Text style={styles.fieldLabel}>Steps (one per line)</Text>
            <TextInput
              style={[styles.fieldInput, styles.multiline]}
              placeholder={'Preheat oven to 375°F\nBrown the beef\n...'}
              placeholderTextColor={theme.colors.textMuted}
              value={form.instructions}
              onChangeText={instructions =>
                setForm(prev => ({ ...prev, instructions }))
              }
              multiline
            />

            <View style={styles.fieldRow}>
              <View style={styles.fieldThird}>
                <Text style={styles.fieldLabel}>Prep (min)</Text>
                <TextInput
                  style={styles.fieldInput}
                  keyboardType='number-pad'
                  value={form.prepTime}
                  onChangeText={prepTime =>
                    setForm(prev => ({ ...prev, prepTime }))
                  }
                />
              </View>
              <View style={styles.fieldThird}>
                <Text style={styles.fieldLabel}>Cook (min)</Text>
                <TextInput
                  style={styles.fieldInput}
                  keyboardType='number-pad'
                  value={form.cookTime}
                  onChangeText={cookTime =>
                    setForm(prev => ({ ...prev, cookTime }))
                  }
                />
              </View>
              <View style={styles.fieldThird}>
                <Text style={styles.fieldLabel}>Servings</Text>
                <TextInput
                  style={styles.fieldInput}
                  keyboardType='number-pad'
                  value={form.servings}
                  onChangeText={servings =>
                    setForm(prev => ({ ...prev, servings }))
                  }
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Tags (comma separated)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder='italian, dinner, comfort food'
              placeholderTextColor={theme.colors.textMuted}
              value={form.tags}
              onChangeText={tags => setForm(prev => ({ ...prev, tags }))}
            />

            <View style={styles.formActions}>
              <PantryButton
                title='Cancel'
                onPress={() => setShowAddModal(false)}
                variant='outline'
                size='md'
                style={styles.formActionButton}
              />
              <PantryButton
                title='Save Recipe'
                onPress={handleSaveRecipe}
                variant='primary'
                size='md'
                loading={saving}
                style={styles.formActionButton}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Discovery modal */}
      <Modal
        visible={showDiscovery}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowDiscovery(false)}
      >
        <View style={styles.modalContainer}>
          <PantryHeader
            title='Discover'
            subtitle='Meal ideas from your pantry'
            gradient='berry'
            showBackButton
            onBackPress={() => setShowDiscovery(false)}
          />
          <ScrollView style={styles.modalContent}>
            {discovering ? (
              <View>
                {[0, 1, 2, 3].map(i => (
                  <View key={i} style={styles.skeletonCard}>
                    <Skeleton height={20} width='70%' />
                    <Skeleton
                      height={14}
                      width='45%'
                      style={styles.skeletonGap}
                    />
                    <Skeleton
                      height={14}
                      width='90%'
                      style={styles.skeletonGap}
                    />
                  </View>
                ))}
              </View>
            ) : discovered.length > 0 ? (
              discovered.map((recipe, index) => (
                <FadeSlideIn key={`${recipe.id}-${index}`} delay={index * 60}>
                  <PantryCard variant='default' padding='md'>
                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                    <Text style={styles.discoverMeta}>
                      {recipe.canCookNow
                        ? '🍳 You have everything!'
                        : `🛒 Missing ${recipe.missingIngredients.length} ingredient${recipe.missingIngredients.length === 1 ? '' : 's'}`}
                      {recipe.servings ? ` · Serves ${recipe.servings}` : ''}
                    </Text>
                    <View style={styles.discoverActions}>
                      <PantryButton
                        title='Save to my recipes'
                        onPress={() => handleSaveDiscovered(recipe)}
                        variant='primary'
                        size='sm'
                        icon='💾'
                        fullWidth
                      />
                    </View>
                  </PantryCard>
                </FadeSlideIn>
              ))
            ) : (
              <EmptyState
                emoji='🔍'
                title='No suggestions found'
                message='Add a few pantry items first so we know what you have to work with.'
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    detailActions: {
      gap: spacing.sm,
      marginBottom: spacing.xxl,
      marginTop: spacing.lg,
    },
    detailImage: {
      borderRadius: borderRadius.card,
      height: 180,
      marginBottom: spacing.md,
      width: '100%',
    },
    detailMetaItem: {
      alignItems: 'center',
      flex: 1,
    },
    detailMetaLabel: {
      ...typography.caption,
      color: theme.colors.textMuted,
    },
    detailMetaRow: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.card,
      borderWidth: 1,
      flexDirection: 'row',
      marginBottom: spacing.md,
      paddingVertical: spacing.md,
    },
    detailMetaValue: {
      ...typography.h4,
      color: theme.colors.text,
    },
    detailSectionTitle: {
      ...typography.h4,
      color: theme.colors.text,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    discoverActions: {
      marginTop: spacing.sm,
    },
    discoverMeta: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
      marginTop: spacing.xs,
    },
    favoriteButton: {
      padding: spacing.xs,
    },
    favoriteIcon: {
      fontSize: 20,
    },
    fieldInput: {
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.input,
      borderWidth: 1,
      color: theme.colors.text,
      fontSize: 16,
      marginBottom: spacing.md,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    fieldLabel: {
      ...typography.label,
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
    },
    fieldRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    fieldThird: {
      flex: 1,
    },
    filterChip: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.pill,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      ...typography.bodySmall,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    filterChipTextActive: {
      color: '#fff',
    },
    filterRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginVertical: spacing.sm,
    },
    formActionButton: {
      flex: 1,
    },
    formActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.xxl,
      marginTop: spacing.sm,
    },
    ingredientMark: {
      fontSize: 14,
      marginRight: spacing.sm,
    },
    ingredientMissing: {
      color: theme.colors.textMuted,
    },
    ingredientRow: {
      alignItems: 'center',
      flexDirection: 'row',
      paddingVertical: spacing.xs,
    },
    ingredientText: {
      ...typography.body,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    ingredientsHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    listContent: {
      paddingBottom: spacing.xxl,
    },
    modalContainer: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    modalContent: {
      flex: 1,
      padding: spacing.md,
    },
    moreTags: {
      ...typography.caption,
      alignSelf: 'center',
      color: theme.colors.textMuted,
    },
    multiline: {
      minHeight: 96,
      textAlignVertical: 'top',
    },
    recipeHeader: {
      flexDirection: 'row',
    },
    recipeInfo: {
      flex: 1,
    },
    recipeMeta: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    recipeMetaText: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
    },
    recipeTitle: {
      ...typography.body,
      color: theme.colors.text,
      flex: 1,
      fontWeight: '600',
    },
    searchInput: {
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.input,
      borderWidth: 1,
      color: theme.colors.text,
      flex: 1,
      fontSize: 16,
      height: 44,
      paddingHorizontal: spacing.md,
    },
    searchRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
    },
    servingsButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 34,
      width: 34,
    },
    servingsButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 18,
      fontWeight: '700',
    },
    servingsStepper: {
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundSubtle,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.pill,
      borderWidth: 1,
      flexDirection: 'row',
    },
    servingsValue: {
      ...typography.caption,
      color: theme.colors.primary,
      fontWeight: '700',
      minWidth: 48,
      textAlign: 'center',
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
    statusBadge: {
      borderRadius: borderRadius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    statusText: {
      ...typography.caption,
      fontWeight: '700',
    },
    stepNumber: {
      alignItems: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 12,
      height: 24,
      justifyContent: 'center',
      marginRight: spacing.sm,
      marginTop: 2,
      width: 24,
    },
    stepNumberText: {
      ...typography.caption,
      color: theme.colors.primary,
      fontWeight: '700',
    },
    stepRow: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    stepText: {
      ...typography.body,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    tag: {
      backgroundColor: theme.colors.primarySoft,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    tagText: {
      ...typography.caption,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    titleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
  });
