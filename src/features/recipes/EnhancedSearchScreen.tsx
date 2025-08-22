import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import { recipeService } from '../../services/recipeService';
import { Recipe, UserPreferences } from '../../types';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../utils/designSystem';

interface SearchFilter {
  cuisines: string[];
  diets: string[];
  difficulty: string;
  maxTime: number;
  allergens: string[];
  tags: string[];
}

const CUISINES = [
  'Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'American',
  'French', 'Thai', 'Japanese', 'Greek', 'Middle Eastern', 'African'
];

const DIETS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo',
  'Low-Carb', 'High-Protein', 'Heart-Healthy'
];

const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];

const COOKING_TIMES = [
  { label: 'Quick (≤15 min)', value: 15 },
  { label: 'Fast (≤30 min)', value: 30 },
  { label: 'Medium (≤60 min)', value: 60 },
  { label: 'Slow (>60 min)', value: 120 },
];

const POPULAR_TAGS = [
  'Quick', 'Healthy', 'Comfort', 'Spicy', 'Sweet', 'Savory',
  'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'
];

export default function EnhancedSearchScreen() {
  const navigation = useNavigation();
  const { recipes, pantry, preferences } = useMultiUserStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilter>({
    cuisines: [],
    diets: [],
    difficulty: '',
    maxTime: 0,
    allergens: [],
    tags: [],
  });

  // Get unique values from existing recipes for suggestions
  const availableCuisines = useMemo(() => {
    const cuisines = new Set<string>();
    recipes.forEach(recipe => {
      recipe.cuisines?.forEach(cuisine => cuisines.add(cuisine));
    });
    return Array.from(cuisines);
  }, [recipes]);

  const availableDiets = useMemo(() => {
    const diets = new Set<string>();
    recipes.forEach(recipe => {
      recipe.diets?.forEach(diet => diets.add(diet));
    });
    return Array.from(diets);
  }, [recipes]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    recipes.forEach(recipe => {
      recipe.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [recipes]);

  // Search suggestions based on current query
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const suggestions = new Set<string>();
    const query = searchQuery.toLowerCase();
    
    // Add recipe titles that match
    recipes.forEach(recipe => {
      if (recipe.title.toLowerCase().includes(query)) {
        suggestions.add(recipe.title);
      }
    });
    
    // Add ingredients that match
    recipes.forEach(recipe => {
      recipe.ingredients?.forEach(ingredient => {
        if (ingredient.toLowerCase().includes(query)) {
          suggestions.add(ingredient);
        }
      });
    });
    
    // Add tags that match
    recipes.forEach(recipe => {
      recipe.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(query)) {
          suggestions.add(tag);
        }
      });
    });
    
    return Array.from(suggestions).slice(0, 5);
  }, [searchQuery, recipes]);

  const performSearch = async (searchText?: string) => {
    const queryToSearch = searchText || searchQuery;
    if (!queryToSearch.trim() && !hasActiveFilters()) return;
    
    setIsSearching(true);
    
    try {
      // Add to search history if it's a text search
      if (searchText && !searchHistory.includes(searchText)) {
        setSearchHistory(prev => [searchText, ...prev.slice(0, 9)]);
      }
      
      // Filter recipes based on search query and filters
      let filteredRecipes = recipes.filter(recipe => {
        // If there's a search query, check if recipe matches
        if (queryToSearch.trim()) {
          const matchesSearch = 
            recipe.title.toLowerCase().includes(queryToSearch.toLowerCase()) ||
            recipe.ingredients.some(ingredient => 
              ingredient.toLowerCase().includes(queryToSearch.toLowerCase())
            ) ||
            recipe.tags.some(tag => 
              tag.toLowerCase().includes(queryToSearch.toLowerCase())
            ) ||
            recipe.cuisines?.some(cuisine => 
              cuisine.toLowerCase().includes(queryToSearch.toLowerCase())
            );
          
          if (!matchesSearch) return false;
        }
        
        // Apply filters
        if (filters.cuisines.length > 0) {
          const hasMatchingCuisine = recipe.cuisines?.some(cuisine =>
            filters.cuisines.includes(cuisine)
          );
          if (!hasMatchingCuisine) return false;
        }
        
        if (filters.diets.length > 0) {
          const hasMatchingDiet = recipe.diets?.some(diet =>
            filters.diets.includes(diet)
          );
          if (!hasMatchingDiet) return false;
        }
        
        if (filters.difficulty) {
          const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
          const recipeDifficulty = getDifficultyFromTime(totalTime);
          if (recipeDifficulty !== filters.difficulty.toLowerCase()) return false;
        }
        
        if (filters.maxTime > 0) {
          const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
          if (totalTime > filters.maxTime) return false;
        }
        
        if (filters.allergens.length > 0) {
          const hasAllergen = recipe.allergens?.some(allergen =>
            filters.allergens.includes(allergen)
          );
          if (hasAllergen) return false;
        }
        
        if (filters.tags.length > 0) {
          const hasMatchingTag = recipe.tags?.some(tag =>
            filters.tags.includes(tag)
          );
          if (!hasMatchingTag) return false;
        }
        
        return true;
      });
      
      // Sort by relevance (can cook now first, then by rating)
      filteredRecipes.sort((a, b) => {
        if (a.canCookNow && !b.canCookNow) return -1;
        if (!a.canCookNow && b.canCookNow) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
      
      setSearchResults(filteredRecipes);
    } catch (error) {
      Alert.alert('Search Error', 'Failed to perform search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const hasActiveFilters = () => {
    return filters.cuisines.length > 0 || 
           filters.diets.length > 0 || 
           filters.difficulty || 
           filters.maxTime > 0 || 
           filters.allergens.length > 0 || 
           filters.tags.length > 0;
  };

  const getDifficultyFromTime = (totalTime: number): string => {
    if (totalTime <= 30) return 'easy';
    if (totalTime <= 60) return 'medium';
    return 'hard';
  };

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
    // Auto-search when suggestion is selected
    setTimeout(() => performSearch(), 100);
  };

  const handleFilterToggle = (category: keyof SearchFilter, value: string) => {
    setFilters(prev => {
      const currentValues = prev[category] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [category]: newValues,
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      cuisines: [],
      diets: [],
      difficulty: '',
      maxTime: 0,
      allergens: [],
      tags: [],
    });
    setSearchResults([]);
  };

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <PantryCard variant="default" padding="md" margin="sm">
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('RecipeDetail' as never, { recipe: item } as never);
        }}
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
              {item.rating && (
                <Text style={styles.recipeRating}>
                  ⭐ {item.rating.toFixed(1)}
                </Text>
              )}
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
                  ❌ {item.missingIngredients?.length || 0} missing
                </Text>
              </View>
            )}
          </View>
        </View>

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
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
            title="View"
            onPress={() => navigation.navigate('RecipeDetail' as never, { recipe: item } as never)}
            variant="outline"
            size="sm"
          />
          <PantryButton
            title="Cook"
            onPress={() => Alert.alert('Cook Recipe', `Start cooking ${item.title}`)}
            variant="primary"
            size="sm"
            disabled={!item.canCookNow}
          />
        </View>
      </TouchableOpacity>
    </PantryCard>
  );

  const renderFilterSection = (title: string, items: string[], category: keyof SearchFilter) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      <View style={styles.filterChips}>
        {items.map(item => {
          const isSelected = (filters[category] as string[]).includes(item);
          return (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterChip,
                isSelected && styles.filterChipActive,
              ]}
              onPress={() => handleFilterToggle(category, item)}
            >
              <Text style={[
                styles.filterChipText,
                isSelected && styles.filterChipTextActive,
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <PantryHeader
        title="Enhanced Search"
        subtitle="Find the perfect recipe with advanced filters"
        gradient="berry"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <PantryCard variant="elevated" padding="md">
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes, ingredients, cuisines..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={performSearch}
              placeholderTextColor={colors.neutral[400]}
            />
            <PantryButton
              title={isSearching ? "..." : "🔍"}
              onPress={performSearch}
              variant="primary"
              size="sm"
              disabled={isSearching || !searchQuery.trim()}
            />
          </View>

          {/* Search Suggestions */}
          {searchSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {searchSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <Text style={styles.suggestionText}>🔍 {suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && !searchQuery && (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Recent Searches</Text>
              {searchHistory.map((term, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.historyItem}
                  onPress={() => handleSuggestionPress(term)}
                >
                  <Text style={styles.historyText}>🕒 {term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </PantryCard>

        {/* Filters Toggle */}
        <PantryCard variant="fresh" padding="md">
          <View style={styles.filterToggleContainer}>
            <View style={styles.filterToggleLeft}>
              <Text style={styles.sectionTitle}>🔧 Advanced Filters</Text>
              {hasActiveFilters() && (
                <View style={styles.activeFiltersBadge}>
                  <Text style={styles.activeFiltersText}>Active</Text>
                </View>
              )}
            </View>
            <PantryButton
              title={showFilters ? "Hide Filters" : "Show Filters"}
              onPress={() => setShowFilters(!showFilters)}
              variant={hasActiveFilters() ? "primary" : "outline"}
              size="sm"
            />
          </View>

          {showFilters && (
            <View style={styles.filtersContent}>
              {/* Cuisines */}
              {renderFilterSection('Cuisines', availableCuisines, 'cuisines')}
              
              {/* Diets */}
              {renderFilterSection('Diets', availableDiets, 'diets')}
              
              {/* Difficulty */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Difficulty</Text>
                <View style={styles.filterChips}>
                  {DIFFICULTY_LEVELS.map(level => {
                    const isSelected = filters.difficulty === level;
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.filterChip,
                          isSelected && styles.filterChipActive,
                        ]}
                        onPress={() => setFilters(prev => ({
                          ...prev,
                          difficulty: isSelected ? '' : level,
                        }))}
                      >
                        <Text style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextActive,
                        ]}>
                          {level}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Cooking Time */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Max Cooking Time</Text>
                <View style={styles.filterChips}>
                  {COOKING_TIMES.map(time => {
                    const isSelected = filters.maxTime === time.value;
                    return (
                      <TouchableOpacity
                        key={time.value}
                        style={[
                          styles.filterChip,
                          isSelected && styles.filterChipActive,
                        ]}
                        onPress={() => setFilters(prev => ({
                          ...prev,
                          maxTime: isSelected ? 0 : time.value,
                        }))}
                      >
                        <Text style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextActive,
                        ]}>
                          {time.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Popular Tags */}
              {renderFilterSection('Popular Tags', POPULAR_TAGS, 'tags')}

              {/* Filter Actions */}
              <View style={styles.filterActions}>
                <PantryButton
                  title="Apply Filters"
                  onPress={() => {
                    performSearch();
                    setShowFilters(false);
                  }}
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={!hasActiveFilters()}
                />
                <PantryButton
                  title="Clear All Filters"
                  onPress={() => {
                    clearFilters();
                    setSearchResults([]);
                  }}
                  variant="ghost"
                  size="sm"
                  fullWidth
                />
              </View>
            </View>
          )}
        </PantryCard>

        {/* Search Results */}
        {isSearching ? (
          <PantryCard variant="outlined" padding="xl">
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Searching recipes...</Text>
            </View>
          </PantryCard>
        ) : searchResults.length > 0 ? (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                Found {searchResults.length} recipes
              </Text>
              <Text style={styles.resultsSubtitle}>
                {searchQuery ? `for "${searchQuery}"` : 'matching your criteria'}
                {hasActiveFilters() && (
                  <Text style={styles.activeFiltersNote}> • Filters applied</Text>
                )}
              </Text>
            </View>
            
            <View style={styles.resultsList}>
              {searchResults.map((item) => (
                <View key={item.id}>
                  {renderRecipeCard({ item })}
                </View>
              ))}
            </View>
          </View>
        ) : searchQuery && !isSearching ? (
          <PantryCard variant="outlined" padding="xl">
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔍</Text>
              <Text style={styles.emptyStateText}>No recipes found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your search terms or filters
              </Text>
              <PantryButton
                title="Clear Search"
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                variant="primary"
                size="md"
                fullWidth
              />
            </View>
          </PantryCard>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  suggestionsContainer: {
    marginTop: spacing.sm,
  },
  suggestionItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  suggestionText: {
    ...typography.body,
    color: colors.neutral[700],
  },
  historyContainer: {
    marginTop: spacing.sm,
  },
  historyTitle: {
    ...typography.bodySmall,
    color: colors.neutral[600],
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  historyItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  historyText: {
    ...typography.body,
    color: colors.neutral[600],
  },
  filterToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeFiltersBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  activeFiltersText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  filtersContent: {
    marginTop: spacing.md,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterSectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.neutral[600],
    marginTop: spacing.md,
  },
  resultsContainer: {
    marginTop: spacing.md,
  },
  resultsHeader: {
    marginBottom: spacing.md,
  },
  resultsTitle: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  resultsSubtitle: {
    ...typography.bodySmall,
    color: colors.neutral[600],
  },
  activeFiltersNote: {
    ...typography.bodySmall,
    color: colors.primary[600],
    fontWeight: '600',
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
  emptyStateText: {
    ...typography.h4,
    color: colors.neutral[600],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  recipeTime: {
    ...typography.bodySmall,
    color: colors.neutral[600],
  },
  recipeServings: {
    ...typography.bodySmall,
    color: colors.neutral[600],
  },
  recipeRating: {
    ...typography.bodySmall,
    color: colors.neutral[600],
  },
  recipeStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.success + '20',
  },
  statusText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  missingBadge: {
    backgroundColor: colors.warning + '20',
  },
  missingText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary[100],
  },
  tagText: {
    ...typography.caption,
    color: colors.primary[700],
    fontWeight: '500',
  },
  moreTags: {
    ...typography.caption,
    color: colors.neutral[500],
    alignSelf: 'center',
  },
  recipeActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  resultsList: {
    gap: spacing.sm,
  },
});
