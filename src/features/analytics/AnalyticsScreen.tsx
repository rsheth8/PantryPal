import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import PantryHeader from '../../components/PantryHeader';
import PantryCard from '../../components/PantryCard';
import PantryButton from '../../components/PantryButton';
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '../../utils/designSystem';

export default function AnalyticsScreen() {
  const {
    pantry,
    shoppingList,
    recipes,
    users,
    currentUser,
    currentHousehold,
  } = useMultiUserStore();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'spending' | 'waste' | 'household' | 'shopping'
  >('overview');

  const formatMoney = (n: number) => `$${n.toFixed(2)}`;

  const renderBarRow = (
    key: string,
    label: string,
    value: string,
    ratio: number
  ) => (
    <View key={key} style={styles.barRow}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[styles.barFill, { width: `${Math.max(4, ratio * 100)}%` }]}
        />
      </View>
    </View>
  );

  // Calculate analytics data
  const analyticsData = {
    totalItems: pantry.length,
    sharedItems: pantry.filter(item => item.isShared).length,
    privateItems: pantry.filter(item => !item.isShared).length,
    expiredItems: pantry.filter(item => item.isExpired).length,
    expiringSoon: pantry.filter(item => {
      const now = new Date();
      const threeDaysFromNow = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000
      );
      const expirationDate = new Date(item.expirationDate);
      return expirationDate <= threeDaysFromNow && !item.isExpired;
    }).length,
    totalSpent: pantry.reduce((sum, item) => sum + (item.price || 0), 0),
    shoppingItems: shoppingList.length,
    completedShopping: shoppingList.filter(item => item.isCompleted).length,
    totalRecipes: recipes.length,
    canCookNow: recipes.filter(recipe => recipe.canCookNow).length,
  };

  // Derived datasets for the detail tabs
  const avgItemCost = pantry.length
    ? analyticsData.totalSpent / pantry.length
    : 0;
  const shoppingEstimated = shoppingList.reduce(
    (sum, item) => sum + (item.price || 0),
    0
  );
  const spendingByCategory = Object.entries(
    pantry.reduce<Record<string, number>>((acc, item) => {
      const cat = item.category || 'Other';
      acc[cat] = (acc[cat] || 0) + (item.price || 0);
      return acc;
    }, {})
  )
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  const expiringList = pantry.filter(item => {
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return new Date(item.expirationDate) <= threeDaysFromNow && !item.isExpired;
  });
  const expiredValue = pantry
    .filter(item => item.isExpired)
    .reduce((sum, item) => sum + (item.price || 0), 0);
  const usedItems = pantry.filter(item => item.isUsed).length;
  const wasteRate = pantry.length
    ? Math.round((analyticsData.expiredItems / pantry.length) * 100)
    : 0;

  const contributions = Object.entries(
    pantry.reduce<Record<string, number>>((acc, item) => {
      acc[item.addedBy] = (acc[item.addedBy] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([userId, count]) => ({
      name:
        users.find(u => u.id === userId)?.name ||
        (userId === currentUser?.id ? currentUser?.name : undefined) ||
        'Member',
      count,
    }))
    .sort((a, b) => b.count - a.count);
  const memberCount = currentHousehold?.members.length || users.length || 1;

  const shoppingByCategory = Object.entries(
    shoppingList.reduce<Record<string, number>>((acc, item) => {
      const cat = item.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const renderOverviewTab = () => (
    <View>
      {/* Key Metrics */}
      <PantryCard variant='elevated' padding='lg'>
        <Text style={styles.sectionTitle}>📊 Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analyticsData.totalItems}</Text>
            <Text style={styles.metricLabel}>Total Items</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              ${analyticsData.totalSpent.toFixed(2)}
            </Text>
            <Text style={styles.metricLabel}>Total Spent</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analyticsData.totalRecipes}</Text>
            <Text style={styles.metricLabel}>Recipes</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {analyticsData.shoppingItems}
            </Text>
            <Text style={styles.metricLabel}>Shopping Items</Text>
          </View>
        </View>
      </PantryCard>

      {/* Pantry Status */}
      <PantryCard variant='fresh' padding='lg'>
        <Text style={styles.sectionTitle}>🥫 Pantry Status</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>✅</Text>
            <Text style={styles.statusValue}>{analyticsData.sharedItems}</Text>
            <Text style={styles.statusLabel}>Shared Items</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>🔒</Text>
            <Text style={styles.statusValue}>{analyticsData.privateItems}</Text>
            <Text style={styles.statusLabel}>Private Items</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>⚠️</Text>
            <Text style={styles.statusValue}>{analyticsData.expiringSoon}</Text>
            <Text style={styles.statusLabel}>Expiring Soon</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>❌</Text>
            <Text style={styles.statusValue}>{analyticsData.expiredItems}</Text>
            <Text style={styles.statusLabel}>Expired</Text>
          </View>
        </View>
      </PantryCard>

      {/* Shopping Progress */}
      <PantryCard variant='warm' padding='lg'>
        <Text style={styles.sectionTitle}>🛒 Shopping Progress</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {analyticsData.completedShopping} of {analyticsData.shoppingItems}{' '}
              completed
            </Text>
            <Text style={styles.progressPercentage}>
              {analyticsData.shoppingItems > 0
                ? Math.round(
                    (analyticsData.completedShopping /
                      analyticsData.shoppingItems) *
                      100
                  )
                : 0}
              %
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    analyticsData.shoppingItems > 0
                      ? (analyticsData.completedShopping /
                          analyticsData.shoppingItems) *
                        100
                      : 0
                  }%`,
                },
              ]}
            />
          </View>
        </View>
      </PantryCard>
    </View>
  );

  const renderSpendingTab = () => {
    const maxCat = spendingByCategory[0]?.[1] || 1;
    return (
      <View>
        <PantryCard variant='elevated' padding='lg'>
          <Text style={styles.sectionTitle}>💰 Spending Analysis</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {formatMoney(analyticsData.totalSpent)}
              </Text>
              <Text style={styles.metricLabel}>Pantry Value</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatMoney(avgItemCost)}</Text>
              <Text style={styles.metricLabel}>Avg / Item</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {formatMoney(shoppingEstimated)}
              </Text>
              <Text style={styles.metricLabel}>Shopping Est.</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {formatMoney(analyticsData.totalSpent + shoppingEstimated)}
              </Text>
              <Text style={styles.metricLabel}>Projected</Text>
            </View>
          </View>
        </PantryCard>

        <PantryCard variant='warm' padding='lg'>
          <Text style={styles.sectionTitle}>📂 Spending by Category</Text>
          {spendingByCategory.length === 0 ? (
            <Text style={styles.placeholderText}>
              Add prices to your items to see spending breakdowns.
            </Text>
          ) : (
            spendingByCategory.map(([cat, amount]) =>
              renderBarRow(cat, cat, formatMoney(amount), amount / maxCat)
            )
          )}
        </PantryCard>
      </View>
    );
  };

  const renderWasteTab = () => (
    <View>
      <PantryCard variant='elevated' padding='lg'>
        <Text style={styles.sectionTitle}>🗑️ Waste Tracking</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analyticsData.expiredItems}</Text>
            <Text style={styles.metricLabel}>Expired Items</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatMoney(expiredValue)}</Text>
            <Text style={styles.metricLabel}>Value Wasted</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{usedItems}</Text>
            <Text style={styles.metricLabel}>Items Used</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{wasteRate}%</Text>
            <Text style={styles.metricLabel}>Waste Rate</Text>
          </View>
        </View>
      </PantryCard>

      <PantryCard variant='warm' padding='lg'>
        <Text style={styles.sectionTitle}>
          ⚠️ Expiring Soon ({analyticsData.expiringSoon})
        </Text>
        {expiringList.length === 0 ? (
          <Text style={styles.placeholderText}>
            Nothing expiring in the next 3 days. 🎉
          </Text>
        ) : (
          expiringList.map(item => (
            <View key={item.id} style={styles.listRow}>
              <Text style={styles.listName}>{item.name}</Text>
              <Text style={styles.listMeta}>{item.expirationDate}</Text>
            </View>
          ))
        )}
      </PantryCard>
    </View>
  );

  const renderHouseholdTab = () => {
    const maxContrib = contributions[0]?.count || 1;
    return (
      <View>
        <PantryCard variant='elevated' padding='lg'>
          <Text style={styles.sectionTitle}>🏠 Household Insights</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{memberCount}</Text>
              <Text style={styles.metricLabel}>Members</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {analyticsData.sharedItems}
              </Text>
              <Text style={styles.metricLabel}>Shared Items</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {analyticsData.privateItems}
              </Text>
              <Text style={styles.metricLabel}>Private Items</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {analyticsData.totalRecipes}
              </Text>
              <Text style={styles.metricLabel}>Recipes</Text>
            </View>
          </View>
        </PantryCard>

        <PantryCard variant='warm' padding='lg'>
          <Text style={styles.sectionTitle}>👥 Contributions</Text>
          {contributions.length === 0 ? (
            <Text style={styles.placeholderText}>No items added yet.</Text>
          ) : (
            contributions.map(c =>
              renderBarRow(
                c.name,
                c.name,
                `${c.count} item${c.count !== 1 ? 's' : ''}`,
                c.count / maxContrib
              )
            )
          )}
        </PantryCard>
      </View>
    );
  };

  const renderShoppingTab = () => {
    const maxShop = shoppingByCategory[0]?.[1] || 1;
    const pct =
      analyticsData.shoppingItems > 0
        ? Math.round(
            (analyticsData.completedShopping / analyticsData.shoppingItems) *
              100
          )
        : 0;
    return (
      <View>
        <PantryCard variant='elevated' padding='lg'>
          <Text style={styles.sectionTitle}>🛒 Shopping Analytics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {analyticsData.shoppingItems}
              </Text>
              <Text style={styles.metricLabel}>Total Items</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {analyticsData.completedShopping}
              </Text>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{pct}%</Text>
              <Text style={styles.metricLabel}>Progress</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {formatMoney(shoppingEstimated)}
              </Text>
              <Text style={styles.metricLabel}>Est. Cost</Text>
            </View>
          </View>
        </PantryCard>

        <PantryCard variant='warm' padding='lg'>
          <Text style={styles.sectionTitle}>📂 Items by Category</Text>
          {shoppingByCategory.length === 0 ? (
            <Text style={styles.placeholderText}>
              Your shopping list is empty.
            </Text>
          ) : (
            shoppingByCategory.map(([cat, count]) =>
              renderBarRow(cat, cat, `${count}`, count / maxShop)
            )
          )}
        </PantryCard>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'spending':
        return renderSpendingTab();
      case 'waste':
        return renderWasteTab();
      case 'household':
        return renderHouseholdTab();
      case 'shopping':
        return renderShoppingTab();
      default:
        return renderOverviewTab();
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'spending', label: 'Spending', icon: '💰' },
    { key: 'waste', label: 'Waste', icon: '🗑️' },
    { key: 'household', label: 'Household', icon: '🏠' },
    { key: 'shopping', label: 'Shopping', icon: '🛒' },
  ];

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Analytics'
        subtitle='Insights into your pantry'
        gradient='ocean'
      />

      <View style={styles.content}>
        {/* Tab Navigation */}
        <PantryCard variant='outlined' padding='md' margin='none'>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabContainer}>
              {tabs.map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tabButton,
                    activeTab === tab.key && styles.activeTabButton,
                  ]}
                  onPress={() => setActiveTab(tab.key as any)}
                >
                  <Text style={styles.tabIcon}>{tab.icon}</Text>
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === tab.key && styles.activeTabLabel,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </PantryCard>

        {/* Tab Content */}
        <ScrollView
          style={styles.tabContent}
          showsVerticalScrollIndicator={false}
        >
          {renderTabContent()}
        </ScrollView>

        {/* Quick Actions */}
        <PantryCard variant='default' padding='lg'>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <PantryButton
              title='Export Data'
              onPress={() => Alert.alert('Export', 'Export analytics data')}
              variant='outline'
              size='sm'
              icon='📤'
              fullWidth
            />
            <PantryButton
              title='Generate Report'
              onPress={() => Alert.alert('Report', 'Generate detailed report')}
              variant='outline'
              size='sm'
              icon='📋'
              fullWidth
            />
          </View>
        </PantryCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsGrid: {
    gap: spacing.sm,
  },
  activeTabButton: {
    backgroundColor: colors.primary[500],
  },
  activeTabLabel: {
    color: '#fff',
  },
  barFill: {
    backgroundColor: colors.primary[500],
    borderRadius: 4,
    height: '100%',
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  barLabel: {
    ...typography.bodySmall,
    color: colors.neutral[700],
  },
  barRow: {
    marginBottom: spacing.md,
  },
  barTrack: {
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  barValue: {
    ...typography.bodySmall,
    color: colors.neutral[800],
    fontWeight: '600',
  },
  container: {
    backgroundColor: colors.neutral[50],
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  listMeta: {
    ...typography.bodySmall,
    color: colors.neutral[600],
  },
  listName: {
    ...typography.body,
    color: colors.neutral[800],
  },
  listRow: {
    borderBottomColor: colors.neutral[100],
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    width: '48%',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  metricValue: {
    ...typography.h2,
    color: colors.neutral[900],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  placeholderText: {
    ...typography.body,
    color: colors.neutral[600],
    fontStyle: 'italic',
    textAlign: 'center',
  },
  progressBar: {
    backgroundColor: colors.neutral[200],
    borderRadius: 6,
    height: 12,
    overflow: 'hidden',
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressFill: {
    backgroundColor: colors.success,
    borderRadius: 6,
    height: '100%',
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressPercentage: {
    ...typography.body,
    color: colors.neutral[700],
    fontWeight: '600',
  },
  progressText: {
    ...typography.body,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.neutral[800],
    marginBottom: spacing.md,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    ...typography.caption,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  statusValue: {
    ...typography.h3,
    color: colors.neutral[900],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  tabButton: {
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.md,
    minWidth: 80,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tabContent: {
    flex: 1,
    marginTop: spacing.md,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.neutral[700],
    fontWeight: '500',
  },
});
