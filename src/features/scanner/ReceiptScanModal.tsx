import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  FadeSlideIn,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles, useTheme } from '../../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import { haptics } from '../../utils/haptics';
import { ocrService, ReceiptItem } from '../../services/ocrService';
import { categorizeItem } from '../../utils/helpers';
import { useMultiUserStore } from '../../store/useMultiUserStore';

interface EditableItem extends ReceiptItem {
  key: string;
  include: boolean;
}

type Phase = 'intro' | 'scanning' | 'review';

export default function ReceiptScanModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const { showToast } = useToast();
  const addGroceryItem = useMultiUserStore(state => state.addGroceryItem);

  const [phase, setPhase] = useState<Phase>('intro');
  const [items, setItems] = useState<EditableItem[]>([]);
  const [adding, setAdding] = useState(false);

  const reset = () => {
    setPhase('intro');
    setItems([]);
    setAdding(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const runOcr = async (base64?: string) => {
    setPhase('scanning');
    haptics.medium();
    const parsed = await ocrService.scanReceipt(base64 ?? undefined);
    setItems(
      parsed.map((item, i) => ({
        ...item,
        // Normalize to the app's pantry categories.
        category: categorizeItem(item.name),
        key: `${item.name}-${i}`,
        include: true,
      }))
    );
    setPhase('review');
    if (parsed.length === 0) {
      showToast('No items detected — try a clearer photo', { type: 'warning' });
    }
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      const perm =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showToast('Permission needed to scan a receipt', { type: 'warning' });
        return;
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 })
          : await ImagePicker.launchImageLibraryAsync({
              base64: true,
              quality: 0.6,
            });
      if (result.canceled) return;
      await runOcr(result.assets[0]?.base64 ?? undefined);
    } catch {
      // Even if the picker fails, fall back to mock OCR so the flow is usable.
      await runOcr(undefined);
    }
  };

  const toggleItem = (key: string) => {
    haptics.selection();
    setItems(prev =>
      prev.map(i => (i.key === key ? { ...i, include: !i.include } : i))
    );
  };

  const updateName = (key: string, name: string) => {
    setItems(prev => prev.map(i => (i.key === key ? { ...i, name } : i)));
  };

  const updateQuantity = (key: string, delta: number) => {
    setItems(prev =>
      prev.map(i =>
        i.key === key ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
      )
    );
  };

  const selectedCount = items.filter(i => i.include).length;

  const handleAddAll = async () => {
    const chosen = items.filter(i => i.include && i.name.trim());
    if (chosen.length === 0) {
      showToast('Select at least one item', { type: 'warning' });
      return;
    }
    setAdding(true);
    try {
      for (const item of chosen) {
        await addGroceryItem(
          {
            name: item.name.trim(),
            quantity: item.quantity,
            unit: item.unit || 'pcs',
            category: categorizeItem(item.name),
            expirationDate: '',
            price: item.price,
            notes: 'Added from receipt',
            isShared: true,
          },
          true
        );
      }
      haptics.success();
      showToast(
        `Added ${chosen.length} item${chosen.length === 1 ? '' : 's'} to pantry 🎉`,
        { type: 'success' }
      );
      handleClose();
    } catch {
      showToast('Something went wrong adding items', { type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <PantryHeader
          title='Scan Receipt'
          subtitle={
            phase === 'review'
              ? `${selectedCount} of ${items.length} selected`
              : 'Add your whole shop at once'
          }
          gradient='berry'
          showBackButton
          onBackPress={handleClose}
        />

        {phase === 'intro' && (
          <View style={styles.introWrap}>
            <EmptyState
              emoji='🧾'
              title='Snap your grocery receipt'
              message='PantryPal reads the items and adds them to your pantry in one go. Take a photo or pick one from your library.'
            />
            <View style={styles.introActions}>
              <PantryButton
                title='Take a photo'
                onPress={() => pickImage('camera')}
                variant='primary'
                size='lg'
                icon='📷'
                fullWidth
              />
              <PantryButton
                title='Choose from library'
                onPress={() => pickImage('library')}
                variant='outline'
                size='lg'
                icon='🖼️'
                fullWidth
              />
            </View>
          </View>
        )}

        {phase === 'scanning' && (
          <View style={styles.scanningWrap}>
            <Text style={styles.scanningText}>Reading your receipt…</Text>
            {[0, 1, 2, 3, 4].map(i => (
              <PantryCard key={i} variant='default' padding='md'>
                <Skeleton height={16} width='60%' />
                <Skeleton height={12} width='30%' style={styles.skeletonGap} />
              </PantryCard>
            ))}
          </View>
        )}

        {phase === 'review' && (
          <>
            <ScrollView
              style={styles.reviewList}
              contentContainerStyle={styles.reviewContent}
              keyboardShouldPersistTaps='handled'
            >
              {items.length === 0 ? (
                <EmptyState
                  emoji='🔍'
                  title='No items found'
                  message='Try again with a clearer, well-lit photo of the receipt.'
                  actionLabel='Try again'
                  onAction={reset}
                />
              ) : (
                items.map((item, index) => (
                  <FadeSlideIn key={item.key} delay={Math.min(index, 10) * 40}>
                    <PantryCard variant='default' padding='md'>
                      <View style={styles.itemRow}>
                        <TouchableOpacity
                          style={[
                            styles.checkbox,
                            item.include && styles.checkboxOn,
                          ]}
                          onPress={() => toggleItem(item.key)}
                          accessibilityRole='checkbox'
                          accessibilityState={{ checked: item.include }}
                        >
                          {item.include && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </TouchableOpacity>

                        <View style={styles.itemBody}>
                          <TextInput
                            style={styles.nameInput}
                            value={item.name}
                            onChangeText={t => updateName(item.key, t)}
                            placeholderTextColor={theme.colors.textMuted}
                          />
                          <Text style={styles.itemMeta}>
                            {item.category}
                            {item.price ? ` · $${item.price.toFixed(2)}` : ''}
                          </Text>
                        </View>

                        <View style={styles.qtyStepper}>
                          <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => updateQuantity(item.key, -1)}
                          >
                            <Text style={styles.qtyButtonText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyValue}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => updateQuantity(item.key, 1)}
                          >
                            <Text style={styles.qtyButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </PantryCard>
                  </FadeSlideIn>
                ))
              )}
            </ScrollView>

            {items.length > 0 && (
              <View style={styles.footer}>
                <PantryButton
                  title={`Add ${selectedCount} to Pantry`}
                  onPress={handleAddAll}
                  variant='primary'
                  size='lg'
                  loading={adding}
                  icon='🥫'
                  fullWidth
                />
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    checkbox: {
      alignItems: 'center',
      borderColor: theme.colors.borderStrong,
      borderRadius: 13,
      borderWidth: 2,
      height: 26,
      justifyContent: 'center',
      marginRight: spacing.sm,
      width: 26,
    },
    checkboxOn: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
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
    footer: {
      borderTopColor: theme.colors.divider,
      borderTopWidth: 1,
      padding: spacing.md,
    },
    introActions: {
      gap: spacing.sm,
      padding: spacing.lg,
    },
    introWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    itemBody: {
      flex: 1,
      marginRight: spacing.sm,
    },
    itemMeta: {
      ...typography.caption,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    itemRow: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    nameInput: {
      ...typography.body,
      color: theme.colors.text,
      fontWeight: '600',
      padding: 0,
    },
    qtyButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 32,
      width: 30,
    },
    qtyButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 17,
      fontWeight: '700',
    },
    qtyStepper: {
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundSubtle,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.pill,
      borderWidth: 1,
      flexDirection: 'row',
    },
    qtyValue: {
      ...typography.bodySmall,
      color: theme.colors.primary,
      fontWeight: '700',
      minWidth: 22,
      textAlign: 'center',
    },
    reviewContent: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    reviewList: {
      flex: 1,
    },
    scanningText: {
      ...typography.body,
      color: theme.colors.textSecondary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    scanningWrap: {
      padding: spacing.md,
    },
    skeletonGap: {
      marginTop: spacing.sm,
    },
  });
