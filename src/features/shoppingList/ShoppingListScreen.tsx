import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  FadeSlideIn,
  EmptyState,
  ProgressBar,
  Confetti,
  useToast,
} from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles, useTheme } from '../../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import { categorizeItem } from '../../utils/helpers';
import { haptics } from '../../utils/haptics';
import { shoppingListSyncService } from '../../services/shoppingListSyncService';
import { ShoppingListItem } from '../../types';

export default function ShoppingListScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const { showToast } = useToast();
  const {
    shoppingList,
    pantry,
    recipes,
    addShoppingListItem,
    updateShoppingListItem,
    removeShoppingListItem,
    toggleShoppingItemComplete,
    addGroceryItem,
  } = useMultiUserStore();

  const [quickAddText, setQuickAddText] = useState('');
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editUnit, setEditUnit] = useState('pcs');
  const [celebrate, setCelebrate] = useState(false);
  const wasCompleteRef = useRef(false);

  const { activeList, completedCount, totalCount, progress } = useMemo(() => {
    const sorted = shoppingList.slice().sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return (a.category ?? '').localeCompare(b.category ?? '');
    });
    const completed = shoppingList.filter(item => item.isCompleted).length;
    return {
      activeList: sorted,
      completedCount: completed,
      totalCount: shoppingList.length,
      progress: shoppingList.length > 0 ? completed / shoppingList.length : 0,
    };
  }, [shoppingList]);

  // Celebrate when the list transitions to fully complete.
  const isComplete = totalCount > 0 && completedCount === totalCount;
  React.useEffect(() => {
    if (isComplete && !wasCompleteRef.current) {
      wasCompleteRef.current = true;
      setCelebrate(true);
      haptics.success();
    } else if (!isComplete) {
      wasCompleteRef.current = false;
    }
  }, [isComplete]);

  const handleQuickAdd = async () => {
    const name = quickAddText.trim();
    if (!name) return;
    setQuickAddText('');
    await addShoppingListItem({
      name,
      quantity: 1,
      unit: 'pcs',
      category: categorizeItem(name),
      notes: '',
      isShared: true,
    });
    haptics.light();
  };

  const handleDeleteItem = (item: ShoppingListItem) => {
    removeShoppingListItem(item.id);
    showToast(`Removed ${item.name}`, {
      type: 'info',
      actionLabel: 'Undo',
      onAction: () =>
        addShoppingListItem({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          notes: item.notes ?? '',
          isShared: item.isShared,
        }),
    });
  };

  const openEdit = (item: ShoppingListItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditQuantity(String(item.quantity));
    setEditUnit(item.unit);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const name = editName.trim();
    if (!name) {
      showToast('Please enter an item name', { type: 'warning' });
      return;
    }
    await updateShoppingListItem(editingItem.id, {
      name,
      quantity: parseFloat(editQuantity) || 1,
      unit: editUnit.trim() || 'pcs',
    });
    setEditingItem(null);
    showToast('Item updated', { type: 'success' });
  };

  const handleSyncFromRecipes = () => {
    const missing = shoppingListSyncService.syncMissingIngredients(
      recipes,
      pantry,
      shoppingList
    );
    if (missing.length === 0) {
      showToast('No missing ingredients — you have everything!', {
        type: 'success',
      });
      return;
    }
    Alert.alert(
      'Sync from recipes',
      `Add ${missing.length} missing ingredient${missing.length === 1 ? '' : 's'} from your saved recipes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add All',
          onPress: async () => {
            for (const ingredient of missing) {
              await addShoppingListItem({
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                category: ingredient.category,
                notes: ingredient.sourceRecipe
                  ? `For: ${ingredient.sourceRecipe}`
                  : '',
                isShared: true,
              });
            }
            showToast(`Added ${missing.length} ingredients`, {
              type: 'success',
            });
          },
        },
      ]
    );
  };

  const handleMoveCompletedToPantry = () => {
    const completed = shoppingList.filter(item => item.isCompleted);
    if (completed.length === 0) {
      showToast('Nothing checked off yet', { type: 'info' });
      return;
    }
    Alert.alert(
      'Finish shopping trip',
      `Move ${completed.length} purchased item${completed.length === 1 ? '' : 's'} into your pantry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Just clear them',
          style: 'destructive',
          onPress: () => {
            completed.forEach(item => removeShoppingListItem(item.id));
            showToast('Cleared completed items', { type: 'info' });
          },
        },
        {
          text: 'Move to Pantry',
          onPress: async () => {
            for (const item of completed) {
              await addGroceryItem(
                {
                  name: item.name,
                  quantity: item.quantity,
                  unit: item.unit,
                  category: item.category ?? categorizeItem(item.name),
                  expirationDate: '',
                  price: item.price,
                  notes: item.notes,
                  isShared: item.isShared,
                },
                item.isShared
              );
              removeShoppingListItem(item.id);
            }
            haptics.success();
            showToast(
              `Moved ${completed.length} item${completed.length === 1 ? '' : 's'} to pantry 🎉`,
              { type: 'success' }
            );
          },
        },
      ]
    );
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: ShoppingListItem;
    index: number;
  }) => (
    <FadeSlideIn delay={Math.min(index, 8) * 40}>
      <PantryCard variant='default' padding='md'>
        <View style={styles.itemContainer}>
          <TouchableOpacity
            style={styles.itemContent}
            onPress={() => {
              haptics.selection();
              toggleShoppingItemComplete(item.id);
            }}
            activeOpacity={0.7}
            accessibilityRole='checkbox'
            accessibilityState={{ checked: item.isCompleted }}
            accessibilityLabel={item.name}
          >
            <View
              style={[
                styles.checkbox,
                item.isCompleted && styles.checkboxCompleted,
              ]}
            >
              {item.isCompleted && <Text style={styles.checkmark}>✓</Text>}
            </View>

            <View style={styles.itemInfo}>
              <Text
                style={[
                  styles.itemName,
                  item.isCompleted && styles.itemNameCompleted,
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text style={styles.itemDetails} numberOfLines={1}>
                {item.quantity} {item.unit}
                {item.category ? ` · ${item.category}` : ''}
                {item.notes ? ` · ${item.notes}` : ''}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => openEdit(item)}
              accessibilityLabel={`Edit ${item.name}`}
            >
              <Text style={styles.iconButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleDeleteItem(item)}
              accessibilityLabel={`Delete ${item.name}`}
            >
              <Text style={styles.iconButtonText}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </PantryCard>
    </FadeSlideIn>
  );

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Shopping List'
        subtitle={
          totalCount === 0
            ? 'What do you need?'
            : isComplete
              ? 'All done — great job! 🎉'
              : `${totalCount - completedCount} item${totalCount - completedCount === 1 ? '' : 's'} to go`
        }
        gradient='citrus'
      />

      <View style={styles.content}>
        {/* Progress */}
        {totalCount > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {completedCount}/{totalCount} picked up
              </Text>
              <Text style={styles.progressPercentage}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
            <ProgressBar
              progress={progress}
              height={10}
              gradient={[theme.palette.citrus[400], theme.palette.sage[500]]}
            />
          </View>
        )}

        {/* Quick add */}
        <View style={styles.quickAddRow}>
          <TextInput
            style={styles.quickAddInput}
            placeholder='Add an item... e.g. Milk'
            placeholderTextColor={theme.colors.textMuted}
            value={quickAddText}
            onChangeText={setQuickAddText}
            onSubmitEditing={handleQuickAdd}
            returnKeyType='done'
          />
          <PantryButton title='Add' onPress={handleQuickAdd} size='md' />
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <PantryButton
            title='Sync from recipes'
            onPress={handleSyncFromRecipes}
            variant='outline'
            size='sm'
            icon='🔄'
            style={styles.actionButton}
          />
          <PantryButton
            title='Finish trip'
            onPress={handleMoveCompletedToPantry}
            variant='outline'
            size='sm'
            icon='🏁'
            style={styles.actionButton}
          />
        </View>

        {/* List */}
        {activeList.length > 0 ? (
          <FlatList
            data={activeList}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <EmptyState
            emoji='🛒'
            title='Your list is empty'
            message='Add items above, or sync missing ingredients from your saved recipes.'
          />
        )}
      </View>

      {/* Edit modal */}
      <Modal
        visible={editingItem !== null}
        transparent
        animationType='fade'
        onRequestClose={() => setEditingItem(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <PantryCard variant='elevated' padding='lg' margin='none'>
              <Text style={styles.modalTitle}>Edit Item</Text>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor={theme.colors.textMuted}
              />
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={editQuantity}
                    onChangeText={setEditQuantity}
                    keyboardType='decimal-pad'
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    value={editUnit}
                    onChangeText={setEditUnit}
                  />
                </View>
              </View>
              <View style={styles.modalActions}>
                <PantryButton
                  title='Cancel'
                  onPress={() => setEditingItem(null)}
                  variant='outline'
                  size='md'
                  style={styles.actionButton}
                />
                <PantryButton
                  title='Save'
                  onPress={handleSaveEdit}
                  variant='primary'
                  size='md'
                  style={styles.actionButton}
                />
              </View>
            </PantryCard>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {celebrate && <Confetti onComplete={() => setCelebrate(false)} />}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    actionButton: {
      flex: 1,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    checkbox: {
      alignItems: 'center',
      borderColor: theme.colors.borderStrong,
      borderRadius: 13,
      borderWidth: 2,
      height: 26,
      justifyContent: 'center',
      marginRight: spacing.md,
      width: 26,
    },
    checkboxCompleted: {
      backgroundColor: theme.colors.success,
      borderColor: theme.colors.success,
    },
    checkmark: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    iconButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: spacing.xs + 2,
    },
    iconButtonText: {
      fontSize: 16,
    },
    input: {
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.input,
      borderWidth: 1,
      color: theme.colors.text,
      fontSize: 16,
      height: 44,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
    },
    inputHalf: {
      flex: 1,
    },
    inputLabel: {
      ...typography.label,
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
    },
    inputRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    itemActions: {
      flexDirection: 'row',
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
      ...typography.caption,
      color: theme.colors.textMuted,
    },
    itemInfo: {
      flex: 1,
      marginRight: spacing.sm,
    },
    itemName: {
      ...typography.body,
      color: theme.colors.text,
      fontWeight: '500',
    },
    itemNameCompleted: {
      color: theme.colors.textMuted,
      textDecorationLine: 'line-through',
    },
    listContent: {
      paddingBottom: spacing.xxl,
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    modalContent: {
      maxWidth: 400,
      width: '90%',
    },
    modalOverlay: {
      alignItems: 'center',
      backgroundColor: theme.colors.overlay,
      flex: 1,
      justifyContent: 'center',
    },
    modalTitle: {
      ...typography.h3,
      color: theme.colors.text,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    progressHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    progressPercentage: {
      ...typography.bodySmall,
      color: theme.colors.textSecondary,
      fontWeight: '700',
    },
    progressSection: {
      marginBottom: spacing.md,
    },
    progressText: {
      ...typography.bodySmall,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    quickAddInput: {
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
    quickAddRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
  });
