import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../utils/designSystem';
import { useTheme } from '../theme/ThemeContext';

interface GradientBackgroundProps {
  children: React.ReactNode;
  gradient?: keyof typeof gradients;
  colors?: string[];
  style?: StyleProp<ViewStyle>;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export default function GradientBackground({
  children,
  gradient = 'primary',
  colors: customColors,
  style,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
}: GradientBackgroundProps) {
  const { theme } = useTheme();

  const getGradientColors = (): string[] => {
    if (customColors && customColors.length >= 2) {
      return customColors;
    }

    // Theme-aware gradients: dark mode uses deeper stops.
    if (theme.gradients && theme.gradients[gradient]) {
      return theme.gradients[gradient];
    }

    return ['#14B8A6', '#0D9488'];
  };

  const gradientColors = getGradientColors();

  return (
    <LinearGradient
      colors={gradientColors as [string, string, ...string[]]}
      start={start}
      end={end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
