import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface FadeSlideInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  offsetY?: number;
  offsetX?: number;
  style?: StyleProp<ViewStyle>;
}

// Entrance animation: fades in while sliding from an offset. Stagger lists by
// passing `delay={index * 60}`.
export default function FadeSlideIn({
  children,
  delay = 0,
  duration = 420,
  offsetY = 18,
  offsetX = 0,
  style,
}: FadeSlideInProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [progress, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [offsetY, 0],
              }),
            },
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [offsetX, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
