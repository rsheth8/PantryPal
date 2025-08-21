import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../utils/designSystem';

export default function ScannerScreen() {
  const [isScanning, setIsScanning] = useState(false);

  const handleStartScan = () => {
    setIsScanning(true);
    Alert.alert('Scanner', 'Barcode scanning functionality coming soon!');
    setIsScanning(false);
  };

  const handleManualEntry = () => {
    Alert.alert('Manual Entry', 'Manual item entry functionality coming soon!');
  };

  const handlePhotoScan = () => {
    Alert.alert('Photo Scan', 'Photo scanning functionality coming soon!');
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
});
