import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BalanceSummary, type Debt, type MemberPoints } from '@/components/balance-summary';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { locale, t } from '@/i18n';
import { CATEGORIES, isCategoryId } from '@/lib/categories';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

type Entry = {
  id: string;
  author_id: string;
  created_by: string;
  label: string;
  category: string;
  created_at: string;
};

type MemberRow = { user_id: string; profiles: { display_name: string } | null };

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const myId = session?.user.id;

  const [groupName, setGroupName] = useState('');
  const [names, setNames] = useState<Record<string, string>>({});
  const [entries, setEntries] = useState<Entry[]>([]);
  const [points, setPoints] = useState<MemberPoints[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Returns a cleanup function that makes a late answer be ignored
  const load = useCallback(() => {
    let ignore = false;

    // Independent queries, run in parallel. The two views are computed by the
    // database from the entries, so they can never disagree with the list.
    Promise.all([
      supabase.from('groups').select('name').eq('id', id).single(),
      supabase.from('group_members').select('user_id, profiles(display_name)').eq('group_id', id),
      supabase
        .from('entries')
        .select('id, author_id, created_by, label, category, created_at')
        .eq('group_id', id)
        .is('voided_at', null)
        .order('created_at', { ascending: false }),
      supabase.from('member_points').select('user_id, points_done').eq('group_id', id),
      supabase.from('pair_debts').select('creditor_id, debtor_id, points').eq('group_id', id),
    ]).then(
      ([group, members, entryRows, pointRows, debtRows]) => {
        if (ignore) return;
        if (group.error || members.error || entryRows.error || pointRows.error || debtRows.error) {
          setError(t('entries.loadError'));
        } else {
          setError(null);
          setGroupName(group.data.name);
          setNames(
            Object.fromEntries(
              (members.data as unknown as MemberRow[]).map((row) => [
                row.user_id,
                row.profiles?.display_name ?? '?',
              ]),
            ),
          );
          setEntries(entryRows.data as Entry[]);
          setPoints(pointRows.data as MemberPoints[]);
          setDebts(debtRows.data as Debt[]);
        }
        setLoading(false);
      },
      () => {
        if (ignore) return;
        setError(t('entries.loadError'));
        setLoading(false);
      },
    );

    return () => {
      ignore = true;
    };
  }, [id]);

  // Reload every time the screen gains focus (e.g. after adding an entry)
  useFocusEffect(load);

  // Group by month, like Splitwise. Entries arrive newest first, so order is kept.
  const sections = useMemo(() => {
    const byMonth = new Map<string, Entry[]>();
    for (const entry of entries) {
      const title = new Date(entry.created_at).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      });
      const bucket = byMonth.get(title);
      if (bucket) bucket.push(entry);
      else byMonth.set(title, [entry]);
    }
    return [...byMonth].map(([title, data]) => ({ title, data }));
  }, [entries]);

  function confirmVoid(entry: Entry) {
    Alert.alert(t('entries.voidTitle'), t('entries.voidMessage'), [
      { text: t('entries.cancel'), style: 'cancel' },
      { text: t('entries.voidAction'), style: 'destructive', onPress: () => voidEntry(entry) },
    ]);
  }

  async function voidEntry(entry: Entry) {
    // Entries are never deleted: voiding keeps the history. .select() lets us
    // see whether the database actually changed a row (RLS silently skips ones
    // you don't own).
    try {
      const { data, error: updateError } = await supabase
        .from('entries')
        .update({ voided_at: new Date().toISOString() })
        .eq('id', entry.id)
        .select('id');

      if (updateError) Alert.alert(t('common.networkError'));
      else if (!data?.length) Alert.alert(t('entries.voidFailed')); // RLS skipped it: not yours
      else load();
    } catch {
      Alert.alert(t('common.networkError'));
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: groupName }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {error && <ThemedText themeColor="textSecondary">{error}</ThemedText>}

        <SectionList
          sections={sections}
          keyExtractor={(entry) => entry.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            loading ? null : <BalanceSummary myId={myId} names={names} points={points} debts={debts} />
          }
          ListEmptyComponent={
            loading ? null : (
              <ThemedText themeColor="textSecondary">{t('entries.empty')}</ThemedText>
            )
          }
          renderSectionHeader={({ section }) => (
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.month}>
              {section.title}
            </ThemedText>
          )}
          renderItem={({ item }) => {
            const emoji = CATEGORIES[isCategoryId(item.category) ? item.category : 'other'].emoji;
            const who = item.author_id === myId ? t('entries.you') : (names[item.author_id] ?? '?');
            const day = new Date(item.created_at).toLocaleDateString(locale, {
              day: 'numeric',
              month: 'short',
            });

            return (
              <Pressable
                // only whoever logged an entry may void it (enforced by the database too)
                onLongPress={item.created_by === myId ? () => confirmVoid(item) : undefined}>
                <ThemedView type="backgroundElement" style={styles.row}>
                  <ThemedText style={styles.emoji}>{emoji}</ThemedText>
                  <View style={styles.rowText}>
                    <ThemedText type="smallBold">{item.label}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('entries.doneBy', { name: who })} · {day}
                    </ThemedText>
                  </View>
                </ThemedView>
              </Pressable>
            );
          }}
        />

        <View style={styles.footer}>
          <Button
            label={t('entries.add')}
            onPress={() => router.push({ pathname: '/new-entry', params: { groupId: id } })}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  list: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  month: {
    marginTop: Spacing.three,
    textTransform: 'capitalize',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  emoji: { fontSize: 28, lineHeight: 36 },
  rowText: { flex: 1 },
  footer: { padding: Spacing.four },
});
