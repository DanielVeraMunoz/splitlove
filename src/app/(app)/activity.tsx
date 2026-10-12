import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CategoryIcon } from '@/components/category-icon';
import { IconBadge } from '@/components/icon-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useActivity, type ActivityItem } from '@/hooks/use-activity';
import { useTheme } from '@/hooks/use-theme';
import { locale, t } from '@/i18n';
import { isCategoryId } from '@/lib/categories';
import { formatPoints } from '@/lib/format';
import { relativeTime } from '@/lib/relative-time';

function timeAgoText(createdAt: string) {
  const when = relativeTime(new Date(createdAt));
  switch (when.unit) {
    case 'now':
      return t('activity.now');
    case 'minutes':
      return t('activity.minutesAgo', { count: when.count });
    case 'hours':
      return t('activity.hoursAgo', { count: when.count });
    case 'yesterday':
      return t('activity.yesterday');
    case 'days':
      return t('activity.daysAgo', { count: when.count });
    case 'date':
      return new Date(createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  }
}

export default function ActivityScreen() {
  const theme = useTheme();
  const { items, error, loading, reload } = useActivity();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="subtitle">{t('activity.title')}</ThemedText>

        {error && (
          <View style={styles.message}>
            <ThemedText themeColor="textSecondary">{error}</ThemedText>
            <Button label={t('common.retry')} onPress={reload} />
          </View>
        )}

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading && items.length > 0} onRefresh={reload} tintColor={theme.accent} />
          }
          ListEmptyComponent={
            // don't claim "nothing happened" before the first answer arrives or after a failure
            loading || error ? null : (
              <ThemedText themeColor="textSecondary">{t('activity.empty')}</ThemedText>
            )
          }
          renderItem={({ item }) => <ActivityRow item={item} />}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const category = isCategoryId(item.category) ? item.category : 'other';
  const who = item.mine ? t('entries.you') : (item.authorName ?? '?');
  const sub = `${who} · ${item.groupName} · ${timeAgoText(item.createdAt)}`;
  const pointsLabel = t(item.mine ? 'entries.pointsGained' : 'entries.pointsOwed', {
    points: formatPoints(item.points),
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.label}. ${sub}. ${pointsLabel}`}
      onPress={() => router.push({ pathname: '/group/[id]', params: { id: item.groupId } })}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <IconBadge>
          <CategoryIcon category={category} />
        </IconBadge>
        <View style={styles.rowText}>
          <ThemedText type="smallBold" style={styles.rowTitle} numberOfLines={1}>
            {item.label}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.rowSub} numberOfLines={1}>
            {sub}
          </ThemedText>
        </View>
        {/* From my point of view: +N if I did it, -N if someone else did (I owe it) */}
        <ThemedText
          type="smallBold"
          themeColor={item.mine ? 'positive' : 'negative'}
          style={styles.points}>
          {`${item.mine ? '+' : '-'}${item.points}`}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, gap: Spacing.three, padding: Spacing.four },
  message: { gap: Spacing.three },
  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: Radius.card,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, lineHeight: 21 },
  rowSub: { fontSize: 13, lineHeight: 18 },
  points: { fontFamily: FontFamily.display, fontSize: 22, lineHeight: 30 },
});
