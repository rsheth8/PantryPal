import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import GradientBackground from './GradientBackground';
import { typography, spacing, shadows } from '../utils/designSystem';

interface PantryHeaderProps {
  title: string;
  subtitle?: string;
  gradient?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'fresh'
    | 'warm'
    | 'berry'
    | 'sunrise'
    | 'garden'
    | 'sunset'
    | 'twilight'
    | 'ocean'
    | 'dawn'
    | 'citrus';
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
  children?: React.ReactNode;
}

export default function PantryHeader({
  title,
  subtitle,
  gradient = 'primary',
  showBackButton = false,
  onBackPress,
  rightAction,
  children,
}: PantryHeaderProps) {
  return (
    <GradientBackground gradient={gradient} style={styles.container}>
      <View style={styles.content}>
        {/* Top row with back button and right action */}
        <View style={styles.topRow}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBackPress}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          )}

          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          {rightAction && (
            <TouchableOpacity
              style={styles.rightAction}
              onPress={rightAction.onPress}
              activeOpacity={0.8}
            >
              <Text style={styles.rightActionText}>{rightAction.icon}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Additional content */}
        {children && <View style={styles.childrenContainer}>{children}</View>}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
    ...shadows.sm,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  childrenContainer: {
    marginTop: spacing.md,
  },
  container: {
    paddingBottom: spacing.lg,
    paddingTop: spacing.xl + 20, // Account for status bar
    ...shadows.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  rightAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
    ...shadows.sm,
  },
  rightActionText: {
    color: '#fff',
    fontSize: 18,
  },
  subtitle: {
    ...typography.bodySmall,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    ...typography.h2,
    color: '#fff',
    marginBottom: spacing.xs,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
