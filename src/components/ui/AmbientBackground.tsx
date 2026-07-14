import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface OrbConfig {
  size: number;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  duration: number;
  colors: [string, string];
  opacity: number;
}

// A depth-layered "3D scene" background: large soft gradient orbs drifting at
// different speeds and scales (parallax), giving screens a living, dimensional
// backdrop without any GL dependency. Render behind screen content.
export default function AmbientBackground({
  variant = 'primary',
}: {
  variant?: 'primary' | 'warm' | 'berry' | 'ocean';
}) {
  const { theme } = useTheme();

  const orbColors = useMemo((): [string, string][] => {
    const alpha = theme.isDark ? '26' : '33'; // ~15% / 20% hex alpha
    const palettes: Record<string, [string, string][]> = {
      primary: [
        [`#14B8A6${alpha}`, `#22C55E00`],
        [`#F97316${alpha}`, `#F9731600`],
        [`#2DD4BF${alpha}`, `#2DD4BF00`],
      ],
      warm: [
        [`#F97316${alpha}`, `#F9731600`],
        [`#F59E0B${alpha}`, `#F59E0B00`],
        [`#EC4899${alpha}`, `#EC489900`],
      ],
      berry: [
        [`#EC4899${alpha}`, `#EC489900`],
        [`#A855F7${alpha}`, `#A855F700`],
        [`#F472B6${alpha}`, `#F472B600`],
      ],
      ocean: [
        [`#3B82F6${alpha}`, `#3B82F600`],
        [`#14B8A6${alpha}`, `#14B8A600`],
        [`#60A5FA${alpha}`, `#60A5FA00`],
      ],
    };
    return palettes[variant];
  }, [variant, theme.isDark]);

  const orbs = useMemo<OrbConfig[]>(
    () => [
      {
        size: SCREEN_W * 1.1,
        x: -SCREEN_W * 0.35,
        y: -SCREEN_W * 0.3,
        driftX: 40,
        driftY: 30,
        duration: 14000,
        colors: orbColors[0],
        opacity: 1,
      },
      {
        size: SCREEN_W * 0.9,
        x: SCREEN_W * 0.45,
        y: SCREEN_H * 0.25,
        driftX: -55,
        driftY: 45,
        duration: 18000,
        colors: orbColors[1],
        opacity: 0.9,
      },
      {
        size: SCREEN_W * 0.7,
        x: SCREEN_W * 0.1,
        y: SCREEN_H * 0.62,
        driftX: 35,
        driftY: -50,
        duration: 22000,
        colors: orbColors[2],
        opacity: 0.8,
      },
    ],
    [orbColors]
  );

  return (
    <View pointerEvents='none' style={StyleSheet.absoluteFill}>
      {orbs.map((orb, i) => (
        <DriftingOrb key={i} {...orb} />
      ))}
    </View>
  );
}

function DriftingOrb({
  size,
  x,
  y,
  driftX,
  driftY,
  duration,
  colors,
  opacity,
}: OrbConfig) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [progress, duration]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        opacity,
        transform: [
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, driftX],
            }),
          },
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, driftY],
            }),
          },
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.12],
            }),
          },
        ],
      }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1, borderRadius: size / 2 }}
      />
    </Animated.View>
  );
}
