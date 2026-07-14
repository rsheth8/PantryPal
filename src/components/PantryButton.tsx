import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../utils/designSystem';
import { useTheme } from '../theme/ThemeContext';
import { haptics } from '../utils/haptics';

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

const GRADIENT_VARIANTS = ['primary', 'secondary', 'accent'] as const;

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
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const isGradient = GRADIENT_VARIANTS.includes(
    variant as (typeof GRADIENT_VARIANTS)[number]
  );

  const gradientColors: Record<string, [string, string]> = {
    primary: theme.gradients.primary as [string, string],
    secondary: theme.gradients.secondary as [string, string],
    accent: theme.gradients.accent as [string, string],
  };

  const solidColors: Record<string, string> = {
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
  };

  const sizeStyles: Record<string, ViewStyle> = {
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

  const containerStyle: ViewStyle = {
    borderRadius: borderRadius.button,
    overflow: 'hidden',
    ...(isGradient || variant in solidColors
      ? { ...shadows.sm, shadowColor: theme.colors.shadow }
      : {}),
    ...(variant === 'outline'
      ? {
          borderWidth: 2,
          borderColor: theme.colors.primary,
          backgroundColor: 'transparent',
        }
      : {}),
    ...(variant === 'ghost' ? { backgroundColor: 'transparent' } : {}),
    ...(variant in solidColors
      ? { backgroundColor: solidColors[variant] }
      : {}),
    ...(fullWidth ? { width: '100%' as const } : {}),
    opacity: disabled ? 0.55 : 1,
  };

  const innerStyle: ViewStyle = {
    ...sizeStyles[size],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  };

  const getTextStyle = (): TextStyle => {
    const sizeTextStyles = {
      sm: { fontSize: 14 },
      md: { fontSize: 16 },
      lg: { fontSize: 18 },
    };

    const color =
      variant === 'outline' || variant === 'ghost'
        ? theme.colors.primary
        : '#fff';

    return {
      ...typography.button,
      ...sizeTextStyles[size],
      color,
    };
  };

  const getSubtitleStyle = (): TextStyle => ({
    ...typography.bodySmall,
    color:
      variant === 'outline' || variant === 'ghost'
        ? theme.colors.textMuted
        : 'rgba(255, 255, 255, 0.85)',
    marginTop: spacing.xs,
  });

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  const content = (
    <View style={innerStyle}>
      {loading ? (
        <ActivityIndicator
          size='small'
          color={
            variant === 'outline' || variant === 'ghost'
              ? theme.colors.primary
              : '#fff'
          }
          style={styles.spinner}
        />
      ) : null}
      {subtitle ? (
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            {icon && !loading && (
              <Text style={[getTextStyle(), styles.iconText]}>{icon}</Text>
            )}
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          </View>
          <Text style={getSubtitleStyle()}>{subtitle}</Text>
        </View>
      ) : (
        <>
          {icon && !loading && (
            <Text style={[getTextStyle(), styles.iconText]}>{icon}</Text>
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => animateTo(0.96)}
      onPressOut={() => animateTo(1)}
      disabled={disabled || loading}
      accessibilityRole='button'
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      <Animated.View
        style={[containerStyle, style, { transform: [{ scale }] }]}
      >
        {isGradient ? (
          <LinearGradient
            colors={gradientColors[variant]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {content}
          </LinearGradient>
        ) : (
          content
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    marginRight: spacing.xs,
  },
  spinner: {
    marginRight: spacing.xs,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
