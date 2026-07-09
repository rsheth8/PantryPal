import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
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
  pantryTokens,
} from '../../utils/designSystem';

export default function DashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<any>>();
  const {
    pantry,
    recipes,
    shoppingList,
    currentUser,
    currentHousehold,
    preferences,
    getExpiringItems,
    getLowStockItems,
  } = useMultiUserStore();
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
    const expiringSoon = getExpiringItems().length;
    const lowStock = getLowStockItems().length;
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
        style={[styles.statIconContainer, { backgroundColor: color + '20' }]}
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
        style={[styles.actionIconContainer, { backgroundColor: color + '20' }]}
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
              colors.warning,
              () => navigation.navigate('Pantry', { filter: 'expiring' })
            )}
            {renderStatCard(
              'Low Stock',
              stats.lowStock,
              '📉',
              colors.citrus[500],
              () => navigation.navigate('Pantry', { filter: 'lowStock' })
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
              navigation.navigate('Pantry', { showAddModal: true });
            })}
            {renderQuickAction(
              'Find Recipe',
              '🔍',
              colors.secondary[500],
              () => navigation.navigate('Recipes')
            )}
            {renderQuickAction('Scan Barcode', '📱', colors.accent[500], () => {
              navigation.navigate('Scanner');
            })}
            {renderQuickAction('Shopping List', '🛒', colors.sage[500], () => {
              navigation.navigate('Shopping');
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

        {/* Expiring items preview */}
        {getExpiringItems().length > 0 && (
          <PantryCard variant='outlined' padding='lg'>
            <Text style={styles.sectionTitle}>⚠️ Expiring Soon</Text>
            {getExpiringItems()
              .slice(0, 3)
              .map(item => (
                <Text key={item.id} style={styles.expiringItem}>
                  {item.name} — expires {item.expirationDate}
                </Text>
              ))}
            <PantryButton
              title='View All in Pantry'
              onPress={() =>
                navigation.navigate('Pantry', { filter: 'expiring' })
              }
              variant='outline'
              size='sm'
              fullWidth
            />
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
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: spacing.md,
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    ...typography.h3,
    color: colors.neutral[900],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statTitle: {
    ...typography.caption,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    marginBottom: spacing.md,
    backgroundColor: '#fff',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionTitle: {
    ...typography.bodySmall,
    color: colors.neutral[700],
    fontWeight: '600',
    textAlign: 'center',
  },
  householdInfo: {
    alignItems: 'center',
  },
  householdName: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.xs,
  },
  householdCode: {
    ...typography.bodySmall,
    color: colors.neutral[600],
    marginBottom: spacing.md,
    fontFamily: 'monospace',
  },
  activityItem: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  activityText: {
    ...typography.body,
    color: colors.neutral[600],
    marginBottom: spacing.xs,
  },
  activitySubtext: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  expiringItem: {
    ...typography.bodySmall,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
});
