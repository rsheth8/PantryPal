import React, { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import PantryHeader from './PantryHeader';
import PantryCard from './PantryCard';
import PantryButton from './PantryButton';
import { typography, spacing, borderRadius } from '../utils/designSystem';
import { useTheme, ThemeColors } from '../theme';
import { categorizeItem } from '../utils/helpers';
import { useMultiUserStore } from '../store/useMultiUserStore';

const CATEGORY_OPTIONS = [
  'Auto',
  'Dairy & Eggs',
  'Fruits & Vegetables',
  'Grains & Bread',
  'Meat & Fish',
  'Condiments',
  'Snacks',
  'Other',
];
const UNIT_OPTIONS = ['piece', 'lb', 'oz', 'kg', 'g', 'L', 'mL', 'cup', 'pack'];

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  initialName?: string;
  onAdded?: (name: string) => void;
}

export default function AddItemModal({
  visible,
  onClose,
  initialName = '',
  onAdded,
}: AddItemModalProps) {
  const addGroceryItem = useMultiUserStore(state => state.addGroceryItem);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [name, setName] = useState(initialName);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('piece');
  const [category, setCategory] = useState('Auto');
  const [expiration, setExpiration] = useState('');
  const [notes, setNotes] = useState('');

  // Keep the name field in sync when opened with a prefilled value
  useEffect(() => {
    if (visible) setName(initialName);
  }, [visible, initialName]);

  const reset = () => {
    setName('');
    setQuantity('1');
    setUnit('piece');
    setCategory('Auto');
    setExpiration('');
    setNotes('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const resolvedCategory =
      category === 'Auto' ? categorizeItem(name.trim()) : category;

    await addGroceryItem({
      name: name.trim(),
      quantity: parseInt(quantity) || 1,
      unit,
      category: resolvedCategory,
      expirationDate: expiration.trim(),
      notes: notes.trim(),
      price: 0,
      isShared: true,
    });

    const addedName = name.trim();
    reset();
    onClose();
    onAdded?.(addedName);
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
    >
      <View style={styles.container}>
        <PantryHeader
          title='Add Item'
          subtitle='Add a new item to your pantry'
          gradient='primary'
          showBackButton
          onBackPress={handleClose}
        />

        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <PantryCard variant='elevated' padding='lg'>
            <Text style={styles.fieldLabel}>Item name *</Text>
            <TextInput
              style={styles.input}
              placeholder='e.g., Milk, Apples, Chicken'
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.neutral[400]}
            />

            <Text style={styles.fieldLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder='1'
              value={quantity}
              onChangeText={setQuantity}
              keyboardType='numeric'
              placeholderTextColor={colors.neutral[400]}
            />

            <Text style={styles.fieldLabel}>Unit</Text>
            <View style={styles.chipRow}>
              {UNIT_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, unit === option && styles.chipActive]}
                  onPress={() => setUnit(option)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      unit === option && styles.chipTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORY_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.chip,
                    category === option && styles.chipActive,
                  ]}
                  onPress={() => setCategory(option)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === option && styles.chipTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Expiration date</Text>
            <TextInput
              style={styles.input}
              placeholder='YYYY-MM-DD (optional)'
              value={expiration}
              onChangeText={setExpiration}
              placeholderTextColor={colors.neutral[400]}
            />

            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder='Optional notes'
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholderTextColor={colors.neutral[400]}
            />

            <View style={styles.actions}>
              <PantryButton
                title='Cancel'
                onPress={handleClose}
                variant='outline'
                size='md'
              />
              <PantryButton
                title='Save Item'
                onPress={handleSave}
                variant='primary'
                size='md'
              />
            </View>
          </PantryCard>
        </ScrollView>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    chip: {
      backgroundColor: colors.neutral[100],
      borderColor: colors.neutral[200],
      borderRadius: borderRadius.pill,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipActive: {
      backgroundColor: colors.primary[500],
      borderColor: colors.primary[500],
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    chipText: {
      ...typography.bodySmall,
      color: colors.neutral[700],
      fontWeight: '500',
    },
    chipTextActive: {
      color: '#fff',
    },
    container: {
      backgroundColor: colors.neutral[50],
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    fieldLabel: {
      ...typography.bodySmall,
      color: colors.neutral[700],
      fontWeight: '600',
      marginBottom: spacing.xs,
      marginTop: spacing.sm,
    },
    input: {
      backgroundColor: colors.neutral[100],
      borderColor: colors.neutral[200],
      borderRadius: borderRadius.input,
      borderWidth: 1,
      color: colors.neutral[900],
      fontSize: 16,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
  });
