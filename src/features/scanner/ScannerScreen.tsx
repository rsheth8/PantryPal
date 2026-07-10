import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import { FadeSlideIn, EmptyState, useToast } from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles } from '../../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import { haptics } from '../../utils/haptics';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import { barcodeService, ScannedProduct } from '../../services/barcodeService';

const EXPIRY_PRESETS = [
  { label: 'None', days: null },
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
];

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function ScannerScreen() {
  const styles = useThemedStyles(createStyles);
  const { showToast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const addGroceryItem = useMultiUserStore(state => state.addGroceryItem);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<ScannedProduct | null>(null);
  const [looking, setLooking] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [expiryDays, setExpiryDays] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [recentScans, setRecentScans] = useState<ScannedProduct[]>([]);
  const scanLockRef = useRef(false);

  // Animated scan line
  const scanLine = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanLine]);

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanLockRef.current || !data) return;
      scanLockRef.current = true;
      haptics.medium();
      setLooking(true);

      const product = await barcodeService.lookupBarcode(data);
      setLooking(false);
      setScanned(product);
      setQuantity(1);
      setExpiryDays(null);

      if (product.found) {
        haptics.success();
        setRecentScans(prev =>
          [product, ...prev.filter(p => p.barcode !== product.barcode)].slice(
            0,
            5
          )
        );
      } else {
        haptics.warning();
      }
    },
    []
  );

  const resetScanner = () => {
    setScanned(null);
    scanLockRef.current = false;
  };

  const handleAddToPantry = async () => {
    if (!scanned) return;
    const name = scanned.found
      ? scanned.brand
        ? `${scanned.name} (${scanned.brand})`
        : scanned.name
      : `Item ${scanned.barcode}`;

    setAdding(true);
    try {
      await addGroceryItem(
        {
          name,
          quantity,
          unit: 'pcs',
          category: scanned.category,
          expirationDate: expiryDays != null ? addDays(expiryDays) : '',
          notes: `Scanned barcode: ${scanned.barcode}`,
          isShared: true,
        },
        true
      );
      showToast(`Added ${name} to pantry`, { type: 'success' });
      resetScanner();
    } catch {
      showToast('Could not add item — try again', { type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  // Permission gate
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <PantryHeader
          title='Scanner'
          subtitle='Add groceries in seconds'
          gradient='berry'
        />
        <EmptyState
          emoji='📷'
          title='Camera access needed'
          message='PantryPal uses your camera to scan product barcodes and fill in the details automatically.'
          actionLabel={
            permission.canAskAgain ? 'Enable Camera' : 'Open Settings'
          }
          onAction={requestPermission}
        />
        <View style={styles.manualFallback}>
          <PantryButton
            title='Add items manually instead'
            onPress={() => navigation.navigate('Pantry')}
            variant='outline'
            size='md'
            fullWidth
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Scanner'
        subtitle={
          looking
            ? 'Looking up product...'
            : scanned
              ? 'Product scanned!'
              : 'Point at a barcode'
        }
        gradient='berry'
      />

      <View style={styles.cameraWrapper}>
        {isFocused && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing='back'
            barcodeScannerSettings={{
              barcodeTypes: [
                'ean13',
                'ean8',
                'upc_a',
                'upc_e',
                'code128',
                'code39',
              ],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          />
        )}

        {/* Scan frame overlay */}
        <View style={styles.scanFrame} pointerEvents='none'>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          {!scanned && (
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [
                    {
                      translateY: scanLine.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 180],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </View>
      </View>

      {/* Result / recent scans panel */}
      <View style={styles.panel}>
        {scanned ? (
          <FadeSlideIn offsetY={24}>
            <PantryCard variant='elevated' padding='lg' margin='none'>
              <View style={styles.resultHeader}>
                {scanned.imageUrl ? (
                  <Image
                    source={{ uri: scanned.imageUrl }}
                    style={styles.resultImage}
                  />
                ) : (
                  <View style={styles.resultImagePlaceholder}>
                    <Text style={styles.resultImageEmoji}>
                      {scanned.found ? '🛍️' : '❓'}
                    </Text>
                  </View>
                )}
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName} numberOfLines={2}>
                    {scanned.found ? scanned.name : 'Product not recognized'}
                  </Text>
                  <Text style={styles.resultMeta}>
                    {scanned.found
                      ? `${scanned.brand ? `${scanned.brand} · ` : ''}${scanned.category}`
                      : `Barcode ${scanned.barcode} — you can still add it`}
                  </Text>
                </View>
              </View>

              <View style={styles.resultControls}>
                <View style={styles.qtyStepper}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => setQuantity(q => Math.max(1, q - 1))}
                  >
                    <Text style={styles.qtyButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => setQuantity(q => q + 1)}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.expiryChips}>
                  {EXPIRY_PRESETS.map(preset => (
                    <TouchableOpacity
                      key={preset.label}
                      style={[
                        styles.expiryChip,
                        expiryDays === preset.days && styles.expiryChipActive,
                      ]}
                      onPress={() => setExpiryDays(preset.days)}
                    >
                      <Text
                        style={[
                          styles.expiryChipText,
                          expiryDays === preset.days &&
                            styles.expiryChipTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.resultActions}>
                <PantryButton
                  title='Scan Again'
                  onPress={resetScanner}
                  variant='outline'
                  size='md'
                  style={styles.resultActionButton}
                />
                <PantryButton
                  title='Add to Pantry'
                  onPress={handleAddToPantry}
                  variant='primary'
                  size='md'
                  loading={adding}
                  icon='🥫'
                  style={styles.resultActionButton}
                />
              </View>
            </PantryCard>
          </FadeSlideIn>
        ) : (
          <PantryCard variant='default' padding='md' margin='none'>
            <Text style={styles.recentTitle}>
              {recentScans.length > 0 ? '🕒 Recent scans' : '💡 Tip'}
            </Text>
            {recentScans.length > 0 ? (
              recentScans.map(scan => (
                <Text
                  key={scan.barcode}
                  style={styles.recentRow}
                  numberOfLines={1}
                >
                  • {scan.name}
                </Text>
              ))
            ) : (
              <Text style={styles.recentRow}>
                Scan any product barcode — PantryPal recognizes it and fills in
                the details for you. Works offline for items you scan again.
              </Text>
            )}
          </PantryCard>
        )}
      </View>
    </View>
  );
}

const FRAME_SIZE = 220;

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    cameraWrapper: {
      alignItems: 'center',
      backgroundColor: '#000',
      flex: 1,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    corner: {
      borderColor: '#fff',
      height: 28,
      position: 'absolute',
      width: 28,
    },
    cornerBL: {
      borderBottomLeftRadius: 12,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      bottom: 0,
      left: 0,
    },
    cornerBR: {
      borderBottomRightRadius: 12,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      bottom: 0,
      right: 0,
    },
    cornerTL: {
      borderLeftWidth: 3,
      borderTopLeftRadius: 12,
      borderTopWidth: 3,
      left: 0,
      top: 0,
    },
    cornerTR: {
      borderRightWidth: 3,
      borderTopRightRadius: 12,
      borderTopWidth: 3,
      right: 0,
      top: 0,
    },
    expiryChip: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.pill,
      borderWidth: 1,
      marginBottom: spacing.xs,
      marginRight: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    expiryChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    expiryChipText: {
      ...typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    expiryChipTextActive: {
      color: '#fff',
    },
    expiryChips: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginLeft: spacing.sm,
    },
    manualFallback: {
      padding: spacing.lg,
    },
    panel: {
      padding: spacing.md,
    },
    qtyButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36,
      width: 32,
    },
    qtyButtonText: {
      color: theme.colors.textSecondary,
      fontSize: 18,
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
    qtyText: {
      ...typography.body,
      color: theme.colors.primary,
      fontWeight: '700',
      minWidth: 28,
      textAlign: 'center',
    },
    recentRow: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
      marginBottom: spacing.xs,
    },
    recentTitle: {
      ...typography.label,
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
    },
    resultActionButton: {
      flex: 1,
    },
    resultActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    resultControls: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      marginBottom: spacing.md,
    },
    resultHeader: {
      flexDirection: 'row',
      marginBottom: spacing.md,
    },
    resultImage: {
      borderRadius: borderRadius.md,
      height: 64,
      marginRight: spacing.md,
      width: 64,
    },
    resultImageEmoji: {
      fontSize: 28,
    },
    resultImagePlaceholder: {
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundSubtle,
      borderRadius: borderRadius.md,
      height: 64,
      justifyContent: 'center',
      marginRight: spacing.md,
      width: 64,
    },
    resultInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    resultMeta: {
      ...typography.caption,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    resultName: {
      ...typography.body,
      color: theme.colors.text,
      fontWeight: '700',
    },
    scanFrame: {
      height: FRAME_SIZE,
      position: 'absolute',
      width: FRAME_SIZE,
    },
    scanLine: {
      backgroundColor: theme.palette.accent[400],
      borderRadius: 2,
      height: 3,
      left: 8,
      position: 'absolute',
      right: 8,
      shadowColor: theme.palette.accent[400],
      shadowOpacity: 0.8,
      shadowRadius: 6,
      top: 16,
    },
  });
