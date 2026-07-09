import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '../../utils/designSystem';

export default function ScannerScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<any>>();
  const [isScanning, setIsScanning] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualItemName, setManualItemName] = useState('');

  const handleStartScan = () => {
    setIsScanning(true);
    Alert.alert(
      'Coming Soon',
      'Barcode scanning will be available in a future update. Use Manual Entry for now.'
    );
    setIsScanning(false);
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
    navigation.navigate('Pantry', {
      prefillName: manualItemName.trim(),
      showAddModal: true,
    });
    setManualItemName('');
  };

  const handlePhotoScan = () => {
    Alert.alert('Coming Soon', 'Photo scanning will be available in a future update.');
  };

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Scanner'
        subtitle='Scan barcodes and add items'
        gradient='berry'
      />

      <View style={styles.content}>
        {/* Scanner Preview */}
        <PantryCard variant='elevated' padding='xl'>
          <View style={styles.scannerPreview}>
            <Text style={styles.scannerIcon}>📱</Text>
            <Text style={styles.scannerText}>
              {isScanning ? 'Scanning...' : 'Ready to scan'}
            </Text>
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

        {/* Recent Scans */}
        <PantryCard variant='warm' padding='lg'>
          <Text style={styles.sectionTitle}>🕒 Recent Scans</Text>
          <View style={styles.recentCard}>
            <Text style={styles.recentTitle}>No recent scans</Text>
            <Text style={styles.recentSubtext}>
              Your scanned items will appear here
            </Text>
          </View>
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
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.bodySmall,
    color: colors.neutral[600],
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
});
