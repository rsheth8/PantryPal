import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import { FadeSlideIn, ProgressBar } from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles, useTheme } from '../../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import { formatCurrency, isExpiringSoon, isExpired } from '../../utils/helpers';

const CATEGORY_COLORS = [
  '#14B8A6',
  '#F97316',
  '#EC4899',
  '#A855F7',
  '#F59E0B',
  '#22C55E',
  '#3B82F6',
  '#8A857A',
];

export default function AnalyticsScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const { pantry, shoppingList, recipes } = useMultiUserStore();

  const data = useMemo(() => {
    const active = pantry.filter(item => !item.isUsed);
    const used = pantry.filter(item => item.isUsed);
    const expired = pantry.filter(item => item.isExpired || isExpired(item));
    const expiring = active.filter(item => isExpiringSoon(item));
    const fresh = active.length - expiring.length - expired.length;

    // Category share
    const byCategory = new Map<string, number>();
    active.forEach(item => {
      byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1);
    });
    const categories = [...byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Money
    const inventoryValue = active.reduce(
      (sum, item) => sum + (item.price ?? 0) * item.quantity,
      0
    );
    const pricedItems = active.filter(item => item.price != null);
    const mostValuable = pricedItems
      .slice()
      .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
      .slice(0, 3);

    // Waste score: proportion of tracked items that were used vs expired.
    const resolved = used.length + expired.length;
    const wasteScore = resolved > 0 ? used.length / resolved : 1;

    // Health score: freshness weighted score of active pantry.
    const healthScore =
      active.length > 0 ? Math.max(0, fresh / active.length) : 1;

    return {
      activeCount: active.length,
      usedCount: used.length,
      expiredCount: expired.length,
      expiringCount: expiring.length,
      freshCount: Math.max(0, fresh),
      categories,
      inventoryValue,
      mostValuable,
      wasteScore,
      healthScore,
      recipeCount: recipes.length,
      toBuyCount: shoppingList.filter(item => !item.isCompleted).length,
    };
  }, [pantry, shoppingList, recipes]);

  const maxCategoryCount = data.categories[0]?.[1] ?? 1;

  const healthLabel =
    data.healthScore > 0.8
      ? 'Excellent'
      : data.healthScore > 0.6
        ? 'Good'
        : data.healthScore > 0.4
          ? 'Needs attention'
          : 'Time to cook!';

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Analytics'
        subtitle='Insights from your kitchen'
        gradient='ocean'
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Key metrics */}
        <FadeSlideIn>
          <View style={styles.metricsGrid}>
            {[
              {
                label: 'Active Items',
                value: String(data.activeCount),
                icon: '🥫',
              },
              {
                label: 'Inventory Value',
                value: formatCurrency(data.inventoryValue),
                icon: '💰',
              },
              { label: 'Recipes', value: String(data.recipeCount), icon: '📖' },
              { label: 'To Buy', value: String(data.toBuyCount), icon: '🛒' },
            ].map((metric, i) => (
              <FadeSlideIn
                key={metric.label}
                delay={i * 60}
                style={styles.metricWrapper}
              >
                <View style={styles.metricCard}>
                  <Text style={styles.metricIcon}>{metric.icon}</Text>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                </View>
              </FadeSlideIn>
            ))}
          </View>
        </FadeSlideIn>

        {/* Pantry health */}
        <FadeSlideIn delay={240}>
          <PantryCard variant='fresh' padding='lg'>
            <View style={styles.healthHeader}>
              <Text style={styles.sectionTitle}>💚 Pantry Health</Text>
              <Text style={styles.healthScore}>
                {Math.round(data.healthScore * 100)}%
              </Text>
            </View>
            <ProgressBar
              progress={data.healthScore}
              height={12}
              gradient={
                data.healthScore > 0.6
                  ? [theme.palette.sage[400], theme.palette.primary[500]]
                  : [theme.palette.citrus[400], theme.palette.secondary[500]]
              }
            />
            <Text style={styles.healthLabel}>{healthLabel}</Text>
            <View style={styles.healthBreakdown}>
              <View style={styles.healthItem}>
                <Text style={styles.healthItemValue}>✅ {data.freshCount}</Text>
                <Text style={styles.healthItemLabel}>Fresh</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthItemValue}>
                  ⏰ {data.expiringCount}
                </Text>
                <Text style={styles.healthItemLabel}>Expiring</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthItemValue}>
                  ❌ {data.expiredCount}
                </Text>
                <Text style={styles.healthItemLabel}>Expired</Text>
              </View>
            </View>
          </PantryCard>
        </FadeSlideIn>

        {/* Category breakdown */}
        {data.categories.length > 0 && (
          <FadeSlideIn delay={320}>
            <PantryCard variant='default' padding='lg'>
              <Text style={styles.sectionTitle}>
                📂 What&apos;s in your pantry
              </Text>
              {data.categories.map(([category, count], i) => (
                <View key={category} style={styles.categoryRow}>
                  <View style={styles.categoryLabelBox}>
                    <Text style={styles.categoryLabel} numberOfLines={1}>
                      {category}
                    </Text>
                    <Text style={styles.categoryCount}>{count}</Text>
                  </View>
                  <View style={styles.categoryBarTrack}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        {
                          width: `${Math.max(6, (count / maxCategoryCount) * 100)}%`,
                          backgroundColor:
                            CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </PantryCard>
          </FadeSlideIn>
        )}

        {/* Waste tracking */}
        <FadeSlideIn delay={400}>
          <PantryCard variant='warm' padding='lg'>
            <View style={styles.healthHeader}>
              <Text style={styles.sectionTitle}>♻️ Waste Score</Text>
              <Text style={styles.healthScore}>
                {Math.round(data.wasteScore * 100)}%
              </Text>
            </View>
            <ProgressBar
              progress={data.wasteScore}
              height={12}
              gradient={[theme.palette.sage[400], theme.palette.sage[600]]}
            />
            <Text style={styles.wasteText}>
              {data.usedCount + data.expiredCount === 0
                ? 'Start using items to track how much food you save from the bin.'
                : `You used ${data.usedCount} item${data.usedCount === 1 ? '' : 's'} and ${data.expiredCount} expired. ${
                    data.wasteScore > 0.8
                      ? 'Amazing — almost nothing wasted! 🌱'
                      : 'Check the "Use these first" list on your dashboard to save more.'
                  }`}
            </Text>
          </PantryCard>
        </FadeSlideIn>

        {/* Spending */}
        {data.mostValuable.length > 0 && (
          <FadeSlideIn delay={480}>
            <PantryCard variant='outlined' padding='lg' style={styles.lastCard}>
              <Text style={styles.sectionTitle}>💸 Biggest investments</Text>
              {data.mostValuable.map(item => (
                <View key={item.id} style={styles.valueRow}>
                  <Text style={styles.valueName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.valuePrice}>
                    {formatCurrency(item.price ?? 0)}
                  </Text>
                </View>
              ))}
            </PantryCard>
          </FadeSlideIn>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    categoryBarFill: {
      borderRadius: 6,
      height: '100%',
    },
    categoryBarTrack: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: 6,
      flex: 1,
      height: 12,
      overflow: 'hidden',
    },
    categoryCount: {
      ...typography.caption,
      color: theme.colors.textMuted,
      fontWeight: '700',
    },
    categoryLabel: {
      ...typography.caption,
      color: theme.colors.textSecondary,
      flex: 1,
      fontWeight: '600',
    },
    categoryLabelBox: {
      flexDirection: 'row',
      gap: spacing.xs,
      width: 130,
    },
    categoryRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    healthBreakdown: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: spacing.md,
    },
    healthHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    healthItem: {
      alignItems: 'center',
    },
    healthItemLabel: {
      ...typography.caption,
      color: theme.colors.textMuted,
    },
    healthItemValue: {
      ...typography.body,
      color: theme.colors.text,
      fontWeight: '700',
    },
    healthLabel: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
      marginTop: spacing.xs,
    },
    healthScore: {
      ...typography.h3,
      color: theme.colors.primary,
      fontWeight: '800',
      marginBottom: spacing.md,
    },
    lastCard: {
      marginBottom: spacing.xxl,
    },
    metricCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.card,
      borderWidth: 1,
      padding: spacing.md,
    },
    metricIcon: {
      fontSize: 22,
      marginBottom: spacing.xs,
    },
    metricLabel: {
      ...typography.caption,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    metricValue: {
      ...typography.h3,
      color: theme.colors.text,
      fontWeight: '700',
    },
    metricWrapper: {
      marginBottom: spacing.sm,
      width: '48%',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      ...typography.h4,
      color: theme.colors.text,
      marginBottom: spacing.md,
    },
    valueName: {
      ...typography.body,
      color: theme.colors.textSecondary,
      flex: 1,
      marginRight: spacing.sm,
    },
    valuePrice: {
      ...typography.body,
      color: theme.colors.secondary,
      fontWeight: '700',
    },
    valueRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
    },
    wasteText: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
      marginTop: spacing.sm,
    },
  });
