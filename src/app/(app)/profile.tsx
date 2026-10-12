import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { t } from '@/i18n';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

// Profile (basic for now): who you are, and sign out. Description, color and settings come next.
export default function ProfileScreen() {
  const { session } = useSession();
  const myId = session?.user.id;
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!myId) return;
    let ignore = false;
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', myId)
      .single()
      .then(
        ({ data }) => {
          if (!ignore && data) setName(data.display_name);
        },
        () => {
          // the name is decoration here: without it we just show the email
        },
      );
    return () => {
      ignore = true;
    };
  }, [myId]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="subtitle">{t('profile.title')}</ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          {name && <ThemedText type="smallBold" style={styles.name}>{name}</ThemedText>}
          <ThemedText type="small" themeColor="textSecondary">
            {session?.user.email}
          </ThemedText>
        </ThemedView>

        <Pressable onPress={() => supabase.auth.signOut()}>
          {/* quiet on purpose: small, grey and regular weight, as in the mock-up */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.signOut}>
            {t('auth.signOut')}
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, gap: Spacing.three, padding: Spacing.four },
  card: { borderRadius: Radius.card, padding: Spacing.three, gap: Spacing.one },
  name: { fontSize: 18, lineHeight: 24 },
  signOut: { fontSize: 13, textAlign: 'center' },
});
