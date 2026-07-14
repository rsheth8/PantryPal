import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import PantryButton from '../../components/PantryButton';
import { Confetti, useToast } from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles } from '../../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import { haptics } from '../../utils/haptics';
import { Recipe } from '../../types';

// Keep the screen awake only while cooking mode is mounted.
function KeepAwake() {
  useKeepAwake();
  return null;
}

export default function CookingModeModal({
  visible,
  recipe,
  ingredients,
  onClose,
  onFinish,
}: {
  visible: boolean;
  recipe: Recipe | null;
  ingredients: string[];
  onClose: () => void;
  onFinish?: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const steps = recipe?.instructions ?? [];
  const [stepIndex, setStepIndex] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setStepIndex(0);
      setCelebrate(false);
    }
  }, [visible, recipe?.id]);

  const total = steps.length;
  const progress = total > 0 ? (stepIndex + 1) / total : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const transition = (nextIndex: number) => {
    Animated.sequence([
      Animated.timing(fade, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setStepIndex(nextIndex);
  };

  const handleNext = () => {
    if (stepIndex < total - 1) {
      haptics.light();
      transition(stepIndex + 1);
    } else {
      haptics.success();
      setCelebrate(true);
      showToast('Bon appétit! Enjoy your meal 🍽️', { type: 'success' });
      onFinish?.();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      haptics.selection();
      transition(stepIndex - 1);
    }
  };

  const isLastStep = stepIndex === total - 1;

  return (
    <Modal
      visible={visible}
      animationType='slide'
      onRequestClose={onClose}
      presentationStyle='fullScreen'
    >
      {visible && <KeepAwake />}
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.recipeTitle} numberOfLines={1}>
              {recipe?.title}
            </Text>
            <Text style={styles.stepCount}>
              Step {Math.min(stepIndex + 1, total)} of {total}
            </Text>
          </View>
          <View style={styles.closeButton} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Step body */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
        >
          <Animated.View style={{ opacity: fade }}>
            <Text style={styles.stepNumber}>{stepIndex + 1}</Text>
            <Text style={styles.stepText}>
              {steps[stepIndex] ?? 'No steps provided for this recipe.'}
            </Text>
          </Animated.View>

          {/* Ingredient reference on the first step */}
          {stepIndex === 0 && ingredients.length > 0 && (
            <View style={styles.ingredientBox}>
              <Text style={styles.ingredientTitle}>You&apos;ll need</Text>
              {ingredients.map((ing, i) => (
                <Text key={i} style={styles.ingredientLine}>
                  • {ing}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Controls */}
        <View
          style={[
            styles.controls,
            { paddingBottom: insets.bottom + spacing.md },
          ]}
        >
          <PantryButton
            title='Back'
            onPress={handlePrev}
            variant='outline'
            size='lg'
            disabled={stepIndex === 0}
            style={styles.controlButton}
          />
          <PantryButton
            title={isLastStep ? 'Finish 🎉' : 'Next'}
            onPress={handleNext}
            variant={isLastStep ? 'success' : 'primary'}
            size='lg'
            style={styles.controlButton}
          />
        </View>
      </View>

      {celebrate && (
        <Confetti
          onComplete={() => {
            setCelebrate(false);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    body: {
      flex: 1,
    },
    bodyContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    closeButton: {
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    closeText: {
      ...typography.h4,
      color: theme.colors.textSecondary,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    controlButton: {
      flex: 1,
    },
    controls: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    headerCenter: {
      alignItems: 'center',
      flex: 1,
    },
    ingredientBox: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.card,
      borderWidth: 1,
      marginTop: spacing.xl,
      padding: spacing.md,
    },
    ingredientLine: {
      ...typography.body,
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
    },
    ingredientTitle: {
      ...typography.label,
      color: theme.colors.textMuted,
      marginBottom: spacing.sm,
    },
    progressFill: {
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
      height: '100%',
    },
    progressTrack: {
      backgroundColor: theme.colors.surfaceMuted,
      height: 6,
      marginHorizontal: spacing.md,
      overflow: 'hidden',
    },
    recipeTitle: {
      ...typography.h4,
      color: theme.colors.text,
    },
    stepCount: {
      ...typography.caption,
      color: theme.colors.textMuted,
    },
    stepNumber: {
      ...typography.display,
      color: theme.colors.primary,
      marginBottom: spacing.md,
    },
    stepText: {
      ...typography.h3,
      color: theme.colors.text,
      fontWeight: '500',
      lineHeight: 36,
    },
  });
