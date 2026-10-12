import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GroupKindIcon } from '@/components/group-kind-icon';
import { IconBadge } from '@/components/icon-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { t } from '@/i18n';
import type { Group } from '@/lib/groups';
import { supabase } from '@/lib/supabase';

// The (+) of the bottom bar, from outside a group: which group is this action for?
// One group: no question, straight to the form. None: offer to create one.
export default function PickGroupScreen() {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    supabase
      .from('groups')
      .select('id, name, kind')
      .order('created_at', { ascending: false })
      .then(
        ({ data, error: queryError }) => {
          if (ignore) return;
          if (queryError) setError(t('groups.loadError'));
          else setGroups(data as Group[]);
        },
        () => {
          if (!ignore) setError(t('groups.loadError'));
        },
      );
    return () => {
      ignore = true;
    };
  }, []);

  function pick(groupId: string) {
    // replace, so closing the form doesn't land back on this list
    router.replace({ pathname: '/new-entry', params: { groupId } });
  }

  // with a single group there is nothing to choose
  useEffect(() => {
    if (groups?.length === 1) router.replace({ pathname: '/new-entry', params: { groupId: groups[0].id } });
  }, [groups]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {error && <ThemedText themeColor="textSecondary">{error}</ThemedText>}

        {groups?.length === 0 && (
          <View style={styles.empty}>
            <ThemedText themeColor="textSecondary">{t('groups.empty')}</ThemedText>
            <Button label={t('groups.create')} onPress={() => router.replace('/new-group')} />
          </View>
        )}

        {groups && groups.length > 1 && (
          <FlatList
            data={groups}
            keyExtractor={(group) => group.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable accessibilityRole="button" onPress={() => pick(item.id)}>
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
                </ThemedView>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  empty: { gap: Spacing.three },
  list: { gap: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: Radius.card,
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
  },
  cardText: { flex: 1, gap: Spacing.one },
  cardTitle: { fontSize: 16, lineHeight: 22 },
  cardSub: { fontSize: 13, lineHeight: 18 },
});
