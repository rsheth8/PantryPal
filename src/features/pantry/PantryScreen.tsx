import React, { useMemo, useState } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  AnimatedPressable,
  FadeSlideIn,
  EmptyState,
  useToast,
} from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles, useTheme } from '../../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import {
  categorizeItem,
  getDaysUntilExpiration,
  formatDate,
} from '../../utils/helpers';
import { haptics } from '../../utils/haptics';
import { GroceryItem } from '../../types';

const CATEGORIES = [
  'Fruits & Vegetables',
  'Dairy & Eggs',
  'Meat & Fish',
  'Grains & Bread',
  'Condiments',
  'Snacks',
  'Beverages',
  'Frozen',
  'Other',
];

const UNITS = ['pcs', 'lbs', 'oz', 'kg', 'g', 'L', 'mL', 'pack', 'can', 'box'];

const EXPIRY_PRESETS = [
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
];

interface ItemFormState {
  name: string;
  quantity: string;
  unit: string;
  category: string;
  expirationDate: string;
  price: string;
  notes: string;
  isShared: boolean;
}

const emptyForm = (defaultShared: boolean): ItemFormState => ({
  name: '',
  quantity: '1',
  unit: 'pcs',
  category: '',
  expirationDate: '',
  price: '',
  notes: '',
  isShared: defaultShared,
});

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function PantryScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const { showToast } = useToast();
  const {
    pantry,
    preferences,
    addGroceryItem,
    updateGroceryItem,
    removeGroceryItem,
    markItemAsUsed,
    refreshPantry,
  } = useMultiUserStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'expiration' | 'category'>(
    'expiration'
  );
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [form, setForm] = useState<ItemFormState>(emptyForm(true));
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const activeItems = useMemo(
    () => pantry.filter(item => !item.isUsed),
    [pantry]
  );

  const filteredItems = useMemo(
    () =>
      activeItems
        .filter(item => {
          const q = searchQuery.toLowerCase();
          const matchesSearch =
            item.name.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q);
          const matchesCategory =
            !selectedCategory || item.category === selectedCategory;
          return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case 'expiration': {
              const aTime = a.expirationDate
                ? new Date(a.expirationDate).getTime()
                : Infinity;
              const bTime = b.expirationDate
                ? new Date(b.expirationDate).getTime()
                : Infinity;
              return aTime - bTime;
            }
            case 'category':
              return a.category.localeCompare(b.category);
            default:
              return a.name.localeCompare(b.name);
          }
        }),
    [activeItems, searchQuery, selectedCategory, sortBy]
  );

  const categories = useMemo(
    () => [...new Set(activeItems.map(item => item.category))].sort(),
    [activeItems]
  );

  const openAddForm = () => {
    setEditingItem(null);
    setForm(emptyForm(preferences.defaultItemVisibility === 'shared'));
    setShowForm(true);
  };

  const openEditForm = (item: GroceryItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      category: item.category,
      expirationDate: item.expirationDate ?? '',
      price: item.price != null ? String(item.price) : '',
      notes: item.notes ?? '',
      isShared: item.isShared,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      showToast('Please enter an item name', { type: 'warning' });
      return;
    }
    const quantity = parseFloat(form.quantity) || 1;
    const category = form.category || categorizeItem(name);
    const price = form.price ? parseFloat(form.price) : undefined;

    setSaving(true);
    try {
      if (editingItem) {
        await updateGroceryItem(editingItem.id, {
          name,
          quantity,
          unit: form.unit,
          category,
          expirationDate: form.expirationDate,
          price,
          notes: form.notes || undefined,
          isShared: form.isShared,
        });
        showToast(`Updated ${name}`, { type: 'success' });
      } else {
        await addGroceryItem(
          {
            name,
            quantity,
            unit: form.unit,
            category,
            expirationDate: form.expirationDate,
            price,
            notes: form.notes || undefined,
            isShared: form.isShared,
          },
          form.isShared
        );
        showToast(`Added ${name} to pantry`, { type: 'success' });
      }
      setShowForm(false);
    } catch {
      showToast('Something went wrong saving the item', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUse = async (item: GroceryItem) => {
    await markItemAsUsed(item.id);
    showToast(`${item.name} marked as used`, {
      type: 'success',
      actionLabel: 'Undo',
      onAction: () => updateGroceryItem(item.id, { isUsed: false }),
    });
  };

  const handleDelete = (item: GroceryItem) => {
    Alert.alert('Remove item', `Remove ${item.name} from your pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeGroceryItem(item.id);
          showToast(`Removed ${item.name}`, {
            type: 'info',
            actionLabel: 'Undo',
            onAction: () =>
              addGroceryItem(
                {
                  name: item.name,
                  quantity: item.quantity,
                  unit: item.unit,
                  category: item.category,
                  expirationDate: item.expirationDate,
                  price: item.price,
                  notes: item.notes,
                  isShared: item.isShared,
                },
                item.isShared
              ),
          });
        },
      },
    ]);
  };

  const adjustQuantity = async (item: GroceryItem, delta: number) => {
    const next = Math.max(0, item.quantity + delta);
    haptics.selection();
    if (next === 0) {
      handleDelete(item);
      return;
    }
    await updateGroceryItem(item.id, { quantity: next });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshPantry();
    setRefreshing(false);
  };

  const renderExpiryBadge = (item: GroceryItem) => {
    if (!item.expirationDate) return null;
    const days = getDaysUntilExpiration(item.expirationDate);
    let label: string;
    let bg: string;
    let fg: string;
    if (days < 0) {
      label = 'Expired';
      bg = theme.colors.errorSoft;
      fg = theme.colors.error;
    } else if (days === 0) {
      label = 'Today';
      bg = theme.colors.errorSoft;
      fg = theme.colors.error;
    } else if (days <= preferences.expirationReminderDays) {
      label = days === 1 ? '1 day left' : `${days} days left`;
      bg = theme.colors.warningSoft;
      fg = theme.colors.warning;
    } else {
      label = formatDate(item.expirationDate);
      bg = theme.colors.successSoft;
      fg = theme.colors.success;
    }
    return (
      <View style={[styles.expiryBadge, { backgroundColor: bg }]}>
        <Text style={[styles.expiryBadgeText, { color: fg }]}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: GroceryItem;
    index: number;
  }) => (
    <FadeSlideIn delay={Math.min(index, 8) * 50}>
      <PantryCard variant='default' padding='md'>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <View style={styles.itemNameRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              {!item.isShared && <Text style={styles.privateTag}>🔒</Text>}
            </View>
            <Text style={styles.itemCategory}>{item.category}</Text>
          </View>
          <View style={styles.quantityStepper}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => adjustQuantity(item, -1)}
              accessibilityLabel={`Decrease ${item.name} quantity`}
            >
              <Text style={styles.stepperButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>
              {item.quantity} {item.unit}
            </Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => adjustQuantity(item, 1)}
              accessibilityLabel={`Increase ${item.name} quantity`}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.itemFooter}>
          {renderExpiryBadge(item)}
          <View style={styles.itemActions}>
            <PantryButton
              title='Use'
              onPress={() => handleUse(item)}
              variant='success'
              size='sm'
            />
            <PantryButton
              title='Edit'
              onPress={() => openEditForm(item)}
              variant='outline'
              size='sm'
            />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item)}
              accessibilityLabel={`Delete ${item.name}`}
            >
              <Text style={styles.deleteButtonText}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </PantryCard>
    </FadeSlideIn>
  );

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Pantry'
        subtitle={`${activeItems.length} item${activeItems.length === 1 ? '' : 's'} in stock`}
        gradient='fresh'
        rightAction={{ icon: '➕', onPress: openAddForm }}
      />

      {/* Search + filters */}
      <View style={styles.controls}>
        <TextInput
          style={styles.searchInput}
          placeholder='Search your pantry...'
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType='search'
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsContent}
        >
          <FilterChip
            label='All'
            active={!selectedCategory}
            onPress={() => setSelectedCategory(null)}
            styles={styles}
          />
          {categories.map(category => (
            <FilterChip
              key={category}
              label={category}
              active={selectedCategory === category}
              onPress={() =>
                setSelectedCategory(
                  selectedCategory === category ? null : category
                )
              }
              styles={styles}
            />
          ))}
        </ScrollView>

        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort:</Text>
          {(['expiration', 'name', 'category'] as const).map(option => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortChip,
                sortBy === option && styles.sortChipActive,
              ]}
              onPress={() => {
                haptics.selection();
                setSortBy(option);
              }}
            >
              <Text
                style={[
                  styles.sortChipText,
                  sortBy === option && styles.sortChipTextActive,
                ]}
              >
                {option === 'expiration'
                  ? 'Expiring'
                  : option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Items list */}
      {filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      ) : (
        <EmptyState
          emoji='🥫'
          title={
            searchQuery || selectedCategory
              ? 'No items found'
              : 'Pantry is empty'
          }
          message={
            searchQuery || selectedCategory
              ? 'Try adjusting your search or filters.'
              : 'Add your first item to start tracking freshness.'
          }
          actionLabel={
            searchQuery || selectedCategory ? undefined : 'Add First Item'
          }
          onAction={openAddForm}
        />
      )}

      {/* Add / Edit Item Modal */}
      <Modal
        visible={showForm}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setShowForm(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <PantryHeader
            title={editingItem ? 'Edit Item' : 'Add Item'}
            subtitle={
              editingItem
                ? `Editing ${editingItem.name}`
                : 'Add something to your pantry'
            }
            gradient='primary'
            showBackButton
            onBackPress={() => setShowForm(false)}
          />

          <ScrollView
            style={styles.modalContent}
            keyboardShouldPersistTaps='handled'
          >
            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder='e.g. Milk, Apples, Chicken breast'
              placeholderTextColor={theme.colors.textMuted}
              value={form.name}
              onChangeText={name =>
                setForm(prev => ({
                  ...prev,
                  name,
                  category: prev.category || '',
                }))
              }
              autoFocus={!editingItem}
            />

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Quantity</Text>
                <TextInput
                  style={styles.fieldInput}
                  keyboardType='decimal-pad'
                  value={form.quantity}
                  onChangeText={quantity =>
                    setForm(prev => ({ ...prev, quantity }))
                  }
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Unit</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.unitRow}>
                    {UNITS.map(unit => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.unitChip,
                          form.unit === unit && styles.unitChipActive,
                        ]}
                        onPress={() => setForm(prev => ({ ...prev, unit }))}
                      >
                        <Text
                          style={[
                            styles.unitChipText,
                            form.unit === unit && styles.unitChipTextActive,
                          ]}
                        >
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.unitRow}>
                {CATEGORIES.map(category => {
                  const selected =
                    form.category === category ||
                    (!form.category &&
                      form.name &&
                      categorizeItem(form.name) === category);
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.unitChip,
                        selected && styles.unitChipActive,
                      ]}
                      onPress={() => setForm(prev => ({ ...prev, category }))}
                    >
                      <Text
                        style={[
                          styles.unitChipText,
                          selected && styles.unitChipTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={styles.fieldLabel}>Expiration</Text>
            <View style={styles.presetRow}>
              {EXPIRY_PRESETS.map(preset => {
                const value = addDays(preset.days);
                const selected = form.expirationDate === value;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    style={[styles.unitChip, selected && styles.unitChipActive]}
                    onPress={() =>
                      setForm(prev => ({ ...prev, expirationDate: value }))
                    }
                  >
                    <Text
                      style={[
                        styles.unitChipText,
                        selected && styles.unitChipTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={styles.fieldInput}
              placeholder='Or type a date: YYYY-MM-DD'
              placeholderTextColor={theme.colors.textMuted}
              value={form.expirationDate}
              onChangeText={expirationDate =>
                setForm(prev => ({ ...prev, expirationDate }))
              }
              autoCapitalize='none'
            />

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Price (optional)</Text>
                <TextInput
                  style={styles.fieldInput}
                  keyboardType='decimal-pad'
                  placeholder='0.00'
                  placeholderTextColor={theme.colors.textMuted}
                  value={form.price}
                  onChangeText={price => setForm(prev => ({ ...prev, price }))}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Visibility</Text>
                <TouchableOpacity
                  style={styles.shareToggle}
                  onPress={() =>
                    setForm(prev => ({ ...prev, isShared: !prev.isShared }))
                  }
                >
                  <Text style={styles.shareToggleText}>
                    {form.isShared ? '👥 Shared' : '🔒 Private'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.fieldInput, styles.notesInput]}
              placeholder='e.g. Opened on Monday'
              placeholderTextColor={theme.colors.textMuted}
              value={form.notes}
              onChangeText={notes => setForm(prev => ({ ...prev, notes }))}
              multiline
            />

            <View style={styles.modalActions}>
              <PantryButton
                title='Cancel'
                onPress={() => setShowForm(false)}
                variant='outline'
                size='md'
                style={styles.modalActionButton}
              />
              <PantryButton
                title={editingItem ? 'Save Changes' : 'Add to Pantry'}
                onPress={handleSave}
                variant='primary'
                size='md'
                loading={saving}
                style={styles.modalActionButton}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  styles,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      haptic='selection'
      style={[styles.categoryChip, active && styles.categoryChipActive]}
    >
      <Text
        style={[
          styles.categoryChipText,
          active && styles.categoryChipTextActive,
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    categoryChip: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.pill,
      borderWidth: 1,
      marginRight: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
    },
    categoryChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    categoryChipText: {
      ...typography.bodySmall,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    categoryChipTextActive: {
      color: '#fff',
    },
    chipsContent: {
      paddingRight: spacing.md,
    },
    chipsRow: {
      flexGrow: 0,
      marginTop: spacing.sm,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    controls: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    deleteButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: spacing.sm,
    },
    deleteButtonText: {
      fontSize: 18,
    },
    expiryBadge: {
      borderRadius: borderRadius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    expiryBadgeText: {
      ...typography.caption,
      fontWeight: '700',
    },
    fieldHalf: {
      flex: 1,
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
      gap: spacing.md,
    },
    itemActions: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
    },
    itemCategory: {
      ...typography.caption,
      color: theme.colors.textMuted,
    },
    itemFooter: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    itemHeader: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    itemInfo: {
      flex: 1,
      marginRight: spacing.sm,
    },
    itemName: {
      ...typography.body,
      color: theme.colors.text,
      flexShrink: 1,
      fontWeight: '600',
    },
    itemNameRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
    },
    listContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    modalActionButton: {
      flex: 1,
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.xxl,
      marginTop: spacing.md,
    },
    modalContainer: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    modalContent: {
      flex: 1,
      padding: spacing.md,
    },
    notesInput: {
      minHeight: 70,
      textAlignVertical: 'top',
    },
    presetRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    privateTag: {
      fontSize: 12,
    },
    quantityStepper: {
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundSubtle,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.pill,
      borderWidth: 1,
      flexDirection: 'row',
    },
    quantityText: {
      ...typography.bodySmall,
      color: theme.colors.primary,
      fontWeight: '700',
      minWidth: 56,
      textAlign: 'center',
    },
    searchInput: {
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.input,
      borderWidth: 1,
      color: theme.colors.text,
      fontSize: 16,
      height: 44,
      paddingHorizontal: spacing.md,
    },
    shareToggle: {
      alignItems: 'center',
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.input,
      borderWidth: 1,
      justifyContent: 'center',
      marginBottom: spacing.md,
      minHeight: 44,
    },
    shareToggleText: {
      ...typography.bodySmall,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    sortChip: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs,
    },
    sortChipActive: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.secondary,
    },
    sortChipText: {
      ...typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    sortChipTextActive: {
      color: '#fff',
    },
    sortLabel: {
      ...typography.caption,
      color: theme.colors.textMuted,
      fontWeight: '600',
    },
    sortRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      marginVertical: spacing.sm,
    },
    stepperButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 32,
      width: 32,
    },
    stepperButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 18,
      fontWeight: '600',
    },
    unitChip: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.pill,
      borderWidth: 1,
      marginBottom: spacing.xs,
      marginRight: spacing.xs,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs,
    },
    unitChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    unitChipText: {
      ...typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    unitChipTextActive: {
      color: '#fff',
    },
    unitRow: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
  });
