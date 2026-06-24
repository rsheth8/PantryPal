import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
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

export default function ShoppingListScreen() {
  const {
    shoppingList,
    addShoppingListItem,
    updateShoppingListItem,
    removeShoppingListItem,
  } = useMultiUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('piece');

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

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

  const handleToggleComplete = (itemId: string) => {
    const item = shoppingList.find(item => item.id === itemId);
    if (item) {
      updateShoppingListItem(itemId, { isCompleted: !item.isCompleted });
    }
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

  const handleSyncWithPantry = () => {
    Alert.alert(
      'Sync with Pantry',
      'Sync missing ingredients from recipes to shopping list'
    );
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

  const renderItem = ({ item }: { item: any }) => (
    <PantryCard variant='default' padding='md'>
      <View style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleToggleComplete(item.id)}
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
            onPress={() => Alert.alert('Edit Item', `Edit ${item.name}`)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  actionsGrid: {
    gap: spacing.sm,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.neutral[300],
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkboxContainer: {
    marginRight: spacing.md,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
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
  input: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.input,
    borderWidth: 1,
    color: colors.neutral[900],
    fontSize: 16,
    height: 44,
    paddingHorizontal: spacing.md,
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
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  itemActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  itemContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  itemContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  itemDetails: {
    ...typography.bodySmall,
    color: colors.neutral[600],
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
    color: colors.neutral[500],
    textDecorationLine: 'line-through',
  },
  listContainer: {
    flex: 1,
    padding: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalContent: {
    maxWidth: 400,
    width: '90%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.neutral[800],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  progressBar: {
    backgroundColor: colors.neutral[200],
    borderRadius: 6,
    height: 12,
    overflow: 'hidden',
  },
  progressBarContainer: {
    marginTop: spacing.xs,
  },
  progressFill: {
    backgroundColor: colors.success,
    borderRadius: 6,
    height: '100%',
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressPercentage: {
    ...typography.body,
    color: colors.neutral[700],
    fontWeight: '600',
  },
  progressText: {
    ...typography.body,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  searchInput: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.input,
    borderWidth: 1,
    color: colors.neutral[900],
    fontSize: 16,
    height: 44,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
});
