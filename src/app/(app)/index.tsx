import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GroupKindIcon } from '@/components/group-kind-icon';
import { IconBadge } from '@/components/icon-badge';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Wordmark } from '@/components/wordmark';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { t } from '@/i18n';
import { totalsByGroup, type DebtRow } from '@/lib/balance';
import { formatPoints } from '@/lib/format';
import type { Group } from '@/lib/groups';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { session } = useSession();
  const myId = session?.user.id;
  const [groups, setGroups] = useState<Group[]>([]);
  // my net total per group (a group missing here means 0). null = not known:
  // not loaded yet, or the debts query failed. Then no number is shown at all.
  const [totals, setTotals] = useState<Record<string, number> | null>(null);
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
        // only the rows that involve me: the view lists every pair of every group
        myId
          ? supabase
              .from('pair_debts')
              .select('group_id, creditor_id, debtor_id, points')
              .or(`creditor_id.eq.${myId},debtor_id.eq.${myId}`)
          : Promise.resolve({ data: null, error: new Error('no session') }),
      ]).then(
        ([groupRows, debtRows]) => {
          if (ignore) return;
          if (groupRows.error) {
            setError(t('groups.loadError'));
            setTotals(null);
          } else {
            setError(null);
            setGroups(groupRows.data as Group[]);
            // The totals are an extra: if only they fail, the list still updates
            // and just the numbers disappear.
            setTotals(
              debtRows.error || !myId ? null : totalsByGroup(debtRows.data as DebtRow[], myId),
            );
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
        <View style={styles.header}>
          <Wordmark size={22} />
          <ThemedText type="subtitle">{t('groups.yourGroups')}</ThemedText>
        </View>

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
                  <ThemedText type="smallBold" style={styles.cardTitle}>
                    {item.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.cardSub}>
                    {t(`groups.kinds.${item.kind}`, { defaultValue: item.kind })}
                  </ThemedText>
                </View>
                {/* totals are null when unknown (loading or failed): better none than wrong */}
                {totals && <GroupTotal total={totals[item.id] ?? 0} />}
              </ThemedView>
            </Pressable>
          )}
        />

        <Button label={t('groups.create')} onPress={() => router.push('/new-group')} />

        <Pressable onPress={() => router.push('/join-group')}>
          <ThemedText type="link" style={[styles.centered, styles.joinLink]}>
            {t('groups.join')}
          </ThemedText>
        </Pressable>

        <Pressable onPress={() => supabase.auth.signOut()}>
          {/* quiet on purpose: small, grey and regular weight, as in the mock-up */}
          <ThemedText type="small" themeColor="textSecondary" style={[styles.centered, styles.signOut]}>
            {t('auth.signOut')}
          </ThemedText>
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
  header: { gap: Spacing.one },
  centered: { textAlign: 'center' },
  joinLink: { fontSize: 15 },
  signOut: { fontSize: 13 },
  cardTitle: { fontSize: 16, lineHeight: 22 },
  cardSub: { fontSize: 13, lineHeight: 18 },
  list: { gap: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    borderRadius: Radius.card,
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
  },
  cardText: { flex: 1, gap: Spacing.one },
  total: { fontFamily: FontFamily.display, fontSize: 24, lineHeight: 32 },
});
