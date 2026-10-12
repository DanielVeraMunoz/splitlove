import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GroupKindIcon } from '@/components/group-kind-icon';
import { GroupTotal } from '@/components/group-total';
import { IconBadge } from '@/components/icon-badge';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
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
  centered: { textAlign: 'center' },
  joinLink: { fontSize: 15 },
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
});
