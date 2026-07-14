import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import { useEngagementStore } from '../../store/useEngagementStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import {
  FadeSlideIn,
  ProgressRing,
  ProgressBar,
  Confetti,
} from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles, useTheme } from '../../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import {
  deriveStats,
  computeAllProgress,
  totalBadgesUnlocked,
  totalBadgesAvailable,
  AchievementCategory,
} from '../../services/achievementsService';

// Only color scales (50..900), not the flat string tokens on the palette.
type ScaleKey =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'sage'
  | 'lavender'
  | 'citrus'
  | 'honey';

const CATEGORY_COLOR: Record<AchievementCategory, ScaleKey> = {
  pantry: 'primary',
  waste: 'sage',
  recipes: 'secondary',
  shopping: 'accent',
  social: 'lavender',
  streak: 'citrus',
};

export default function AchievementsScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const { pantry, recipes, shoppingList, users } = useMultiUserStore();
  const { totalItemsAdded, shoppingCompleted, streak } = useEngagementStore();

  const [celebrate] = useState(false);

  const { progress, unlocked, available } = useMemo(() => {
    const s = deriveStats({
      pantry,
      recipes,
      shoppingList,
      householdMembers: Math.max(1, users.length),
      activeDayStreak: streak.currentStreak,
      cumulative: { totalItemsAdded, shoppingCompleted },
    });
    return {
      progress: computeAllProgress(s),
      unlocked: totalBadgesUnlocked(s),
      available: totalBadgesAvailable(),
    };
  }, [
    pantry,
    recipes,
    shoppingList,
    users.length,
    streak.currentStreak,
    totalItemsAdded,
    shoppingCompleted,
  ]);

  const completionRatio = available > 0 ? unlocked / available : 0;

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Achievements'
        subtitle={`${unlocked} of ${available} badges earned`}
        gradient='twilight'
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <FadeSlideIn>
          <PantryCard variant='elevated' padding='lg'>
            <View style={styles.summaryRow}>
              <ProgressRing
                progress={completionRatio}
                size={92}
                strokeWidth={8}
                color={theme.colors.primary}
              >
                <Text style={styles.summaryPercent}>
                  {Math.round(completionRatio * 100)}%
                </Text>
              </ProgressRing>
              <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>
                  {streak.currentStreak > 0
                    ? `🔥 ${streak.currentStreak}-day streak!`
                    : 'Start your streak today'}
                </Text>
                <Text style={styles.summarySubtitle}>
                  {unlocked === available
                    ? 'You unlocked everything — legend! 🏆'
                    : `${available - unlocked} badge${available - unlocked === 1 ? '' : 's'} left to earn`}
                </Text>
                {streak.longestStreak > 0 && (
                  <Text style={styles.summaryMeta}>
                    Longest streak: {streak.longestStreak} days
                  </Text>
                )}
              </View>
            </View>
          </PantryCard>
        </FadeSlideIn>

        {/* Achievement cards */}
        {progress.map((p, index) => {
          const paletteKey = CATEGORY_COLOR[p.def.category];
          const color = theme.palette[paletteKey][500];
          return (
            <FadeSlideIn key={p.def.id} delay={Math.min(index, 8) * 60}>
              <PantryCard variant='default' padding='lg'>
                <View style={styles.achievementRow}>
                  <ProgressRing
                    progress={p.progressToNext}
                    size={64}
                    strokeWidth={6}
                    color={color}
                  >
                    <Text
                      style={[
                        styles.achievementIcon,
                        p.unlockedTiers === 0 && styles.lockedIcon,
                      ]}
                    >
                      {p.def.icon}
                    </Text>
                  </ProgressRing>

                  <View style={styles.achievementInfo}>
                    <View style={styles.achievementTitleRow}>
                      <Text style={styles.achievementTitle}>{p.def.title}</Text>
                      {p.currentTierLabel && (
                        <View
                          style={[
                            styles.tierBadge,
                            { backgroundColor: `${color}22` },
                          ]}
                        >
                          <Text style={[styles.tierBadgeText, { color }]}>
                            {p.currentTierLabel}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.achievementDesc}>
                      {p.def.description}
                    </Text>
                    <Text style={styles.achievementProgressText}>
                      {p.isMaxed
                        ? '✓ Fully unlocked'
                        : `${p.value} / ${p.nextThreshold} → ${
                            p.def.tiers[p.unlockedTiers].label
                          }`}
                    </Text>
                    {!p.isMaxed && (
                      <View style={styles.achievementBar}>
                        <ProgressBar
                          progress={p.progressToNext}
                          height={6}
                          gradient={[
                            theme.palette[paletteKey][400],
                            theme.palette[paletteKey][600],
                          ]}
                        />
                      </View>
                    )}
                  </View>
                </View>

                {/* Tier dots */}
                <View style={styles.tierDots}>
                  {p.def.tiers.map((tier, i) => (
                    <View key={tier.label} style={styles.tierDotWrap}>
                      <View
                        style={[
                          styles.tierDot,
                          {
                            backgroundColor:
                              i < p.unlockedTiers
                                ? color
                                : theme.colors.surfaceMuted,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.tierDotLabel,
                          i < p.unlockedTiers && { color },
                        ]}
                      >
                        {tier.threshold}
                      </Text>
                    </View>
                  ))}
                </View>
              </PantryCard>
            </FadeSlideIn>
          );
        })}
      </ScrollView>

      {celebrate && <Confetti />}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    achievementBar: {
      marginTop: spacing.xs,
    },
    achievementDesc: {
      ...typography.caption,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    achievementIcon: {
      fontSize: 26,
    },
    achievementInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    achievementProgressText: {
      ...typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      marginTop: spacing.xs,
    },
    achievementRow: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    achievementTitle: {
      ...typography.body,
      color: theme.colors.text,
      fontWeight: '700',
    },
    achievementTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    lockedIcon: {
      opacity: 0.35,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    summaryMeta: {
      ...typography.caption,
      color: theme.colors.textMuted,
      marginTop: spacing.xs,
    },
    summaryPercent: {
      ...typography.h4,
      color: theme.colors.text,
      fontWeight: '800',
    },
    summaryRow: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    summarySubtitle: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    summaryText: {
      flex: 1,
      marginLeft: spacing.lg,
    },
    summaryTitle: {
      ...typography.h4,
      color: theme.colors.text,
    },
    tierBadge: {
      borderRadius: borderRadius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    tierBadgeText: {
      ...typography.caption,
      fontWeight: '700',
    },
    tierDot: {
      borderRadius: 5,
      height: 10,
      width: 10,
    },
    tierDotLabel: {
      ...typography.caption,
      color: theme.colors.textMuted,
      fontSize: 10,
      marginTop: 2,
    },
    tierDotWrap: {
      alignItems: 'center',
    },
    tierDots: {
      flexDirection: 'row',
      gap: spacing.lg,
      justifyContent: 'center',
      marginTop: spacing.md,
    },
  });
