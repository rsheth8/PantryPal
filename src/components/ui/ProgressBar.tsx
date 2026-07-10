import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0..1
  height?: number;
  gradient?: [string, string];
}

// Animated gradient progress bar.
export default function ProgressBar({
  progress,
  height = 8,
  gradient,
}: ProgressBarProps) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: Math.min(Math.max(progress, 0), 1),
      useNativeDriver: false,
      speed: 8,
      bounciness: 4,
    }).start();
  }, [progress, anim]);

  const colors: [string, string] = gradient ?? [
    theme.palette.primary[400],
    theme.palette.primary[600],
  ];

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: theme.colors.surfaceMuted,
        },
      ]}
    >
      <Animated.View
        style={{
          width: anim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
          height: '100%',
        }}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { borderRadius: height / 2 }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  track: {
    overflow: 'hidden',
    width: '100%',
  },
});
