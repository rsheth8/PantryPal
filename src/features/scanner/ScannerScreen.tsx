import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import AddItemModal from '../../components/AddItemModal';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import { ocrService, ReceiptItem } from '../../services/ocrService';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import { useTheme, ThemeColors } from '../../theme';

const BARCODE_TYPES: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'qr',
  'code128',
  'code39',
];

// Free, key-less product lookup via Open Food Facts.
async function lookupBarcode(code: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${code}.json`
    );
    const json = await res.json();
    if (json.status === 1 && json.product) {
      return json.product.product_name || json.product.generic_name || null;
    }
    return null;
  } catch (error) {
    console.error('Barcode lookup failed:', error);
    return null;
  }
}

export default function ScannerScreen() {
  const addGroceryItem = useMultiUserStore(state => state.addGroceryItem);
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [permission, requestPermission] = useCameraPermissions();

  const [cameraVisible, setCameraVisible] = useState(false);
  const [isLooking, setIsLooking] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [prefillName, setPrefillName] = useState('');
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const [ocrVisible, setOcrVisible] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrItems, setOcrItems] = useState<ReceiptItem[]>([]);
  const scannedRef = useRef(false);

  const addRecent = (label: string) =>
    setRecentScans(prev => [label, ...prev].slice(0, 5));

  const handleStartScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          'Camera permission',
          'Camera access is needed to scan barcodes.'
        );
        return;
      }
    }
    scannedRef.current = false;
    setCameraVisible(true);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setCameraVisible(false);
    setIsLooking(true);
    const name = await lookupBarcode(data);
    setIsLooking(false);
    setPrefillName(name ?? '');
    setAddVisible(true);
  };

  const handleManualEntry = () => {
    setPrefillName('');
    setAddVisible(true);
  };

  const handlePhotoScan = () => {
    Alert.alert('Scan Receipt', 'Choose a photo source', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Camera', onPress: () => runOcr('camera') },
      { text: 'Photo Library', onPress: () => runOcr('library') },
    ]);
  };

  const runOcr = async (source: 'camera' | 'library') => {
    try {
      const perm =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission needed',
          'Please allow access to scan a receipt.'
        );
        return;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 })
          : await ImagePicker.launchImageLibraryAsync({
              base64: true,
              quality: 0.5,
            });
      if (result.canceled) return;

      setOcrItems([]);
      setOcrLoading(true);
      setOcrVisible(true);
      const items = await ocrService.extractItemsFromImage(
        result.assets[0]?.base64 ?? undefined
      );
      setOcrItems(items);
    } catch (error) {
      console.error('Receipt scan failed:', error);
      Alert.alert(
        'Scan failed',
        'Could not read the receipt. Please try again.'
      );
    } finally {
      setOcrLoading(false);
    }
  };

  const addReceiptItem = async (item: ReceiptItem) => {
    await addGroceryItem({
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || 'piece',
      category: item.category || 'Other',
      expirationDate: '',
      price: item.price ?? 0,
      isShared: true,
    });
  };

  const handleAddOcrItem = async (item: ReceiptItem) => {
    await addReceiptItem(item);
    setOcrItems(prev => prev.filter(i => i !== item));
    addRecent(item.name);
  };

  const handleAddAllOcr = async () => {
    const count = ocrItems.length;
    for (const item of ocrItems) {
      await addReceiptItem(item);
    }
    if (count > 0) addRecent(`${count} items from receipt`);
    setOcrItems([]);
    setOcrVisible(false);
  };

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Scanner'
        subtitle='Scan barcodes and add items'
        gradient='berry'
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Scanner Preview */}
        <PantryCard variant='elevated' padding='xl'>
          <View style={styles.scannerPreview}>
            <Text style={styles.scannerIcon}>📱</Text>
            <Text style={styles.scannerText}>Ready to scan</Text>
            <Text style={styles.scannerSubtext}>
              Point your camera at a barcode
            </Text>
          </View>
        </PantryCard>

        {/* Scan Options */}
        <PantryCard variant='fresh' padding='lg'>
          <Text style={styles.sectionTitle}>🔍 Scan Options</Text>

          <View style={styles.optionsGrid}>
            <PantryButton
              title='Barcode Scanner'
              subtitle='Scan product barcodes'
              onPress={handleStartScan}
              variant='primary'
              size='lg'
              icon='📱'
              fullWidth
            />

            <PantryButton
              title='Scan Receipt'
              subtitle='Add items from a photo'
              onPress={handlePhotoScan}
              variant='secondary'
              size='lg'
              icon='📷'
              fullWidth
            />

            <PantryButton
              title='Manual Entry'
              subtitle='Add items manually'
              onPress={handleManualEntry}
              variant='accent'
              size='lg'
              icon='✏️'
              fullWidth
            />
          </View>
        </PantryCard>

        {/* Recent Scans */}
        <PantryCard variant='warm' padding='lg'>
          <Text style={styles.sectionTitle}>🕒 Recent Scans</Text>
          {recentScans.length === 0 ? (
            <View style={styles.recentCard}>
              <Text style={styles.recentTitle}>No recent scans</Text>
              <Text style={styles.recentSubtext}>
                Your scanned items will appear here
              </Text>
            </View>
          ) : (
            recentScans.map((label, index) => (
              <View key={`${label}-${index}`} style={styles.recentItem}>
                <Text style={styles.recentItemText}>🧾 {label}</Text>
              </View>
            ))
          )}
        </PantryCard>

        {/* Tips */}
        <PantryCard variant='outlined' padding='lg'>
          <Text style={styles.sectionTitle}>💡 Tips</Text>

          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>🎯</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Hold Steady</Text>
              <Text style={styles.tipText}>
                Keep your phone steady when scanning barcodes for best results
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Good Lighting</Text>
              <Text style={styles.tipText}>
                Ensure good lighting for accurate barcode recognition
              </Text>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>📱</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Manual Entry</Text>
              <Text style={styles.tipText}>
                Use manual entry for items without barcodes or damaged labels
              </Text>
            </View>
          </View>
        </PantryCard>
      </ScrollView>

      {/* Live barcode scanner */}
      <Modal
        visible={cameraVisible}
        animationType='slide'
        onRequestClose={() => setCameraVisible(false)}
      >
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraText}>Point at a barcode</Text>
            <View style={styles.cameraFrame} />
            <PantryButton
              title='Cancel'
              onPress={() => setCameraVisible(false)}
              variant='secondary'
              size='md'
            />
          </View>
        </View>
      </Modal>

      {/* Barcode lookup spinner */}
      <Modal visible={isLooking} transparent animationType='fade'>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size='large' color={colors.primary[300]} />
          <Text style={styles.loadingOverlayText}>Looking up product…</Text>
        </View>
      </Modal>

      {/* Receipt OCR results */}
      <Modal
        visible={ocrVisible}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setOcrVisible(false)}
      >
        <View style={styles.container}>
          <PantryHeader
            title='Receipt Items'
            subtitle='Add detected items to your pantry'
            gradient='berry'
            showBackButton
            onBackPress={() => setOcrVisible(false)}
          />
          <ScrollView style={styles.content}>
            {ocrLoading ? (
              <PantryCard variant='elevated' padding='xl'>
                <ActivityIndicator size='large' color={colors.primary[500]} />
                <Text style={styles.loadingText}>Reading receipt…</Text>
              </PantryCard>
            ) : ocrItems.length === 0 ? (
              <PantryCard variant='outlined' padding='xl'>
                <Text style={styles.emptyText}>No items detected.</Text>
              </PantryCard>
            ) : (
              <>
                {ocrItems.map((item, index) => (
                  <PantryCard
                    key={`${item.name}-${index}`}
                    variant='default'
                    padding='md'
                  >
                    <View style={styles.ocrRow}>
                      <View style={styles.ocrInfo}>
                        <Text style={styles.ocrName}>{item.name}</Text>
                        <Text style={styles.ocrMeta}>
                          {item.quantity} {item.unit} · {item.category}
                        </Text>
                      </View>
                      <PantryButton
                        title='Add'
                        onPress={() => handleAddOcrItem(item)}
                        variant='success'
                        size='sm'
                      />
                    </View>
                  </PantryCard>
                ))}
                <PantryButton
                  title='Add All to Pantry'
                  onPress={handleAddAllOcr}
                  variant='primary'
                  size='md'
                  fullWidth
                />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Shared add-item form (manual entry + barcode result) */}
      <AddItemModal
        visible={addVisible}
        initialName={prefillName}
        onClose={() => setAddVisible(false)}
        onAdded={name => addRecent(name)}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    camera: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    cameraContainer: {
      backgroundColor: '#000',
      flex: 1,
    },
    cameraFrame: {
      borderColor: '#fff',
      borderRadius: borderRadius.lg,
      borderWidth: 3,
      height: 180,
      marginBottom: spacing.xl,
      width: 260,
    },
    cameraOverlay: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    cameraText: {
      ...typography.h4,
      color: '#fff',
      marginBottom: spacing.lg,
    },
    container: {
      backgroundColor: colors.neutral[50],
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    emptyText: {
      ...typography.body,
      color: colors.neutral[600],
      textAlign: 'center',
    },
    loadingOverlay: {
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      flex: 1,
      justifyContent: 'center',
    },
    loadingOverlayText: {
      ...typography.body,
      color: '#fff',
      marginTop: spacing.md,
    },
    loadingText: {
      ...typography.body,
      color: colors.neutral[600],
      marginTop: spacing.md,
      textAlign: 'center',
    },
    ocrInfo: {
      flex: 1,
    },
    ocrMeta: {
      ...typography.bodySmall,
      color: colors.neutral[600],
    },
    ocrName: {
      ...typography.body,
      color: colors.neutral[800],
      fontWeight: '600',
    },
    ocrRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    optionsGrid: {
      gap: spacing.md,
    },
    recentCard: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    recentItem: {
      borderBottomColor: colors.neutral[100],
      borderBottomWidth: 1,
      paddingVertical: spacing.sm,
    },
    recentItemText: {
      ...typography.body,
      color: colors.neutral[700],
    },
    recentSubtext: {
      ...typography.bodySmall,
      color: colors.neutral[500],
      textAlign: 'center',
    },
    recentTitle: {
      ...typography.h4,
      color: colors.neutral[700],
      marginBottom: spacing.xs,
    },
    scannerIcon: {
      fontSize: 64,
      marginBottom: spacing.md,
    },
    scannerPreview: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
    },
    scannerSubtext: {
      ...typography.bodySmall,
      color: colors.neutral[600],
      textAlign: 'center',
    },
    scannerText: {
      ...typography.h4,
      color: colors.neutral[800],
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    sectionTitle: {
      ...typography.h4,
      color: colors.neutral[800],
      marginBottom: spacing.md,
    },
    tipCard: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      marginBottom: spacing.md,
    },
    tipContent: {
      flex: 1,
    },
    tipIcon: {
      fontSize: 24,
      marginRight: spacing.sm,
      marginTop: 2,
    },
    tipText: {
      ...typography.bodySmall,
      color: colors.neutral[600],
    },
    tipTitle: {
      ...typography.body,
      color: colors.neutral[800],
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
  });
