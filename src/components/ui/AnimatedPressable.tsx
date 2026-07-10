import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
} from 'react-native';
import { haptics } from '../../utils/haptics';

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scaleTo?: number;
  haptic?: 'light' | 'medium' | 'selection' | 'none';
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'checkbox' | 'switch';
  testID?: string;
}

// Pressable with a springy press-down scale — the backbone of the app's
// tactile feel. Wraps children in an Animated.View so layout styles apply.
export default function AnimatedPressable({
  children,
  onPress,
  onLongPress,
  style,
  disabled = false,
  scaleTo = 0.96,
  haptic = 'light',
  accessibilityLabel,
  accessibilityRole = 'button',
  testID,
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (haptic !== 'none') haptics[haptic]();
    onPress?.(event);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={() => animateTo(scaleTo)}
      onPressOut={() => animateTo(1)}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled }}
      testID={testID}
    >
      <Animated.View
        style={[
          style,
          { transform: [{ scale }] },
          disabled && { opacity: 0.5 },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
