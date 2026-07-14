import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '../../components/GradientBackground';
import PantryButton from '../../components/PantryButton';
import { AmbientBackground } from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles } from '../../theme/ThemeContext';
import { typography, spacing, gradients } from '../../utils/designSystem';
import { haptics } from '../../utils/haptics';

const { width: SCREEN_W } = Dimensions.get('window');

interface OnboardingPage {
  emoji: string;
  supportEmojis: string[];
  title: string;
  message: string;
  gradient: keyof typeof gradients;
}

const PAGES: OnboardingPage[] = [
  {
    emoji: '🥫',
    supportEmojis: ['🥬', '🧀', '🍞'],
    title: 'Your pantry, in your pocket',
    message:
      'Track everything you have at home with expiration alerts, so nothing goes to waste again.',
    gradient: 'fresh',
  },
  {
    emoji: '🏠',
    supportEmojis: ['👨‍👩‍👧', '🤝', '📲'],
    title: 'Share with your household',
    message:
      'Invite family or roommates with a simple code. Everyone sees the shared pantry and shopping list in real time.',
    gradient: 'sunrise',
  },
  {
    emoji: '🍳',
    supportEmojis: ['📖', '🥗', '✨'],
    title: 'Cook smarter',
    message:
      'Get recipes you can make right now with what you already have, plus AI-powered weekly meal plans.',
    gradient: 'berry',
  },
  {
    emoji: '📱',
    supportEmojis: ['🔍', '🧾', '⚡'],
    title: 'Scan & go',
    message:
      'Add groceries in seconds with the barcode scanner. PantryPal recognizes products and fills in the details.',
    gradient: 'ocean',
  },
];

interface OnboardingScreenProps {
  onDone: () => void;
}

// Swipeable animated intro carousel shown on first launch.
export default function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<Animated.FlatList<OnboardingPage>>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (index !== pageIndex) {
      setPageIndex(index);
      haptics.selection();
    }
  };

  const goNext = () => {
    if (pageIndex < PAGES.length - 1) {
      scrollRef.current?.scrollToOffset({
        offset: (pageIndex + 1) * SCREEN_W,
        animated: true,
      });
    } else {
      haptics.success();
      onDone();
    }
  };

  const isLast = pageIndex === PAGES.length - 1;

  return (
    <View style={styles.container}>
      <AmbientBackground variant='primary' />

      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + spacing.sm }]}
        onPress={onDone}
        accessibilityRole='button'
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Animated.FlatList
        ref={scrollRef}
        data={PAGES}
        keyExtractor={item => item.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item, index }) => (
          <OnboardingPageView
            page={item}
            index={index}
            scrollX={scrollX}
            styles={styles}
          />
        )}
      />

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <View style={styles.dots}>
          {PAGES.map((_, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [
                (i - 1) * SCREEN_W,
                i * SCREEN_W,
                (i + 1) * SCREEN_W,
              ],
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [
                (i - 1) * SCREEN_W,
                i * SCREEN_W,
                (i + 1) * SCREEN_W,
              ],
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
              />
            );
          })}
        </View>
        <PantryButton
          title={isLast ? 'Get Started' : 'Next'}
          onPress={goNext}
          size='lg'
          fullWidth
          icon={isLast ? '🚀' : undefined}
        />
      </View>
    </View>
  );
}

function OnboardingPageView({
  page,
  index,
  scrollX,
  styles,
}: {
  page: OnboardingPage;
  index: number;
  scrollX: Animated.Value;
  styles: ReturnType<typeof createStyles>;
}) {
  const inputRange = [
    (index - 1) * SCREEN_W,
    index * SCREEN_W,
    (index + 1) * SCREEN_W,
  ];

  // Parallax: hero emoji moves faster than text for a depth effect.
  const heroTranslate = scrollX.interpolate({
    inputRange,
    outputRange: [SCREEN_W * 0.4, 0, -SCREEN_W * 0.4],
    extrapolate: 'clamp',
  });
  const heroScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.5, 1, 0.5],
    extrapolate: 'clamp',
  });
  const textOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.page}>
      <Animated.View
        style={[
          styles.heroCircleWrapper,
          {
            transform: [{ translateX: heroTranslate }, { scale: heroScale }],
          },
        ]}
      >
        <GradientBackground gradient={page.gradient} style={styles.heroCircle}>
          <Text style={styles.heroEmoji}>{page.emoji}</Text>
        </GradientBackground>
        <View style={styles.supportRow}>
          {page.supportEmojis.map((e, i) => (
            <View key={i} style={styles.supportBubble}>
              <Text style={styles.supportEmoji}>{e}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
      <Animated.View style={{ opacity: textOpacity }}>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.message}>{page.message}</Text>
      </Animated.View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    dot: {
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
      height: 8,
      marginHorizontal: 4,
    },
    dots: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    footer: {
      paddingHorizontal: spacing.lg,
    },
    heroCircle: {
      alignItems: 'center',
      borderRadius: SCREEN_W * 0.3,
      height: SCREEN_W * 0.6,
      justifyContent: 'center',
      width: SCREEN_W * 0.6,
    },
    heroCircleWrapper: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    heroEmoji: {
      fontSize: 96,
    },
    message: {
      ...typography.body,
      color: theme.colors.textMuted,
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      textAlign: 'center',
    },
    page: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      width: SCREEN_W,
    },
    skipButton: {
      padding: spacing.sm,
      position: 'absolute',
      right: spacing.md,
      zIndex: 10,
    },
    skipText: {
      ...typography.label,
      color: theme.colors.textMuted,
    },
    supportBubble: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.border,
      borderRadius: 24,
      borderWidth: 1,
      height: 48,
      justifyContent: 'center',
      marginHorizontal: spacing.xs,
      width: 48,
    },
    supportEmoji: {
      fontSize: 22,
    },
    supportRow: {
      flexDirection: 'row',
      marginTop: -spacing.lg,
    },
    title: {
      ...typography.h1,
      color: theme.colors.text,
      textAlign: 'center',
    },
  });
