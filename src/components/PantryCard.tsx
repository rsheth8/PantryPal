import React from 'react';
import { View, ViewStyle } from 'react-native';
import { borderRadius, shadows, spacing } from '../utils/designSystem';
import { useTheme } from '../theme';

interface PantryCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'fresh' | 'warm' | 'elevated' | 'outlined';
  style?: ViewStyle;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
}

export default function PantryCard({
  children,
  variant = 'default',
  style,
  padding = 'md',
  margin = 'sm',
}: PantryCardProps) {
  const { colors } = useTheme();
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.card,
      padding: spacing[padding],
      marginBottom: margin === 'none' ? 0 : spacing[margin],
    };

    switch (variant) {
      case 'fresh':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          ...shadows.fresh,
          borderWidth: 1,
          borderColor: colors.primary[100],
        };
      case 'warm':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          ...shadows.warm,
          borderWidth: 1,
          borderColor: colors.secondary[100],
        };
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          ...shadows.lg,
          borderWidth: 1,
          borderColor: colors.neutral[100],
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.neutral[200],
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          ...shadows.md,
          borderWidth: 1,
          borderColor: colors.neutral[100],
        };
    }
  };

  return <View style={[getCardStyle(), style]}>{children}</View>;
}
