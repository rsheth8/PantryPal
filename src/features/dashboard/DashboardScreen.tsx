import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../utils/designSystem';

export default function DashboardScreen() {
  const { pantry, recipes, shoppingList, currentUser, currentHousehold } =
    useMultiUserStore();
  const [stats, setStats] = useState({
    totalItems: 0,
    expiringSoon: 0,
    lowStock: 0,
    totalRecipes: 0,
    canCookNow: 0,
    shoppingItems: 0,
  });

  useFocusEffect(
    React.useCallback(() => {
      calculateStats();
    }, [pantry, recipes, shoppingList])
  );

  const calculateStats = () => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const expiringSoon = pantry.filter(item => {
      const expirationDate = new Date(item.expirationDate);
      return expirationDate <= threeDaysFromNow && !item.isExpired;
    }).length;

    const lowStock = pantry.filter(
      item => item.quantity <= 1 && !item.isExpired
    ).length;
    const canCookNow = recipes.filter(recipe => recipe.canCookNow).length;

    setStats({
      totalItems: pantry.length,
      expiringSoon,
      lowStock,
      totalRecipes: recipes.length,
      canCookNow,
      shoppingItems: shoppingList.length,
    });
  };

  const renderStatCard = (
    title: string,
    value: number,
    icon: string,
    color: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}
      >
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const renderQuickAction = (
    title: string,
    icon: string,
    color: string,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={styles.quickActionCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[styles.actionIconContainer, { backgroundColor: `${color}20` }]}
      >
        <Text style={styles.actionIcon}>{icon}</Text>
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Dashboard'
        subtitle={`Welcome back, ${currentUser?.name || 'User'}! 👋`}
        gradient='garden'
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <PantryCard variant='elevated' padding='lg'>
          <Text style={styles.sectionTitle}>📊 Quick Stats</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Total Items',
              stats.totalItems,
              '🥫',
              colors.primary[500]
            )}
            {renderStatCard(
              'Expiring Soon',
              stats.expiringSoon,
              '⚠️',
              colors.warning
            )}
            {renderStatCard(
              'Low Stock',
              stats.lowStock,
              '📉',
              colors.citrus[500]
            )}
            {renderStatCard(
              'Recipes',
              stats.totalRecipes,
              '📖',
              colors.secondary[500]
            )}
            {renderStatCard(
              'Can Cook Now',
              stats.canCookNow,
              '🍳',
              colors.success
            )}
            {renderStatCard(
              'Shopping List',
              stats.shoppingItems,
              '��',
              colors.accent[500]
            )}
          </View>
        </PantryCard>

        {/* Quick Actions */}
        <PantryCard variant='fresh' padding='lg'>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {renderQuickAction('Add Item', '➕', colors.primary[500], () => {
              Alert.alert('Add Item', 'Navigate to Pantry to add items');
            })}
            {renderQuickAction(
              'Find Recipe',
              '🔍',
              colors.secondary[500],
              () => {
                Alert.alert(
                  'Find Recipe',
                  'Navigate to Recipes to discover meals'
                );
              }
            )}
            {renderQuickAction('Scan Barcode', '📱', colors.accent[500], () => {
              Alert.alert('Scan Barcode', 'Navigate to Scanner to scan items');
            })}
            {renderQuickAction('View Analytics', '📈', colors.sage[500], () => {
              Alert.alert('Analytics', 'View detailed analytics and insights');
            })}
          </View>
        </PantryCard>

        {/* Household Info */}
        {currentHousehold && (
          <PantryCard variant='warm' padding='lg'>
            <Text style={styles.sectionTitle}>🏠 Household</Text>
            <View style={styles.householdInfo}>
              <Text style={styles.householdName}>{currentHousehold.name}</Text>
              <Text style={styles.householdCode}>
                Code: {currentHousehold.code}
              </Text>
              <PantryButton
                title='Manage Household'
                onPress={() =>
                  Alert.alert('Household', 'Navigate to household settings')
                }
                variant='outline'
                size='sm'
                fullWidth
              />
            </View>
          </PantryCard>
        )}

        {/* Recent Activity */}
        <PantryCard variant='default' padding='lg'>
          <Text style={styles.sectionTitle}>🕒 Recent Activity</Text>
          <View style={styles.activityItem}>
            <Text style={styles.activityText}>No recent activity</Text>
            <Text style={styles.activitySubtext}>
              Your household activity will appear here
            </Text>
          </View>
        </PantryCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: colors.neutral[700],
    fontWeight: '600',
    textAlign: 'center',
  },
  activityItem: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  activitySubtext: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  activityText: {
    ...typography.body,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  container: {
    backgroundColor: colors.neutral[50],
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  householdCode: {
    ...typography.bodySmall,
    color: colors.neutral[600],
    fontFamily: 'monospace',
    marginBottom: spacing.md,
  },
  householdInfo: {
    alignItems: 'center',
  },
  householdName: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  quickActionCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    marginBottom: spacing.md,
    padding: spacing.md,
    width: '48%',
    ...shadows.sm,
    borderColor: colors.primary[100],
    borderWidth: 1,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    marginBottom: spacing.md,
    padding: spacing.md,
    width: '48%',
    ...shadows.sm,
    borderColor: colors.neutral[100],
    borderWidth: 1,
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
    color: colors.neutral[600],
    textAlign: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.neutral[900],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
