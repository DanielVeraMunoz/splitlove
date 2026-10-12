import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { GROUP_KINDS, type Group } from '@/lib/groups';
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
        .select('id, name, kind')
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
            setError('Could not load your groups. Check your connection.');
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
        <ThemedText type="subtitle">Your groups</ThemedText>

        {error && <ThemedText themeColor="textSecondary">{error}</ThemedText>}

        <FlatList
          data={groups}
          keyExtractor={(group) => group.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            // don't claim "no groups" before the first answer arrives
            loading ? null : (
              <ThemedText themeColor="textSecondary">
                No groups yet. Create one to start counting.
              </ThemedText>
            )
          }
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{item.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {GROUP_KINDS.find((kind) => kind.value === item.kind)?.label ?? item.kind}
              </ThemedText>
            </ThemedView>
          )}
        />

        <Pressable
          style={[styles.button, { backgroundColor: theme.text }]}
          onPress={() => router.push('/new-group')}>
          <ThemedText style={{ color: theme.background }}>Create group</ThemedText>
        </Pressable>

        <Pressable onPress={() => supabase.auth.signOut()}>
          <ThemedText type="link">Sign out</ThemedText>
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
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
