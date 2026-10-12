import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BalanceSummary, type Debt, type MemberPoints } from '@/components/balance-summary';
import { CategoryIcon } from '@/components/category-icon';
import { IconBadge } from '@/components/icon-badge';
import { ShareGroupButton } from '@/components/share-group-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { locale, t } from '@/i18n';
import { formatPoints } from '@/lib/format';
import { isCategoryId } from '@/lib/categories';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

type Entry = {
  id: string;
  author_id: string;
  created_by: string;
  label: string;
  points: number;
  category: string;
  created_at: string;
};

// The floating button and the list padding derive from the same numbers
const FAB_SIZE = 64;
const FAB_OFFSET = Spacing.four;

type MemberRow = { user_id: string; profiles: { display_name: string } | null };

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const theme = useTheme();
  const myId = session?.user.id;

  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [names, setNames] = useState<Record<string, string>>({});
  const [entries, setEntries] = useState<Entry[]>([]);
  const [points, setPoints] = useState<MemberPoints[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // guards against a double tap pushing the modal twice
  const opening = useRef(false);
  // cancels the previous load when a new one starts (so an old answer can't overwrite a new one)
  const cancelLoad = useRef<(() => void) | null>(null);
  // every row's swipe controls by entry id, so opening one can close the others
  const rowRefs = useRef(new Map<string, SwipeableMethods>());

  // Returns a cleanup function that makes a late answer be ignored
  // stable between renders, so the header doesn't re-mount the button on every update
  const renderShare = useCallback(
    () => <ShareGroupButton name={groupName} code={inviteCode} />,
    [groupName, inviteCode],
  );

  const load = useCallback(() => {
    cancelLoad.current?.();
    let ignore = false;

    // Independent queries, run in parallel. The two views are computed by the
    // database from the entries. They are separate requests, so if someone logs
    // something between them the screen can be briefly inconsistent until the next reload.
    Promise.all([
      supabase.from('groups').select('name, invite_code').eq('id', id).single(),
      supabase.from('group_members').select('user_id, profiles(display_name)').eq('group_id', id),
      supabase
        .from('entries')
        .select('id, author_id, created_by, label, points, category, created_at')
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
          setInviteCode(group.data.invite_code);
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

    const cleanup = () => {
      ignore = true;
    };
    cancelLoad.current = cleanup;
    return cleanup;
  }, [id]);

  // Reload every time the screen gains focus (e.g. after adding an entry)
  useFocusEffect(load);
  useFocusEffect(
    useCallback(() => {
      opening.current = false;
    }, []),
  );

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
      <Stack.Screen
        options={{
          title: groupName,
          // only once the code has loaded
          headerRight: inviteCode ? renderShare : undefined,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {error && <ThemedText themeColor="textSecondary">{error}</ThemedText>}

        <SectionList
          sections={sections}
          keyExtractor={(entry) => entry.id}
          contentContainerStyle={[styles.list, styles.listWithFab]}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            // Never show a scoreboard we aren't sure about: not while loading, and not
            // after a failed load (it would be stale, or empty and say "all even")
            loading || error ? null : (
              <BalanceSummary myId={myId} names={names} points={points} debts={debts} />
            )
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
            // an unknown category (e.g. written straight to the API) shows as "other"
            const category = isCategoryId(item.category) ? item.category : 'other';
            const mine = item.author_id === myId;
            const doneBy = mine
              ? t('entries.doneByYou')
              : t('entries.doneBy', { name: names[item.author_id] ?? '?' });
            const day = new Date(item.created_at).toLocaleDateString(locale, {
              day: 'numeric',
              month: 'short',
            });

            // only whoever logged an entry may void it (the database enforces it too)
            const canVoid = item.created_by === myId;
            const pointsLabel = t(mine ? 'entries.pointsGained' : 'entries.pointsOwed', {
              points: formatPoints(item.points),
            });

            const row = (
              <ThemedView
                type="backgroundElement"
                style={styles.row}
                // One focus stop per entry, read as a whole
                accessible
                accessibilityLabel={`${item.label}. ${doneBy}. ${day}. ${pointsLabel}`}
                // swipe gestures are out of reach for screen readers: offer an action instead
                accessibilityActions={
                  canVoid ? [{ name: 'void', label: t('entries.voidAction') }] : undefined
                }
                onAccessibilityAction={(event) => {
                  if (event.nativeEvent.actionName === 'void') confirmVoid(item);
                }}>
                <IconBadge>
                  <CategoryIcon category={category} />
                </IconBadge>
                <View style={styles.rowText}>
                  <ThemedText type="smallBold">{item.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {doneBy} · {day}
                  </ThemedText>
                </View>
                {/* From my point of view: +N if I did it, -N if someone else did (I owe it) */}
                <ThemedText
                  type="smallBold"
                  themeColor={mine ? 'positive' : 'negative'}
                  style={styles.points}
                  accessibilityLabel={pointsLabel}>
                  {`${mine ? '+' : '-'}${item.points}`}
                </ThemedText>
              </ThemedView>
            );

            if (!canVoid) return row;

            // Same red action whichever way you swipe. It asks for confirmation:
            // voiding changes everyone's balance.
            const voidAction = (
              _progress: unknown,
              _translation: unknown,
              swipe: SwipeableMethods,
            ) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('entries.voidAction')}
                style={[styles.voidAction, { backgroundColor: theme.negative }]}
                onPress={() => {
                  swipe.close();
                  confirmVoid(item);
                }}>
                <FontAwesomeIcon icon={faTrash} size={18} color={theme.background} />
                <ThemedText type="small" style={{ color: theme.background }}>
                  {t('entries.voidAction')}
                </ThemedText>
              </Pressable>
            );

            return (
              <ReanimatedSwipeable
                renderLeftActions={voidAction}
                renderRightActions={voidAction}
                overshootLeft={false}
                overshootRight={false}
                ref={(swipe) => {
                  if (swipe) rowRefs.current.set(item.id, swipe);
                  else rowRefs.current.delete(item.id);
                }}
                onSwipeableOpen={() => {
                  rowRefs.current.forEach((other, id) => {
                    if (id !== item.id) other.close();
                  });
                }}>
                {row}
              </ReanimatedSwipeable>
            );
          }}
        />

        {/* box-none: the empty area of this wrapper must not block touches on the list */}
        <View style={styles.fabWrapper} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('entries.add')}
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: theme.accent, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => {
              if (opening.current) return;
              opening.current = true;
              router.push({ pathname: '/new-entry', params: { groupId: id } });
            }}>
            <FontAwesomeIcon icon={faPlus} size={24} color={theme.onAccent} />
          </Pressable>
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
  voidAction: {
    width: 88,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  rowText: { flex: 1 },
  points: { fontSize: 20, lineHeight: 28 },
  // room so the floating button never hides the last entry
  listWithFab: { paddingBottom: FAB_SIZE + FAB_OFFSET + Spacing.four },
  fabWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: FAB_OFFSET,
    alignItems: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
