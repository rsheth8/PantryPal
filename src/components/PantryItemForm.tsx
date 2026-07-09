import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { GroceryItem } from '../types';
import { categorizeItem, PANTRY_CATEGORIES } from '../utils/helpers';
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '../utils/designSystem';

export interface PantryItemFormData {
  name: string;
  quantity: string;
  unit: string;
  category: string;
  expirationDate: string;
  notes: string;
  price: string;
  isShared: boolean;
}

const emptyForm = (defaultIsShared = true): PantryItemFormData => ({
  name: '',
  quantity: '1',
  unit: 'piece',
  category: 'Other',
  expirationDate: '',
  notes: '',
  price: '',
  isShared: defaultIsShared,
});

export function usePantryItemForm(
  initialItem?: GroceryItem | null,
  prefillName?: string,
  defaultIsShared = true
) {
  const [form, setForm] = useState<PantryItemFormData>(() => {
    if (initialItem) {
      return {
        name: initialItem.name,
        quantity: String(initialItem.quantity),
        unit: initialItem.unit,
        category: initialItem.category,
        expirationDate: initialItem.expirationDate || '',
        notes: initialItem.notes || '',
        price: initialItem.price != null ? String(initialItem.price) : '',
        isShared: initialItem.isShared,
      };
    }
    return { ...emptyForm(defaultIsShared), name: prefillName || '' };
  });

  useEffect(() => {
    if (prefillName && !initialItem) {
      setForm(prev => ({
        ...prev,
        name: prefillName,
        category: categorizeItem(prefillName),
      }));
    }
  }, [prefillName, initialItem]);

  const updateField = <K extends keyof PantryItemFormData>(
    field: K,
    value: PantryItemFormData[K]
  ) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && typeof value === 'string') {
        next.category = categorizeItem(value);
      }
      return next;
    });
  };

  const resetForm = (item?: GroceryItem | null, name?: string) => {
    if (item) {
      setForm({
        name: item.name,
        quantity: String(item.quantity),
        unit: item.unit,
        category: item.category,
        expirationDate: item.expirationDate || '',
        notes: item.notes || '',
        price: item.price != null ? String(item.price) : '',
        isShared: item.isShared,
      });
    } else {
      setForm({ ...emptyForm(defaultIsShared), name: name || '' });
    }
  };

  return { form, updateField, resetForm, setForm };
}

export function validatePantryItemForm(
  data: PantryItemFormData
): string | null {
  if (!data.name.trim()) return 'Please enter an item name';
  const qty = parseInt(data.quantity, 10);
  if (isNaN(qty) || qty < 0) return 'Please enter a valid quantity';
  if (data.expirationDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.expirationDate)) {
    return 'Expiration date must be YYYY-MM-DD';
  }
  return null;
}

export function pantryFormToItemPayload(data: PantryItemFormData) {
  return {
    name: data.name.trim(),
    quantity: parseInt(data.quantity, 10) || 1,
    unit: data.unit.trim() || 'piece',
    category: data.category,
    expirationDate:
      data.expirationDate || new Date().toISOString().split('T')[0],
    notes: data.notes.trim() || undefined,
    price: data.price ? parseFloat(data.price) : undefined,
    isShared: data.isShared,
  };
}

export function PantryItemFormFields({
  form,
  updateField,
}: {
  form: PantryItemFormData;
  updateField: <K extends keyof PantryItemFormData>(
    field: K,
    value: PantryItemFormData[K]
  ) => void;
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholder='e.g., Milk, Bread, Chicken'
          value={form.name}
          onChangeText={v => updateField('name', v)}
          placeholderTextColor={colors.neutral[400]}
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>Quantity *</Text>
          <TextInput
            style={styles.input}
            placeholder='1'
            value={form.quantity}
            onChangeText={v => updateField('quantity', v)}
            keyboardType='numeric'
            placeholderTextColor={colors.neutral[400]}
          />
        </View>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>Unit</Text>
          <TextInput
            style={styles.input}
            placeholder='piece'
            value={form.unit}
            onChangeText={v => updateField('unit', v)}
            placeholderTextColor={colors.neutral[400]}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {PANTRY_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  form.category === cat && styles.chipActive,
                ]}
                onPress={() => updateField('category', cat)}
              >
                <Text
                  style={[
                    styles.chipText,
                    form.category === cat && styles.chipTextActive,
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
        <Text style={styles.inputLabel}>Expiration Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder='2026-12-31'
          value={form.expirationDate}
          onChangeText={v => updateField('expirationDate', v)}
          placeholderTextColor={colors.neutral[400]}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder='Optional notes'
          value={form.notes}
          onChangeText={v => updateField('notes', v)}
          multiline
          placeholderTextColor={colors.neutral[400]}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Price ($)</Text>
        <TextInput
          style={styles.input}
          placeholder='0.00'
          value={form.price}
          onChangeText={v => updateField('price', v)}
          keyboardType='decimal-pad'
          placeholderTextColor={colors.neutral[400]}
        />
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.inputLabel}>Share with household</Text>
          <Text style={styles.switchHint}>
            Visible to all household members
          </Text>
        </View>
        <Switch
          value={form.isShared}
          onValueChange={v => updateField('isShared', v)}
          trackColor={{
            false: colors.neutral[300],
            true: colors.primary[300],
          }}
          thumbColor={form.isShared ? colors.primary[500] : colors.neutral[400]}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: spacing.md,
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
  textArea: {
    height: 80,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flex1: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  chipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.neutral[700],
  },
  chipTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  switchHint: {
    ...typography.caption,
    color: colors.neutral[500],
    marginTop: 2,
  },
});
