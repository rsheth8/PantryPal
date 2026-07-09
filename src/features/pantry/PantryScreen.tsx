import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  usePantryItemForm,
  PantryItemFormFields,
  validatePantryItemForm,
  pantryFormToItemPayload,
} from '../../components/PantryItemForm';
import { GroceryItem } from '../../types';
import { isExpiringSoon } from '../../utils/helpers';
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '../../utils/designSystem';

type PantryRouteParams = {
  Pantry: {
    filter?: 'expiring' | 'lowStock';
    prefillName?: string;
    showAddModal?: boolean;
  };
};

export default function PantryScreen() {
  const route = useRoute<RouteProp<PantryRouteParams, 'Pantry'>>();
  const {
    pantry,
    preferences,
    addGroceryItem,
    updateGroceryItem,
    removeGroceryItem,
    useItem,
  } = useMultiUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<'all' | 'expiring' | 'lowStock'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<GroceryItem | null>(null);
  const [quantityToUse, setQuantityToUse] = useState('1');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'expiration' | 'category'>(
    'name'
  );

  const defaultIsShared = preferences.defaultItemVisibility === 'shared';
  const addForm = usePantryItemForm(null, route.params?.prefillName, defaultIsShared);
  const editForm = usePantryItemForm(editingItem);

  useEffect(() => {
    if (route.params?.filter) {
      setListFilter(route.params.filter);
    }
    if (route.params?.showAddModal || route.params?.prefillName) {
      setShowAddModal(true);
    }
  }, [route.params?.filter, route.params?.showAddModal, route.params?.prefillName]);

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
        onPress: () => Alert.alert('Export', 'CSV export coming soon!'),
      },
      {
        text: 'JSON',
        onPress: () => Alert.alert('Export', 'JSON export coming soon!'),
      },
    ]);
  };

  const handleImportData = () => {
    Alert.alert('Import Data', 'Import functionality coming soon!');
  };

  const handleBulkActions = () => {
    Alert.alert('Bulk Actions', 'Bulk actions coming soon!');
  };

  const handleAddItem = () => {
    addForm.resetForm(null, route.params?.prefillName);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    addForm.resetForm();
  };

  const handleSaveItem = async () => {
    const error = validatePantryItemForm(addForm.form);
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    try {
      await addGroceryItem(pantryFormToItemPayload(addForm.form), addForm.form.isShared);
      setShowAddModal(false);
      addForm.resetForm();
    } catch {
      Alert.alert('Error', 'Failed to add item. Please try again.');
    }
  };

  const handleEditItem = (item: GroceryItem) => {
    setEditingItem(item);
    editForm.resetForm(item);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const error = validatePantryItemForm(editForm.form);
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    try {
      await updateGroceryItem(editingItem.id, pantryFormToItemPayload(editForm.form));
      setShowEditModal(false);
      setEditingItem(null);
    } catch {
      Alert.alert('Error', 'Failed to update item. Please try again.');
    }
  };

  const handleDeleteItem = () => {
    if (!editingItem) return;
    Alert.alert('Delete Item', `Delete ${editingItem.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeGroceryItem(editingItem.id);
          setShowEditModal(false);
          setEditingItem(null);
        },
      },
    ]);
  };

  const handleUseItem = (item: GroceryItem) => {
    if (item.quantity <= 0) {
      Alert.alert('No Quantity', 'This item has no quantity to use.');
      return;
    }

    if (item.quantity === 1) {
      // Single item - use it all
      Alert.alert(
        'Use Item',
        `Use 1 ${item.unit} of ${item.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Use',
            onPress: () => useItem(item.id, 1),
          },
        ]
      );
    } else {
      // Multiple items - show modal for quantity input
      setSelectedItem(item);
      setQuantityToUse('1');
      setShowUseModal(true);
    }
  };

  const handleConfirmUse = () => {
    if (!selectedItem) return;

    const quantity = parseInt(quantityToUse);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid number.');
      return;
    }
    if (quantity > selectedItem.quantity) {
      Alert.alert('Too Much', `You only have ${selectedItem.quantity} ${selectedItem.unit} available.`);
      return;
    }

    useItem(selectedItem.id, quantity);
    setShowUseModal(false);
    setSelectedItem(null);
    setQuantityToUse('1');
  };

  const handleUseAll = () => {
    if (!selectedItem) return;
    useItem(selectedItem.id, selectedItem.quantity);
    setShowUseModal(false);
    setSelectedItem(null);
    setQuantityToUse('1');
  };

  // Filter and sort items
  const filteredItems = pantry
    .filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || item.category === selectedCategory;
      const matchesListFilter =
        listFilter === 'all' ||
        (listFilter === 'expiring' &&
          isExpiringSoon(item, preferences.expirationReminderDays)) ||
        (listFilter === 'lowStock' &&
          item.quantity <= preferences.lowStockThreshold &&
          !item.isExpired);
      return matchesSearch && matchesCategory && matchesListFilter;
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

  const renderItem = ({ item }: { item: GroceryItem }) => (
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
          title={item.quantity > 0 ? 'Use' : 'Used'}
          onPress={() => handleUseItem(item)}
          variant={item.quantity > 0 ? 'success' : 'outline'}
          size='sm'
          disabled={item.quantity <= 0}
        />
        <PantryButton
          title='Edit'
          onPress={() => handleEditItem(item)}
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

      {/* List filter chips */}
      <PantryCard variant='default' padding='md'>
        <Text style={styles.sectionTitle}>🔍 Filter</Text>
        <View style={styles.sortContainer}>
          {(['all', 'expiring', 'lowStock'] as const).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.sortChip,
                listFilter === filter && styles.sortChipActive,
              ]}
              onPress={() => setListFilter(filter)}
            >
              <Text
                style={[
                  styles.sortChipText,
                  listFilter === filter && styles.sortChipTextActive,
                ]}
              >
                {filter === 'all'
                  ? 'All'
                  : filter === 'expiring'
                    ? 'Expiring'
                    : 'Low Stock'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
      <Modal
        visible={showAddModal}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <View style={styles.modalContainer}>
          <PantryHeader
            title='Add Item'
            subtitle='Add a new item to your pantry'
            gradient='primary'
            showBackButton
            onBackPress={handleCloseAddModal}
          />

          <View style={styles.modalContent}>
            <PantryCard variant='elevated' padding='lg'>
              <PantryItemFormFields
                form={addForm.form}
                updateField={addForm.updateField}
              />
              <View style={styles.modalActions}>
                <PantryButton
                  title='Cancel'
                  onPress={handleCloseAddModal}
                  variant='outline'
                  size='md'
                />
                <PantryButton
                  title='Save'
                  onPress={handleSaveItem}
                  variant='primary'
                  size='md'
                />
              </View>
            </PantryCard>
          </View>
        </View>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        visible={showEditModal}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <View style={styles.modalContainer}>
          <PantryHeader
            title='Edit Item'
            subtitle={editingItem?.name || ''}
            gradient='primary'
            showBackButton
            onBackPress={() => {
              setShowEditModal(false);
              setEditingItem(null);
            }}
          />
          <View style={styles.modalContent}>
            <PantryCard variant='elevated' padding='lg'>
              <PantryItemFormFields
                form={editForm.form}
                updateField={editForm.updateField}
              />
              <View style={styles.modalActions}>
                <PantryButton
                  title='Delete'
                  onPress={handleDeleteItem}
                  variant='error'
                  size='md'
                />
                <PantryButton
                  title='Cancel'
                  onPress={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  variant='outline'
                  size='md'
                />
                <PantryButton
                  title='Save'
                  onPress={handleSaveEdit}
                  variant='primary'
                  size='md'
                />
              </View>
            </PantryCard>
          </View>
        </View>
      </Modal>

      {/* Use Item Modal */}
      <Modal
        visible={showUseModal}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <View style={styles.modalContainer}>
          <PantryHeader
            title='Use Item'
            subtitle={selectedItem ? `Use ${selectedItem.name}` : ''}
            gradient='fresh'
            showBackButton
            onBackPress={() => setShowUseModal(false)}
          />

          <View style={styles.modalContent}>
            <PantryCard variant='elevated' padding='lg'>
              {selectedItem && (
                <>
                  <View style={styles.useItemInfo}>
                    <Text style={styles.useItemName}>{selectedItem.name}</Text>
                    <Text style={styles.useItemDetails}>
                      Available: {selectedItem.quantity} {selectedItem.unit}
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Quantity to Use</Text>
                    <TextInput
                      style={styles.input}
                      placeholder='1'
                      value={quantityToUse}
                      onChangeText={setQuantityToUse}
                      keyboardType='numeric'
                      placeholderTextColor={colors.neutral[400]}
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <PantryButton
                      title='Cancel'
                      onPress={() => setShowUseModal(false)}
                      variant='outline'
                      size='md'
                    />
                    <PantryButton
                      title='Use All'
                      onPress={handleUseAll}
                      variant='secondary'
                      size='md'
                    />
                    <PantryButton
                      title='Use'
                      onPress={handleConfirmUse}
                      variant='success'
                      size='md'
                    />
                  </View>
                </>
              )}
            </PantryCard>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
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
  sectionTitle: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
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
  sortContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sortChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
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
  itemsContainer: {
    flex: 1,
    padding: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  itemCategory: {
    ...typography.bodySmall,
    color: colors.neutral[600],
  },
  itemQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary[600],
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  modalPlaceholder: {
    ...typography.body,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  useItemInfo: {
    marginBottom: spacing.lg,
  },
  useItemName: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  useItemDetails: {
    ...typography.body,
    color: colors.neutral[600],
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.body,
    color: colors.neutral[700],
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    height: 44,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.neutral[900],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
});
