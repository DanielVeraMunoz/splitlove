import { faShareNodes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GroupKindIcon } from '@/components/group-kind-icon';
import { IconBadge } from '@/components/icon-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import type { Group } from '@/lib/groups';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const theme = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Reload every time the screen gains focus, so a group just created shows up
  useFocusEffect(
    useCallback(() => {
      // If we leave the screen before the answer arrives, ignore it
      let ignore = false;

      supabase
        .from('groups')
        .select('id, name, kind, invite_code')
        .order('created_at', { ascending: false })
        .then(
          ({ data, error: queryError }) => {
            if (ignore) return;
            if (queryError) {
              setError(queryError.message);
            } else {
              setError(null);
              setGroups(data as Group[]);
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
    }, []),
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('groups.shareCode')}
                  hitSlop={12}
                  onPress={() =>
                    Share.share({
                      message: t('groups.shareMessage', { name: item.name, code: item.invite_code }),
                    }).catch(() => {
                      // the share sheet failed to open: nothing useful to tell the user
                    })
                  }>
                  <FontAwesomeIcon icon={faShareNodes} size={18} color={theme.text} />
                </Pressable>
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
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
