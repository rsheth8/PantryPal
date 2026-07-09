import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import { lookupBarcode } from '../../services/barcodeService';
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '../../utils/designSystem';

export default function ScannerScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<any>>();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualItemName, setManualItemName] = useState('');
  const [recentScans, setRecentScans] = useState<string[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoItemName, setPhotoItemName] = useState('');

  const navigateToPantry = (name: string) => {
    navigation.navigate('Pantry', {
      prefillName: name,
      showAddModal: true,
    });
  };

  const handleStartScan = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission',
          'Camera access is required to scan barcodes.'
        );
        return;
      }
    }
    setScanned(false);
    setIsScanning(true);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isLookingUp) return;

    setScanned(true);
    setIsLookingUp(true);

    try {
      const product = await lookupBarcode(data);
      const itemName = product?.name || `Barcode ${data}`;

      setRecentScans(prev => [itemName, ...prev.filter(n => n !== itemName)].slice(0, 5));
      setIsScanning(false);

      Alert.alert(
        'Product Found',
        `Add "${itemName}" to your pantry?`,
        [
          {
            text: 'Scan Again',
            onPress: () => {
              setScanned(false);
              setIsScanning(true);
            },
          },
          {
            text: 'Add to Pantry',
            onPress: () => navigateToPantry(itemName),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not look up product. Try manual entry.');
      setScanned(false);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleManualEntry = () => {
    setManualItemName('');
    setShowManualModal(true);
  };

  const handleManualSubmit = () => {
    if (!manualItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }
    setShowManualModal(false);
    navigateToPantry(manualItemName.trim());
    setManualItemName('');
  };

  const handlePhotoScan = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission',
        'Camera access is required to photograph items.'
      );
      return;
    }

    Alert.alert('Photo Scan', 'How would you like to add a photo?', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
          });
          if (!result.canceled && result.assets[0]) {
            openPhotoReview(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (library.status !== 'granted') {
            Alert.alert('Permission', 'Photo library access is required.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
          });
          if (!result.canceled && result.assets[0]) {
            openPhotoReview(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openPhotoReview = (uri: string) => {
    setPhotoUri(uri);
    setPhotoItemName('');
    setShowPhotoModal(true);
  };

  const handlePhotoSubmit = () => {
    if (!photoItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }
    const name = photoItemName.trim();
    setRecentScans(prev => [name, ...prev.filter(n => n !== name)].slice(0, 5));
    setShowPhotoModal(false);
    setPhotoUri(null);
    navigateToPantry(name);
    setPhotoItemName('');
  };

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Scanner'
        subtitle='Scan barcodes and add items'
        gradient='berry'
      />

      <View style={styles.content}>
        <PantryCard variant='elevated' padding={isScanning ? 'sm' : 'xl'}>
          {isScanning ? (
            <View style={styles.cameraContainer}>
              <View style={styles.cameraWrapper}>
                <CameraView
                  style={styles.camera}
                  facing='back'
                  barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
                  }}
                  onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                />
                {isLookingUp && (
                  <View style={styles.lookupOverlay}>
                    <ActivityIndicator size='large' color='#fff' />
                    <Text style={styles.lookupText}>Looking up product...</Text>
                  </View>
                )}
                <View style={styles.scanFrame} pointerEvents='none' />
              </View>
              <PantryButton
                title='Cancel'
                onPress={() => {
                  setIsScanning(false);
                  setScanned(false);
                }}
                variant='outline'
                size='sm'
                fullWidth
              />
            </View>
          ) : (
            <View style={styles.scannerPreview}>
              <Text style={styles.scannerIcon}>📱</Text>
              <Text style={styles.scannerText}>Ready to scan</Text>
              <Text style={styles.scannerSubtext}>
                Point your camera at a barcode
              </Text>
            </View>
          )}
        </PantryCard>

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
              title='Photo Scan'
              subtitle='Take a photo of items'
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
            recentScans.map(item => (
              <Text key={item} style={styles.recentItem}>
                • {item}
              </Text>
            ))
          )}
        </PantryCard>
      </View>

      <Modal visible={showManualModal} animationType='slide' transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <PantryCard variant='elevated' padding='lg'>
              <Text style={styles.modalTitle}>Manual Entry</Text>
              <TextInput
                style={styles.input}
                placeholder='Item name'
                value={manualItemName}
                onChangeText={setManualItemName}
                placeholderTextColor={colors.neutral[400]}
                autoFocus
              />
              <View style={styles.modalActions}>
                <PantryButton
                  title='Cancel'
                  onPress={() => setShowManualModal(false)}
                  variant='outline'
                  size='md'
                />
                <PantryButton
                  title='Add to Pantry'
                  onPress={handleManualSubmit}
                  variant='primary'
                  size='md'
                />
              </View>
            </PantryCard>
          </View>
        </View>
      </Modal>

      <Modal visible={showPhotoModal} animationType='slide' transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.photoModalScroll}>
            <View style={styles.modalContent}>
              <PantryCard variant='elevated' padding='lg'>
                <Text style={styles.modalTitle}>Photo Scan</Text>
                {photoUri && (
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                )}
                <Text style={styles.photoHint}>
                  Name the item in your photo, then add it to your pantry.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder='Item name (e.g. Greek yogurt)'
                  value={photoItemName}
                  onChangeText={setPhotoItemName}
                  placeholderTextColor={colors.neutral[400]}
                  autoFocus
                />
                <View style={styles.modalActions}>
                  <PantryButton
                    title='Cancel'
                    onPress={() => {
                      setShowPhotoModal(false);
                      setPhotoUri(null);
                    }}
                    variant='outline'
                    size='md'
                  />
                  <PantryButton
                    title='Add to Pantry'
                    onPress={handlePhotoSubmit}
                    variant='primary'
                    size='md'
                  />
                </View>
              </PantryCard>
            </View>
          </ScrollView>
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
  cameraContainer: {
    gap: spacing.sm,
  },
  cameraWrapper: {
    position: 'relative',
    width: '100%',
    height: 280,
  },
  camera: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  lookupOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },
  lookupText: {
    ...typography.body,
    color: '#fff',
    marginTop: spacing.sm,
  },
  scanFrame: {
    position: 'absolute',
    top: 80,
    left: '15%',
    width: '70%',
    height: 120,
    borderWidth: 2,
    borderColor: colors.primary[400],
    borderRadius: borderRadius.md,
    zIndex: 2,
  },
  scannerPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  scannerIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  scannerText: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  scannerSubtext: {
    ...typography.bodySmall,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  optionsGrid: {
    gap: spacing.md,
  },
  recentCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  recentTitle: {
    ...typography.h4,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  recentSubtext: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  recentItem: {
    ...typography.body,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.md,
    textAlign: 'center',
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
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoModalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.neutral[200],
  },
  photoHint: {
    ...typography.bodySmall,
    color: colors.neutral[600],
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
