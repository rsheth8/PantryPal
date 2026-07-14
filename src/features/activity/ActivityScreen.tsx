import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import { userService, HouseholdActivity } from '../../services/userService';
import PantryHeader from '../../components/PantryHeader';
import { FadeSlideIn, EmptyState, Skeleton } from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles, useTheme } from '../../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../../utils/designSystem';

const ACTION_META: Record<
  HouseholdActivity['action'],
  {
    icon: string;
    verb: string;
    tone: 'primary' | 'success' | 'error' | 'accent';
  }
> = {
  added: { icon: '➕', verb: 'added', tone: 'primary' },
  updated: { icon: '✏️', verb: 'updated', tone: 'accent' },
  removed: { icon: '🗑️', verb: 'removed', tone: 'error' },
  used: { icon: '✅', verb: 'used', tone: 'success' },
  joined: { icon: '👋', verb: 'joined the household', tone: 'primary' },
  left: { icon: '🚪', verb: 'left the household', tone: 'error' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ActivityScreen() {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const { currentHousehold } = useMultiUserStore();

  const [activity, setActivity] = useState<HouseholdActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!currentHousehold) {
      setActivity([]);
      setLoading(false);
      return;
    }
    const rows = await userService.getHouseholdActivity(currentHousehold.id);
    setActivity(rows);
    setLoading(false);
  }, [currentHousehold]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toneColor = (tone: 'primary' | 'success' | 'error' | 'accent') =>
    ({
      primary: theme.colors.primary,
      success: theme.colors.success,
      error: theme.colors.error,
      accent: theme.colors.accent,
    })[tone];

  const renderItem = ({
    item,
    index,
  }: {
    item: HouseholdActivity;
    index: number;
  }) => {
    const meta = ACTION_META[item.action];
    const isLast = index === activity.length - 1;
    return (
      <FadeSlideIn delay={Math.min(index, 10) * 40}>
        <View style={styles.row}>
          <View style={styles.timeline}>
            <View
              style={[styles.dot, { backgroundColor: toneColor(meta.tone) }]}
            >
              <Text style={styles.dotIcon}>{meta.icon}</Text>
            </View>
            {!isLast && <View style={styles.line} />}
          </View>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              <Text style={styles.actor}>{item.userName || 'Someone'}</Text>{' '}
              {meta.verb}
              {item.itemName ? (
                <Text style={styles.itemName}> {item.itemName}</Text>
              ) : null}
            </Text>
            <Text style={styles.time}>{timeAgo(item.timestamp)}</Text>
          </View>
        </View>
      </FadeSlideIn>
    );
  };

  return (
    <View style={styles.container}>
      <PantryHeader
        title='Activity'
        subtitle={currentHousehold?.name ?? 'Household activity'}
        gradient='garden'
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {!currentHousehold ? (
        <EmptyState
          emoji='🏠'
          title='No household yet'
          message='Join or create a household to see a shared activity feed of everything your members do.'
          actionLabel='Set up household'
          onAction={() => navigation.navigate('Household')}
        />
      ) : loading ? (
        <View style={styles.loadingWrap}>
          {[0, 1, 2, 3, 4].map(i => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={40} height={40} borderRadius={20} />
              <View style={styles.skeletonBody}>
                <Skeleton height={14} width='70%' />
                <Skeleton height={10} width='30%' style={styles.skeletonGap} />
              </View>
            </View>
          ))}
        </View>
      ) : activity.length === 0 ? (
        <EmptyState
          emoji='📭'
          title='No activity yet'
          message='When household members add, use, or remove items, it shows up here.'
        />
      ) : (
        <FlatList
          data={activity}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    actor: {
      color: theme.colors.text,
      fontWeight: '700',
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      flex: 1,
      marginBottom: spacing.sm,
      padding: spacing.md,
    },
    cardText: {
      ...typography.bodySmall,
      color: theme.colors.textSecondary,
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    dot: {
      alignItems: 'center',
      borderRadius: 18,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    dotIcon: {
      fontSize: 16,
    },
    itemName: {
      color: theme.colors.text,
      fontWeight: '600',
    },
    line: {
      backgroundColor: theme.colors.border,
      flex: 1,
      marginVertical: 2,
      width: 2,
    },
    listContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    loadingWrap: {
      padding: spacing.md,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    skeletonBody: {
      flex: 1,
      marginLeft: spacing.md,
    },
    skeletonGap: {
      marginTop: spacing.xs,
    },
    skeletonRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: spacing.lg,
    },
    time: {
      ...typography.caption,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    timeline: {
      alignItems: 'center',
      width: 36,
    },
  });
