import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GroupCard } from '@/components/group-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useGroupsOverview } from '@/hooks/use-groups-overview';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';

// The (+) of the bottom bar: which group is this action for?
// One group: no question, straight to the form. None: offer to create one.
export default function PickGroupScreen() {
  const theme = useTheme();
  const { groups, error, loading, reload } = useGroupsOverview();

  // with a single group there is nothing to choose
  const onlyGroup = !loading && !error && groups.length === 1 ? groups[0] : null;
  useEffect(() => {
    if (onlyGroup) router.replace({ pathname: '/new-entry', params: { groupId: onlyGroup.id } });
  }, [onlyGroup]);

  const showList = !loading && !error && groups.length > 1;
  const showEmpty = !loading && !error && groups.length === 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* loading, or about to jump to the form: never an empty sheet */}
        {(loading || onlyGroup) && <ActivityIndicator color={theme.accent} />}

        {error && (
          <View style={styles.message}>
            <ThemedText themeColor="textSecondary">{error}</ThemedText>
            <Button label={t('common.retry')} onPress={reload} />
          </View>
        )}

        {showEmpty && (
          <View style={styles.message}>
            <ThemedText themeColor="textSecondary">{t('groups.empty')}</ThemedText>
            <Button label={t('groups.create')} onPress={() => router.replace('/new-group')} />
          </View>
        )}

        {showList && (
          <FlatList
            data={groups}
            keyExtractor={(group) => group.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <GroupCard
                group={item}
                // replace, so closing the form doesn't land back on this list
                onPress={() => router.replace({ pathname: '/new-entry', params: { groupId: item.id } })}
              />
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
  message: { gap: Spacing.three },
  list: { gap: Spacing.two },
});
