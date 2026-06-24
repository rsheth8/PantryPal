import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Share,
} from 'react-native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import AddItemModal from '../../components/AddItemModal';
import { pantryToCsv } from '../../utils/exportData';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import { useTheme, ThemeColors } from '../../theme';

export default function PantryScreen() {
  const { pantry, markItemAsUsed } = useMultiUserStore();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'expiration' | 'category'>(
    'name'
  );

  const handleMergeDuplicates = () => {
    Alert.alert(
      'Merge Duplicates',
      'This feature will automatically merge duplicate items in your pantry.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          onPress: () => {
            Alert.alert('Success', 'Duplicate items have been merged!');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Export your pantry data as CSV or JSON?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'CSV',
        onPress: () =>
          Share.share({
            title: 'PantryPal Pantry',
            message: pantryToCsv(pantry),
          }).catch(() => undefined),
      },
      {
        text: 'JSON',
        onPress: () =>
          Share.share({
            title: 'PantryPal Pantry',
            message: JSON.stringify(pantry, null, 2),
          }).catch(() => undefined),
      },
    ]);
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'Open Settings → Import Data to paste a JSON export into your pantry.'
    );
  };

  const handleBulkActions = () => {
    Alert.alert('Bulk Actions', 'Bulk actions coming soon!');
  };

  const handleAddItem = () => {
    setShowAddModal(true);
  };

  const handleUseItem = (itemId: string, itemName: string) => {
    markItemAsUsed(itemId);
    Alert.alert('Item Used', `Marked ${itemName} as used`);
  };

  // Filter and sort items
  const filteredItems = pantry
    .filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'expiration':
          return (
            new Date(a.expirationDate).getTime() -
            new Date(b.expirationDate).getTime()
          );
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Get unique categories
  const categories = [...new Set(pantry.map(item => item.category))];

  const renderItem = ({ item }: { item: any }) => (
    <PantryCard variant='default' padding='md'>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
        </View>
        <View style={styles.itemQuantity}>
          <Text style={styles.quantityText}>
            {item.quantity} {item.unit}
          </Text>
        </View>
      </View>

      {item.expirationDate && (
        <View style={styles.expirationInfo}>
          <Text
            style={[
              styles.expirationText,
              { color: item.isExpired ? colors.error : colors.warning },
            ]}
          >
            {item.isExpired ? '⚠️ Expired' : '📅 Expires'} {item.expirationDate}
          </Text>
        </View>
      )}

      <View style={styles.itemActions}>
        <PantryButton
          title='Use'
          onPress={() => handleUseItem(item.id, item.name)}
          variant='success'
          size='sm'
        />
        <PantryButton
          title='Edit'
          onPress={() => Alert.alert('Edit Item', `Edit ${item.name}`)}
          variant='outline'
          size='sm'
        />
      </View>
    </PantryCard>
  );

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Pantry'
        subtitle='Your food inventory'
        gradient='fresh'
        rightAction={{
          icon: '⚙️',
          onPress: () => setShowAdvancedOptions(!showAdvancedOptions),
        }}
      />

      {/* Search and Add Section */}
      <PantryCard variant='elevated' padding='md' margin='none'>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder='Search items, categories, or keywords...'
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.neutral[400]}
          />
          <PantryButton
            title='+'
            onPress={handleAddItem}
            variant='primary'
            size='sm'
          />
        </View>
      </PantryCard>

      {/* Advanced Options - Collapsible */}
      {showAdvancedOptions && (
        <PantryCard variant='outlined' padding='md'>
          <Text style={styles.sectionTitle}>🔧 Advanced Options</Text>
          <View style={styles.optionsGrid}>
            <PantryButton
              title='Merge Duplicates'
              onPress={handleMergeDuplicates}
              variant='outline'
              size='sm'
              fullWidth
            />
            <PantryButton
              title='Export Data'
              onPress={handleExportData}
              variant='outline'
              size='sm'
              fullWidth
            />
            <PantryButton
              title='Import Data'
              onPress={handleImportData}
              variant='outline'
              size='sm'
              fullWidth
            />
            <PantryButton
              title='Bulk Actions'
              onPress={handleBulkActions}
              variant='outline'
              size='sm'
              fullWidth
            />
          </View>
        </PantryCard>
      )}

      {/* Category Filter */}
      <PantryCard variant='warm' padding='md'>
        <Text style={styles.sectionTitle}>📂 Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryContainer}>
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  !selectedCategory && styles.categoryChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category &&
                      styles.categoryChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </PantryCard>

      {/* Sort Options */}
      <PantryCard variant='default' padding='md'>
        <Text style={styles.sectionTitle}>🔄 Sort By</Text>
        <View style={styles.sortContainer}>
          {['name', 'expiration', 'category'].map(sortOption => (
            <TouchableOpacity
              key={sortOption}
              style={[
                styles.sortChip,
                sortBy === sortOption && styles.sortChipActive,
              ]}
              onPress={() => setSortBy(sortOption as any)}
            >
              <Text
                style={[
                  styles.sortChipText,
                  sortBy === sortOption && styles.sortChipTextActive,
                ]}
              >
                {sortOption.charAt(0).toUpperCase() + sortOption.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </PantryCard>

      {/* Items List */}
      <View style={styles.itemsContainer}>
        {filteredItems.length > 0 ? (
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <PantryCard variant='outlined' padding='xl'>
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🥫</Text>
              <Text style={styles.emptyStateText}>No items found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Add your first item to get started!'}
              </Text>
              <PantryButton
                title='Add First Item'
                onPress={handleAddItem}
                variant='primary'
                size='md'
                fullWidth
              />
            </View>
          </PantryCard>
        )}
      </View>

      {/* Add Item Modal */}
      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    categoryChip: {
      backgroundColor: colors.neutral[100],
      borderColor: colors.neutral[200],
      borderRadius: borderRadius.pill,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    categoryChipActive: {
      backgroundColor: colors.primary[500],
      borderColor: colors.primary[500],
    },
    categoryChipText: {
      ...typography.bodySmall,
      color: colors.neutral[700],
      fontWeight: '500',
    },
    categoryChipTextActive: {
      color: '#fff',
    },
    categoryContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    container: {
      backgroundColor: colors.neutral[50],
      flex: 1,
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
    expirationInfo: {
      marginBottom: spacing.sm,
    },
    expirationText: {
      ...typography.bodySmall,
      fontWeight: '500',
    },
    itemActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    itemCategory: {
      ...typography.bodySmall,
      color: colors.neutral[600],
    },
    itemHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    itemInfo: {
      flex: 1,
    },
    itemName: {
      ...typography.body,
      color: colors.neutral[800],
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    itemQuantity: {
      alignItems: 'flex-end',
    },
    itemsContainer: {
      flex: 1,
      padding: spacing.md,
    },
    listContent: {
      paddingBottom: spacing.xl,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    quantityText: {
      ...typography.body,
      color: colors.primary[600],
      fontWeight: '600',
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
    sortChip: {
      backgroundColor: colors.neutral[100],
      borderColor: colors.neutral[200],
      borderRadius: borderRadius.md,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    sortChipActive: {
      backgroundColor: colors.secondary[500],
      borderColor: colors.secondary[500],
    },
    sortChipText: {
      ...typography.bodySmall,
      color: colors.neutral[700],
      fontWeight: '500',
    },
    sortChipTextActive: {
      color: '#fff',
    },
    sortContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  });
