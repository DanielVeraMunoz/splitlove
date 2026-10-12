import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GroupKindIcon } from '@/components/group-kind-icon';
import { IconBadge } from '@/components/icon-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { totalsByGroup, type DebtRow } from '@/lib/balance';
import { formatPoints } from '@/lib/format';
import type { Group } from '@/lib/groups';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const theme = useTheme();
  const { session } = useSession();
  const myId = session?.user.id;
  const [groups, setGroups] = useState<Group[]>([]);
  // my net total per group; a group missing here means 0
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Reload every time the screen gains focus, so a group just created shows up
  useFocusEffect(
    useCallback(() => {
      // If we leave the screen before the answer arrives, ignore it
      let ignore = false;

      // Both queries only return what RLS lets me see: my groups and their debts
      Promise.all([
        supabase
          .from('groups')
          .select('id, name, kind')
          .order('created_at', { ascending: false }),
        supabase.from('pair_debts').select('group_id, creditor_id, debtor_id, points'),
      ]).then(
        ([groupRows, debtRows]) => {
          if (ignore) return;
          if (groupRows.error || debtRows.error) {
            setError(t('groups.loadError'));
          } else {
            setError(null);
            setGroups(groupRows.data as Group[]);
            setTotals(myId ? totalsByGroup(debtRows.data as DebtRow[], myId) : {});
          }
          setLoading(false);
        },
        // the query builder only has .then(ok, fail): no .catch/.finally
        () => {
          if (ignore) return;
          setError(t('groups.loadError'));
          setLoading(false);
        },
      );

      return () => {
        ignore = true;
      };
    }, [myId]),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">{t('groups.yourGroups')}</ThemedText>

        {error && <ThemedText themeColor="textSecondary">{error}</ThemedText>}

        <FlatList
          data={groups}
          keyExtractor={(group) => group.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            // don't claim "no groups" before the first answer arrives
            loading ? null : (
              <ThemedText themeColor="textSecondary">
                {t('groups.empty')}
              </ThemedText>
            )
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/group/[id]', params: { id: item.id } })}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <IconBadge>
                  <GroupKindIcon kind={item.kind} />
                </IconBadge>
                <View style={styles.cardText}>
                  <ThemedText type="smallBold">{item.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t(`groups.kinds.${item.kind}`, { defaultValue: item.kind })}
                  </ThemedText>
                </View>
                {/* after a failed load the totals may be stale: better none than wrong */}
                {!error && <GroupTotal total={totals[item.id] ?? 0} />}
              </ThemedView>
            </Pressable>
          )}
        />

        <Pressable
          style={[styles.button, { backgroundColor: theme.text }]}
          onPress={() => router.push('/new-group')}>
          <ThemedText style={{ color: theme.background }}>{t('groups.create')}</ThemedText>
        </Pressable>

        <Pressable onPress={() => router.push('/join-group')}>
          <ThemedText type="link">{t('groups.join')}</ThemedText>
        </Pressable>

        <Pressable onPress={() => supabase.auth.signOut()}>
          <ThemedText type="link">{t('auth.signOut')}</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

// +3 (green): others owe you. -5 (red): you owe. 0: even.
function GroupTotal({ total }: { total: number }) {
  const label =
    total > 0
      ? t('balance.totalOwedToYou', { points: formatPoints(total) })
      : total < 0
        ? t('balance.totalYouOwe', { points: formatPoints(-total) })
        : t('balance.totalEven');

  return (
    <ThemedText
      type="smallBold"
      themeColor={total > 0 ? 'positive' : total < 0 ? 'negative' : 'textSecondary'}
      style={styles.total}
      accessibilityLabel={label}>
      {total > 0 ? `+${total}` : String(total)}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    gap: Spacing.three,
    padding: Spacing.four,
    alignItems: 'stretch',
  },
  list: { gap: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  cardText: { flex: 1, gap: Spacing.one },
  total: { fontSize: 22, lineHeight: 30 },
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
