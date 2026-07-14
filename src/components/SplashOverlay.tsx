import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography, spacing } from '../utils/designSystem';

// Animated launch splash: gradient backdrop, springing logo, name fade-in.
// Rendered while the app boots; parent unmounts it when ready.
export default function SplashOverlay() {
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameTranslate = useRef(new Animated.Value(14)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 6,
          bounciness: 14,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(nameOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(nameTranslate, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [logoScale, logoOpacity, nameOpacity, nameTranslate, pulse]);

  return (
    <LinearGradient
      colors={['#14B8A6', '#0F766E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.Text
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
            transform: [
              { scale: logoScale },
              {
                translateY: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -8],
                }),
              },
            ],
          },
        ]}
      >
        🥫
      </Animated.Text>
      <Animated.View
        style={{
          opacity: nameOpacity,
          transform: [{ translateY: nameTranslate }],
        }}
      >
        <Text style={styles.name}>PantryPal</Text>
        <Text style={styles.tagline}>Waste less. Cook more.</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 84,
    marginBottom: spacing.lg,
  },
  name: {
    ...typography.display,
    color: '#fff',
    textAlign: 'center',
  },
  tagline: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
