import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMultiUserStore } from '../../store/useMultiUserStore';
import { EmptyState, FadeSlideIn } from '../../components/ui';
import { Theme } from '../../theme/themes';
import { useThemedStyles, useTheme } from '../../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../../utils/designSystem';
import { searchAll, SearchResult } from '../../utils/globalSearch';

export default function SearchModal({
  visible,
  onClose,
  onNavigate,
}: {
  visible: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { pantry, recipes, shoppingList } = useMultiUserStore();
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => searchAll(query, { pantry, recipes, shoppingList }),
    [query, pantry, recipes, shoppingList]
  );

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = (result: SearchResult) => {
    const tab =
      result.type === 'pantry'
        ? 'Pantry'
        : result.type === 'recipe'
          ? 'Recipes'
          : 'Shopping';
    handleClose();
    onNavigate(tab);
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: SearchResult;
    index: number;
  }) => (
    <FadeSlideIn delay={Math.min(index, 10) * 30} offsetY={10}>
      <TouchableOpacity
        style={styles.resultRow}
        onPress={() => handleSelect(item)}
        accessibilityRole='button'
      >
        <Text style={styles.resultIcon}>{item.icon}</Text>
        <View style={styles.resultBody}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>
        <Text style={styles.resultChevron}>›</Text>
      </TouchableOpacity>
    </FadeSlideIn>
  );

  return (
    <Modal
      visible={visible}
      animationType='fade'
      onRequestClose={handleClose}
      presentationStyle='fullScreen'
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder='Search pantry, recipes, shopping…'
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType='search'
            autoCorrect={false}
          />
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {query.length === 0 ? (
          <EmptyState
            emoji='🔎'
            title='Search everything'
            message='Find any item, recipe, or shopping-list entry in one place.'
          />
        ) : results.length === 0 ? (
          <EmptyState
            emoji='🤷'
            title='No matches'
            message={`Nothing found for "${query}".`}
          />
        ) : (
          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={item => `${item.type}-${item.id}`}
            keyboardShouldPersistTaps='handled'
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    cancelButton: {
      paddingHorizontal: spacing.xs,
    },
    cancelText: {
      ...typography.bodySmall,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    listContent: {
      padding: spacing.md,
    },
    resultBody: {
      flex: 1,
      marginLeft: spacing.md,
    },
    resultChevron: {
      ...typography.h4,
      color: theme.colors.textMuted,
    },
    resultIcon: {
      fontSize: 22,
    },
    resultRow: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      flexDirection: 'row',
      marginBottom: spacing.sm,
      padding: spacing.md,
    },
    resultSubtitle: {
      ...typography.caption,
      color: theme.colors.textMuted,
    },
    resultTitle: {
      ...typography.body,
      color: theme.colors.text,
      fontWeight: '600',
    },
    searchBar: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    searchIcon: {
      fontSize: 18,
    },
    searchInput: {
      ...typography.body,
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.input,
      borderWidth: 1,
      color: theme.colors.text,
      flex: 1,
      height: 44,
      paddingHorizontal: spacing.md,
    },
  });
