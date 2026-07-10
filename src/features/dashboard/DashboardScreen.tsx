import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  AnimatedPressable,
  FadeSlideIn,
  AmbientBackground,
} from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles, useTheme } from '../../theme/ThemeContext';
import {
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../utils/designSystem';
import { getDaysUntilExpiration, isExpiringSoon } from '../../utils/helpers';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const { pantry, recipes, shoppingList, currentUser, currentHousehold } =
    useMultiUserStore();

  const stats = useMemo(() => {
    const active = pantry.filter(item => !item.isUsed);
    const expiring = active.filter(item => isExpiringSoon(item));
    return {
      totalItems: active.length,
      expiringSoon: expiring.length,
      lowStock: active.filter(item => item.quantity <= 1 && !item.isExpired)
        .length,
      totalRecipes: recipes.length,
      canCookNow: recipes.filter(recipe => recipe.canCookNow).length,
      shoppingItems: shoppingList.filter(item => !item.isCompleted).length,
      expiringPreview: expiring
        .slice()
        .sort(
          (a, b) =>
            getDaysUntilExpiration(a.expirationDate) -
            getDaysUntilExpiration(b.expirationDate)
        )
        .slice(0, 3),
      recentItems: pantry
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 3),
    };
  }, [pantry, recipes, shoppingList]);

  const goToTab = (tab: string) => navigation.navigate(tab);
  const goToScreen = (screen: string) => navigation.navigate(screen);

  const statCards = [
    {
      title: 'Pantry Items',
      value: stats.totalItems,
      icon: '🥫',
      color: theme.palette.primary[500],
      onPress: () => goToTab('Pantry'),
    },
    {
      title: 'Expiring Soon',
      value: stats.expiringSoon,
      icon: '⏰',
      color: theme.colors.warning,
      onPress: () => goToTab('Pantry'),
    },
    {
      title: 'Low Stock',
      value: stats.lowStock,
      icon: '📉',
      color: theme.palette.citrus[500],
      onPress: () => goToTab('Shopping'),
    },
    {
      title: 'Recipes',
      value: stats.totalRecipes,
      icon: '📖',
      color: theme.palette.secondary[500],
      onPress: () => goToTab('Recipes'),
    },
    {
      title: 'Can Cook Now',
      value: stats.canCookNow,
      icon: '🍳',
      color: theme.colors.success,
      onPress: () => goToTab('Recipes'),
    },
    {
      title: 'To Buy',
      value: stats.shoppingItems,
      icon: '🛒',
      color: theme.palette.accent[500],
      onPress: () => goToTab('Shopping'),
    },
  ];

  const quickActions = [
    {
      title: 'Scan Item',
      icon: '📷',
      color: theme.palette.accent[500],
      onPress: () => goToTab('Scanner'),
    },
    {
      title: 'Meal Plan',
      icon: '🍽️',
      color: theme.palette.secondary[500],
      onPress: () => goToScreen('MealPlanning'),
    },
    {
      title: 'Analytics',
      icon: '📈',
      color: theme.palette.sage[500],
      onPress: () => goToScreen('Analytics'),
    },
    {
      title: 'Household',
      icon: '🏠',
      color: theme.palette.lavender[500],
      onPress: () => goToScreen('Household'),
    },
  ];

  return (
    <View style={styles.container}>
      <AmbientBackground variant='primary' />
      <PantryHeader
        title={`${getGreeting()}, ${currentUser?.name?.split(' ')[0] || 'Chef'}!`}
        subtitle={
          stats.expiringSoon > 0
            ? `${stats.expiringSoon} item${stats.expiringSoon === 1 ? '' : 's'} expiring soon — let's use ${stats.expiringSoon === 1 ? 'it' : 'them'}! 🧑‍🍳`
            : 'Everything in your pantry is fresh ✨'
        }
        gradient='garden'
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((card, index) => (
            <FadeSlideIn
              key={card.title}
              delay={index * 70}
              style={styles.statCardWrapper}
            >
              <AnimatedPressable
                onPress={card.onPress}
                style={styles.statCard}
                accessibilityLabel={`${card.title}: ${card.value}`}
              >
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: `${card.color}22` },
                  ]}
                >
                  <Text style={styles.statIcon}>{card.icon}</Text>
                </View>
                <Text style={styles.statValue}>{card.value}</Text>
                <Text style={styles.statTitle}>{card.title}</Text>
              </AnimatedPressable>
            </FadeSlideIn>
          ))}
        </View>

        {/* Expiring soon preview */}
        {stats.expiringPreview.length > 0 && (
          <FadeSlideIn delay={420}>
            <PantryCard variant='warm' padding='lg'>
              <Text style={styles.sectionTitle}>⏰ Use these first</Text>
              {stats.expiringPreview.map(item => {
                const days = getDaysUntilExpiration(item.expirationDate);
                return (
                  <View key={item.id} style={styles.expiringRow}>
                    <Text style={styles.expiringName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View
                      style={[
                        styles.expiringBadge,
                        {
                          backgroundColor:
                            days <= 1
                              ? theme.colors.errorSoft
                              : theme.colors.warningSoft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.expiringBadgeText,
                          {
                            color:
                              days <= 1
                                ? theme.colors.error
                                : theme.colors.warning,
                          },
                        ]}
                      >
                        {days <= 0
                          ? 'Today'
                          : days === 1
                            ? '1 day'
                            : `${days} days`}
                      </Text>
                    </View>
                  </View>
                );
              })}
              <PantryButton
                title='Find recipes for these'
                onPress={() => goToTab('Recipes')}
                variant='outline'
                size='sm'
                fullWidth
              />
            </PantryCard>
          </FadeSlideIn>
        )}

        {/* Quick Actions */}
        <FadeSlideIn delay={490}>
          <PantryCard variant='fresh' padding='lg'>
            <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map(action => (
                <AnimatedPressable
                  key={action.title}
                  onPress={action.onPress}
                  style={styles.quickActionCard}
                  accessibilityLabel={action.title}
                >
                  <View
                    style={[
                      styles.actionIconContainer,
                      { backgroundColor: `${action.color}22` },
                    ]}
                  >
                    <Text style={styles.actionIcon}>{action.icon}</Text>
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </PantryCard>
        </FadeSlideIn>

        {/* Household Info */}
        <FadeSlideIn delay={560}>
          {currentHousehold ? (
            <PantryCard variant='warm' padding='lg'>
              <Text style={styles.sectionTitle}>🏠 Household</Text>
              <View style={styles.householdInfo}>
                <Text style={styles.householdName}>
                  {currentHousehold.name}
                </Text>
                <Text style={styles.householdCode}>
                  Invite code: {currentHousehold.code}
                </Text>
                <PantryButton
                  title='Manage Household'
                  onPress={() => goToScreen('Household')}
                  variant='outline'
                  size='sm'
                  fullWidth
                />
              </View>
            </PantryCard>
          ) : (
            <PantryCard variant='warm' padding='lg'>
              <Text style={styles.sectionTitle}>🏠 Better together</Text>
              <Text style={styles.householdPrompt}>
                Create or join a household to share your pantry and shopping
                list with family or roommates.
              </Text>
              <PantryButton
                title='Set up household'
                onPress={() => goToScreen('Household')}
                variant='secondary'
                size='md'
                icon='🤝'
                fullWidth
              />
            </PantryCard>
          )}
        </FadeSlideIn>

        {/* Recently added */}
        <FadeSlideIn delay={630}>
          <PantryCard variant='default' padding='lg'>
            <Text style={styles.sectionTitle}>🕒 Recently Added</Text>
            {stats.recentItems.length > 0 ? (
              stats.recentItems.map(item => (
                <View key={item.id} style={styles.activityRow}>
                  <Text style={styles.activityBullet}>•</Text>
                  <Text style={styles.activityText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.activityMeta}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.activityItem}>
                <Text style={styles.activityEmpty}>
                  Nothing here yet — scan or add your first item!
                </Text>
                <PantryButton
                  title='Add items'
                  onPress={() => goToTab('Pantry')}
                  variant='ghost'
                  size='sm'
                />
              </View>
            )}
          </PantryCard>
        </FadeSlideIn>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    actionIcon: {
      fontSize: 24,
    },
    actionIconContainer: {
      alignItems: 'center',
      borderRadius: 28,
      height: 56,
      justifyContent: 'center',
      marginBottom: spacing.sm,
      width: 56,
    },
    actionTitle: {
      ...typography.bodySmall,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      textAlign: 'center',
    },
    activityBullet: {
      color: theme.colors.primary,
      fontSize: 18,
      marginRight: spacing.sm,
    },
    activityEmpty: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    activityItem: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    activityMeta: {
      ...typography.caption,
      color: theme.colors.textMuted,
    },
    activityRow: {
      alignItems: 'center',
      flexDirection: 'row',
      paddingVertical: spacing.xs,
    },
    activityText: {
      ...typography.body,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    expiringBadge: {
      borderRadius: borderRadius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    expiringBadgeText: {
      ...typography.caption,
      fontWeight: '700',
    },
    expiringName: {
      ...typography.body,
      color: theme.colors.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    expiringRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    householdCode: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
      fontFamily: 'monospace',
      marginBottom: spacing.md,
    },
    householdInfo: {
      alignItems: 'center',
    },
    householdName: {
      ...typography.h4,
      color: theme.colors.text,
      marginBottom: spacing.xs,
    },
    householdPrompt: {
      ...typography.bodySmall,
      color: theme.colors.textMuted,
      marginBottom: spacing.md,
    },
    quickActionCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.card,
      borderWidth: 1,
      marginBottom: spacing.md,
      padding: spacing.md,
      width: '48%',
      ...shadows.sm,
      shadowColor: theme.colors.shadow,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    sectionTitle: {
      ...typography.h4,
      color: theme.colors.text,
      marginBottom: spacing.md,
    },
    statCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.card,
      borderWidth: 1,
      padding: spacing.md,
      ...shadows.sm,
      shadowColor: theme.colors.shadow,
    },
    statCardWrapper: {
      marginBottom: spacing.md,
      width: '48%',
    },
    statIcon: {
      fontSize: 20,
    },
    statIconContainer: {
      alignItems: 'center',
      borderRadius: 24,
      height: 48,
      justifyContent: 'center',
      marginBottom: spacing.sm,
      width: 48,
    },
    statTitle: {
      ...typography.caption,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    statValue: {
      ...typography.h3,
      color: theme.colors.text,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
  });
