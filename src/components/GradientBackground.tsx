import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../utils/designSystem';

interface GradientBackgroundProps {
  children: React.ReactNode;
  gradient?: keyof typeof gradients;
  colors?: string[];
  style?: ViewStyle;
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
  // Get gradient colors with fallback
  const getGradientColors = (): string[] => {
    if (customColors && customColors.length >= 2) {
      return customColors;
    }

    if (gradients && gradients[gradient]) {
      return gradients[gradient];
    }

    // Fallback to primary gradient
    return ['#3B82F6', '#1D4ED8'];
  };

  const gradientColors = getGradientColors();

  return (
    <LinearGradient
      colors={gradientColors}
      start={start}
      end={end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
