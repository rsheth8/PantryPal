import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '../../utils/designSystem';

export default function RecipesScreen() {
  const { recipes } = useMultiUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'canCook' | 'favorites'
  >('all');
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);

  const handleRecipePress = (recipe: any) => {
    Alert.alert('Recipe Details', `Viewing ${recipe.title}`);
  };

  const handleAddRecipe = () => {
    Alert.alert('Add Recipe', 'Add recipe functionality coming soon!');
  };

  const handleRecipeDiscovery = () => {
    setShowDiscoveryModal(true);
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

          <View style={styles.modalContent}>
            <PantryCard variant='elevated' padding='lg'>
              <Text style={styles.modalPlaceholder}>
                Recipe discovery functionality coming soon!
              </Text>
              <PantryButton
                title='Close'
                onPress={() => setShowDiscoveryModal(false)}
                variant='primary'
                size='md'
                fullWidth
              />
            </PantryCard>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[50],
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
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
  listContent: {
    paddingBottom: spacing.xl,
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
  modalPlaceholder: {
    ...typography.body,
    color: colors.neutral[600],
    marginBottom: spacing.lg,
    textAlign: 'center',
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
