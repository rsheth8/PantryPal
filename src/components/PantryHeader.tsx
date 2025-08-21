import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import GradientBackground from './GradientBackground';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  pantryTokens,
} from '../utils/designSystem';

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
    | 'garden';
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
  container: {
    paddingTop: spacing.xl + 20, // Account for status bar
    paddingBottom: spacing.lg,
    ...shadows.lg,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  backButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  title: {
    ...typography.h2,
    color: '#fff',
    textAlign: 'center',
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    ...typography.bodySmall,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rightAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  rightActionText: {
    fontSize: 18,
    color: '#fff',
  },
  childrenContainer: {
    marginTop: spacing.md,
  },
});
