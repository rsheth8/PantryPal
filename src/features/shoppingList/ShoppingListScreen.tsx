import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import { shoppingListSyncService } from '../../services/shoppingListSyncService';
import { ShoppingListItem } from '../../types';
import { PANTRY_CATEGORIES } from '../../utils/helpers';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../utils/designSystem';

export default function ShoppingListScreen() {
  const {
    shoppingList,
    pantry,
    recipes,
    addShoppingListItem,
    updateShoppingListItem,
    removeShoppingListItem,
    addGroceryItem,
    addMissingIngredientsToShoppingList,
  } = useMultiUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('piece');
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editUnit, setEditUnit] = useState('piece');
  const [editCategory, setEditCategory] = useState('Other');
  const [editNotes, setEditNotes] = useState('');

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    if (shoppingListSyncService.isInPantry(newItemName.trim(), pantry)) {
      Alert.alert(
        'Already in Pantry',
        `${newItemName.trim()} appears to already be in your pantry. Add anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Anyway', onPress: () => submitNewItem() },
        ]
      );
      return;
    }

    submitNewItem();
  };

  const submitNewItem = () => {
    addShoppingListItem({
      name: newItemName.trim(),
      quantity: parseInt(newItemQuantity) || 1,
      unit: newItemUnit,
      category: 'Other',
      notes: '',
      price: 0,
      isShared: true,
    });

    setNewItemName('');
    setNewItemQuantity('1');
    setNewItemUnit('piece');
    setShowAddModal(false);
  };

  const handleToggleComplete = (item: ShoppingListItem) => {
    if (!item.isCompleted) {
      Alert.alert(
        'Mark Complete',
        `Mark "${item.name}" as purchased?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete Only',
            onPress: () =>
              updateShoppingListItem(item.id, { isCompleted: true }),
          },
          {
            text: 'Add to Pantry',
            onPress: async () => {
              await addGroceryItem(
                {
                  name: item.name,
                  quantity: item.quantity,
                  unit: item.unit,
                  category: item.category || 'Other',
                  expirationDate: new Date().toISOString().split('T')[0],
                  notes: item.notes,
                  price: item.price,
                  isShared: item.isShared,
                },
                item.isShared
              );
              await updateShoppingListItem(item.id, { isCompleted: true });
            },
          },
        ]
      );
    } else {
      updateShoppingListItem(item.id, { isCompleted: false });
    }
  };

  const handleEditItem = (item: ShoppingListItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditQuantity(String(item.quantity));
    setEditUnit(item.unit);
    setEditCategory(item.category || 'Other');
    setEditNotes(item.notes || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    updateShoppingListItem(editingItem.id, {
      name: editName.trim(),
      quantity: parseInt(editQuantity) || 1,
      unit: editUnit,
      category: editCategory,
      notes: editNotes.trim() || undefined,
    });
    setShowEditModal(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeShoppingListItem(itemId),
      },
    ]);
  };

  const handleClearCompleted = () => {
    const completedItems = shoppingList.filter(item => item.isCompleted);
    if (completedItems.length === 0) {
      Alert.alert(
        'No Completed Items',
        'There are no completed items to clear.'
      );
      return;
    }

    Alert.alert(
      'Clear Completed Items',
      `Remove ${completedItems.length} completed item${completedItems.length !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            completedItems.forEach(item => removeShoppingListItem(item.id));
          },
        },
      ]
    );
  };

  const handleCleanupDuplicates = () => {
    // Find duplicates (case-insensitive name matching)
    const duplicates: { [key: string]: any[] } = {};
    
    shoppingList.forEach(item => {
      const key = item.name.toLowerCase();
      if (!duplicates[key]) {
        duplicates[key] = [];
      }
      duplicates[key].push(item);
    });

    // Filter out groups with only one item
    const duplicateGroups = Object.values(duplicates).filter(group => group.length > 1);
    
    if (duplicateGroups.length === 0) {
      Alert.alert('No Duplicates', 'No duplicate items found in your shopping list.');
      return;
    }

    let totalMerged = 0;
    let totalRemoved = 0;

    duplicateGroups.forEach(group => {
      if (group.length < 2) return;

      const firstItem = group[0];
      const totalQuantity = group.reduce((sum, item) => sum + item.quantity, 0);
      const combinedNotes = group
        .map(item => item.notes)
        .filter(note => note && note.trim())
        .join('; ');

      // Update first item with combined data
      updateShoppingListItem(firstItem.id, {
        quantity: totalQuantity,
        notes: combinedNotes,
      });

      // Remove other items
      group.slice(1).forEach(item => {
        removeShoppingListItem(item.id);
        totalRemoved++;
      });

      totalMerged++;
    });

    Alert.alert(
      'Duplicates Cleaned Up',
      `Merged ${totalMerged} duplicate groups and removed ${totalRemoved} duplicate items.`
    );
  };

  const handleSyncWithPantry = () => {
    const summary = shoppingListSyncService.getSyncSummary(
      recipes,
      pantry,
      shoppingList
    );

    const messages: string[] = [];

    if (summary.alreadyStocked.length > 0) {
      messages.push(
        `${summary.alreadyStocked.length} item(s) already in pantry: ${summary.alreadyStocked.map(i => i.name).join(', ')}`
      );
    }

    if (summary.missingFromRecipes.length > 0) {
      messages.push(
        `${summary.missingFromRecipes.length} missing ingredient(s) from recipes can be added`
      );
    }

    if (summary.duplicateGroups.length > 0) {
      messages.push(
        `${summary.duplicateGroups.length} duplicate group(s) found`
      );
    }

    if (messages.length === 0) {
      Alert.alert('Sync Complete', 'Shopping list is in sync with your pantry.');
      return;
    }

    Alert.alert('Sync with Pantry', messages.join('\n\n'), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sync All',
        onPress: async () => {
          if (summary.alreadyStocked.length > 0) {
            Alert.alert(
              'Remove Stocked Items?',
              `Remove ${summary.alreadyStocked.length} item(s) already in pantry?`,
              [
                { text: 'Keep', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => {
                    summary.alreadyStocked.forEach(item =>
                      removeShoppingListItem(item.id)
                    );
                  },
                },
              ]
            );
          }

          if (summary.missingFromRecipes.length > 0) {
            for (const ingredient of summary.missingFromRecipes) {
              await addShoppingListItem({
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                category: ingredient.category,
                notes: ingredient.sourceRecipe
                  ? `From recipe: ${ingredient.sourceRecipe}`
                  : undefined,
                price: 0,
                isShared: true,
              });
            }
          }

          if (summary.duplicateGroups.length > 0) {
            shoppingListSyncService.mergeDuplicateItems(
              summary.duplicateGroups,
              updateShoppingListItem,
              removeShoppingListItem
            );
          }

          Alert.alert('Sync Complete', 'Shopping list has been updated.');
        },
      },
    ]);
  };

  // Filter items based on search
  const filteredItems = shoppingList.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate progress
  const totalItems = shoppingList.length;
  const completedItems = shoppingList.filter(item => item.isCompleted).length;
  const progressPercentage =
    totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const renderItem = ({ item }: { item: ShoppingListItem }) => (
    <PantryCard variant='default' padding='md'>
      <View style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleToggleComplete(item)}
          activeOpacity={0.8}
        >
          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkbox,
                item.isCompleted && styles.checkboxCompleted,
              ]}
            >
              {item.isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>

          <View style={styles.itemInfo}>
            <Text
              style={[
                styles.itemName,
                item.isCompleted && styles.itemNameCompleted,
              ]}
            >
              {item.name}
            </Text>
            <Text style={styles.itemDetails}>
              {item.quantity} {item.unit}
              {item.notes && ` • ${item.notes}`}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.itemActions}>
          <PantryButton
            title='Edit'
            onPress={() => handleEditItem(item)}
            variant='outline'
            size='sm'
          />
          <PantryButton
            title='Delete'
            onPress={() => handleDeleteItem(item.id)}
            variant='error'
            size='sm'
          />
        </View>
      </View>
    </PantryCard>
  );

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Shopping List'
        subtitle='Track your grocery shopping'
        gradient='citrus'
        rightAction={{
          icon: '➕',
          onPress: () => setShowAddModal(true),
        }}
      />

      <View style={styles.content}>
        {/* Progress Section */}
        <PantryCard variant='elevated' padding='md' margin='none'>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>Shopping Progress</Text>
            <Text style={styles.progressPercentage}>
              {completedItems}/{totalItems} ({Math.round(progressPercentage)}%)
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` },
                ]}
              />
            </View>
          </View>
        </PantryCard>

        {/* Search Section */}
        <PantryCard variant='fresh' padding='md'>
          <TextInput
            style={styles.searchInput}
            placeholder='Search shopping list items...'
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.neutral[400]}
          />
        </PantryCard>

        {/* Quick Actions */}
        <PantryCard variant='warm' padding='md'>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <PantryButton
              title='Sync with Pantry'
              onPress={handleSyncWithPantry}
              variant='outline'
              size='sm'
              icon='🔄'
              fullWidth
            />
            <PantryButton
              title='Cleanup Duplicates'
              onPress={handleCleanupDuplicates}
              variant='outline'
              size='sm'
              icon='🔧'
              fullWidth
            />
            <PantryButton
              title='Clear Completed'
              onPress={handleClearCompleted}
              variant='warning'
              size='sm'
              icon='🗑️'
              fullWidth
            />
          </View>
        </PantryCard>

        {/* Shopping List */}
        <View style={styles.listContainer}>
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
                <Text style={styles.emptyStateIcon}>🛒</Text>
                <Text style={styles.emptyStateText}>No shopping items</Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery
                    ? 'No items match your search'
                    : 'Add items to your shopping list to get started!'}
                </Text>
                <PantryButton
                  title='Add First Item'
                  onPress={() => setShowAddModal(true)}
                  variant='primary'
                  size='md'
                  fullWidth
                />
              </View>
            </PantryCard>
          )}
        </View>
      </View>

      {/* Add Item Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <PantryCard variant='elevated' padding='lg'>
              <Text style={styles.modalTitle}>Add Shopping Item</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Item Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder='e.g., Milk, Bread, Apples'
                  value={newItemName}
                  onChangeText={setNewItemName}
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder='1'
                    value={newItemQuantity}
                    onChangeText={setNewItemQuantity}
                    keyboardType='numeric'
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    placeholder='piece'
                    value={newItemUnit}
                    onChangeText={setNewItemUnit}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <PantryButton
                  title='Cancel'
                  onPress={() => setShowAddModal(false)}
                  variant='outline'
                  size='md'
                />
                <PantryButton
                  title='Add Item'
                  onPress={handleAddItem}
                  variant='primary'
                  size='md'
                />
              </View>
            </PantryCard>
          </View>
        </View>
      )}

      {/* Edit Item Modal */}
      <Modal visible={showEditModal} animationType='slide' transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <PantryCard variant='elevated' padding='lg'>
              <Text style={styles.modalTitle}>Edit Item</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Item Name</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={editQuantity}
                    onChangeText={setEditQuantity}
                    keyboardType='numeric'
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    value={editUnit}
                    onChangeText={setEditUnit}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryRow}>
                    {PANTRY_CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChip,
                          editCategory === cat && styles.categoryChipActive,
                        ]}
                        onPress={() => setEditCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            editCategory === cat &&
                              styles.categoryChipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={styles.input}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>

              <View style={styles.modalActions}>
                <PantryButton
                  title='Cancel'
                  onPress={() => setShowEditModal(false)}
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressText: {
    ...typography.body,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  progressPercentage: {
    ...typography.body,
    color: colors.neutral[700],
    fontWeight: '600',
  },
  progressBarContainer: {
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.neutral[200],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 6,
  },
  searchInput: {
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
  actionsGrid: {
    gap: spacing.sm,
  },
  listContainer: {
    flex: 1,
    padding: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.body,
    color: colors.neutral[800],
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  itemNameCompleted: {
    textDecorationLine: 'line-through',
    color: colors.neutral[500],
  },
  itemDetails: {
    ...typography.bodySmall,
    color: colors.neutral[600],
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.neutral[800],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.body,
    color: colors.neutral[700],
    fontWeight: '500',
    marginBottom: spacing.xs,
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
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
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
  },
  categoryChipTextActive: {
    color: '#fff',
  },
});
