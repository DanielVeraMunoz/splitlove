import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { GroupTotal } from '@/components/group-total';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Wordmark } from '@/components/wordmark';
import { Radius, Spacing } from '@/constants/theme';
import { useGroupsOverview } from '@/hooks/use-groups-overview';
import { t } from '@/i18n';

// Inicio. For now: your net total across all your groups. Charts and medals come later.
export default function HomeScreen() {
  const { groups, totals, error, loading } = useGroupsOverview();

  // null = not known (loading or failed): show nothing rather than a wrong number
  const total = totals ? Object.values(totals).reduce((sum, value) => sum + value, 0) : null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Wordmark size={22} />

        {error && <ThemedText themeColor="textSecondary">{error}</ThemedText>}

        {!loading && !error && groups.length === 0 && (
          <ThemedView type="backgroundElement" style={styles.hero}>
            <ThemedText themeColor="textSecondary" style={styles.centered}>
              {t('groups.empty')}
            </ThemedText>
            <Button label={t('groups.create')} onPress={() => router.push('/new-group')} />
          </ThemedView>
        )}

        {total !== null && groups.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.hero}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.heroLabel}>
              {t('home.totalTitle')}
            </ThemedText>
            <View>
              <GroupTotal total={total} size={56} />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {t('home.totalHint')}
            </ThemedText>
          </ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, gap: Spacing.four, padding: Spacing.four },
  hero: {
    borderRadius: Radius.card,
    padding: Spacing.four,
    gap: Spacing.one,
    alignItems: 'center',
  },
  centered: { textAlign: 'center' },
  heroLabel: { fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
});
