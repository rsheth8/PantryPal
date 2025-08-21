import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../utils/designSystem';

interface PantryButtonProps {
  title: string;
  onPress: () => void;
  variant?:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'outline'
    | 'ghost'
    | 'success'
    | 'warning'
    | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  subtitle?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function PantryButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  subtitle,
  style,
  textStyle,
  fullWidth = false,
}: PantryButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.button,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...shadows.sm,
    };

    // Size styles
    const sizeStyles = {
      sm: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        minHeight: 36,
      },
      md: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        minHeight: 44,
      },
      lg: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        minHeight: 52,
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: colors.primary[500],
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: colors.secondary[500],
        borderWidth: 0,
      },
      accent: {
        backgroundColor: colors.accent[500],
        borderWidth: 0,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary[500],
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      success: {
        backgroundColor: colors.success,
        borderWidth: 0,
      },
      warning: {
        backgroundColor: colors.warning,
        borderWidth: 0,
      },
      error: {
        backgroundColor: colors.error,
        borderWidth: 0,
      },
    };

    const widthStyle = fullWidth ? { width: '100%' } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...widthStyle,
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      ...typography.button,
    };

    const sizeTextStyles = {
      sm: { fontSize: 14 },
      md: { fontSize: 16 },
      lg: { fontSize: 18 },
    };

    const variantTextStyles = {
      primary: { color: '#fff' },
      secondary: { color: '#fff' },
      accent: { color: '#fff' },
      outline: { color: colors.primary[500] },
      ghost: { color: colors.primary[500] },
      success: { color: '#fff' },
      warning: { color: '#fff' },
      error: { color: '#fff' },
    };

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
    };
  };

  const getSubtitleStyle = (): TextStyle => {
    return {
      ...typography.bodySmall,
      color:
        variant === 'outline' || variant === 'ghost'
          ? colors.neutral[600]
          : 'rgba(255, 255, 255, 0.8)',
      marginTop: spacing.xs,
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {subtitle ? (
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            {icon && (
              <Text style={[getTextStyle(), styles.iconText]}>{icon}</Text>
            )}
            <Text style={[getTextStyle(), textStyle]}>
              {loading ? 'Loading...' : title}
            </Text>
          </View>
          <Text style={getSubtitleStyle()}>{subtitle}</Text>
        </View>
      ) : (
        <>
          {icon && (
            <Text style={[getTextStyle(), { marginRight: spacing.xs }]}>
              {icon}
            </Text>
          )}
          <Text style={[getTextStyle(), textStyle]}>
            {loading ? 'Loading...' : title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    marginRight: spacing.xs,
  },
});
