import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GroupCard } from '@/components/group-card';
import { GroupTotal } from '@/components/group-total';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useGroupsOverview } from '@/hooks/use-groups-overview';
import { t } from '@/i18n';

export default function GroupsScreen() {
  const { groups, totals, error, loading } = useGroupsOverview();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="subtitle">{t('groups.yourGroups')}</ThemedText>

        {error && <ThemedText themeColor="textSecondary">{error}</ThemedText>}

        <FlatList
          data={groups}
          keyExtractor={(group) => group.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            // don't claim "no groups" before the first answer arrives
            loading ? null : <ThemedText themeColor="textSecondary">{t('groups.empty')}</ThemedText>
          }
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              onPress={() => router.push({ pathname: '/group/[id]', params: { id: item.id } })}
              // totals are null when unknown (loading or failed): better none than wrong
              right={totals ? <GroupTotal total={totals[item.id] ?? 0} /> : null}
            />
          )}
        />

        <Button label={t('groups.create')} onPress={() => router.push('/new-group')} />

        <Pressable onPress={() => router.push('/join-group')}>
          <ThemedText type="link" style={styles.joinLink}>
            {t('groups.join')}
          </ThemedText>
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
  joinLink: { fontSize: 15, textAlign: 'center' },
  list: { gap: Spacing.two },
});
