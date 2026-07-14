import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { Theme } from '../../theme/themes';
import { useThemedStyles } from '../../theme/ThemeContext';
import { typography, spacing } from '../../utils/designSystem';
import PantryButton from '../PantryButton';

interface EmptyStateProps {
  emoji: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// Friendly empty state with a gently floating emoji.
export default function EmptyState({
  emoji,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const styles = useThemedStyles(createStyles);
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.emoji,
          {
            transform: [
              {
                translateY: float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              },
            ],
          },
        ]}
      >
        {emoji}
      </Animated.Text>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <PantryButton title={actionLabel} onPress={onAction} size='md' />
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    action: {
      marginTop: spacing.lg,
    },
    container: {
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xxl,
    },
    emoji: {
      fontSize: 56,
      marginBottom: spacing.md,
    },
    message: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    title: {
      ...typography.h4,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
