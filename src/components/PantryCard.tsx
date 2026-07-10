import React from 'react';
import { View, ViewStyle } from 'react-native';
import { borderRadius, shadows, spacing } from '../utils/designSystem';
import { useTheme } from '../theme/ThemeContext';

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
  const { theme } = useTheme();

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
          backgroundColor: theme.colors.surface,
          ...shadows.fresh,
          shadowColor: theme.isDark
            ? theme.colors.shadow
            : shadows.fresh.shadowColor,
          borderWidth: 1,
          borderColor: theme.isDark
            ? theme.colors.border
            : theme.palette.primary[100],
        };
      case 'warm':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          ...shadows.warm,
          shadowColor: theme.isDark
            ? theme.colors.shadow
            : shadows.warm.shadowColor,
          borderWidth: 1,
          borderColor: theme.isDark
            ? theme.colors.border
            : theme.palette.secondary[100],
        };
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surfaceElevated,
          ...shadows.lg,
          shadowColor: theme.colors.shadow,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: theme.colors.border,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          ...shadows.md,
          shadowColor: theme.colors.shadow,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
    }
  };

  return <View style={[getCardStyle(), style]}>{children}</View>;
}
