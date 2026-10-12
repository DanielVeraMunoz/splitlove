import { router } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { supabase } from '@/lib/supabase';

export default function JoinGroupScreen() {
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('join_group', { p_code: code.trim().toLowerCase() });

      if (rpcError) {
        setError(
          // JG001 is the custom error code raised by join_group when rate limited
          rpcError.code === 'JG001' || rpcError.message.includes('too_many_attempts')
            ? t('groups.tooManyAttempts')
            : t('common.networkError'),
        );
      } else if (!data) {
        // the server answers null when the code doesn't exist
        setError(t('groups.invalidCode'));
      } else {
        router.back();
        return; // the screen is closing: don't touch its state any more
      }
    } catch {
      setError(t('common.networkError'));
    }
    setLoading(false);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.form}
          // iOS: scroll content above the keyboard by itself (no header height needed)
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled">
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder={t('groups.codePlaceholder')}
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={32}
            value={code}
            onChangeText={setCode}
          />

          {error && <ThemedText themeColor="textSecondary">{error}</ThemedText>}

          <Button
            label={t('groups.joinAction')}
            onPress={join}
            loading={loading}
            disabled={!code.trim()}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  form: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontFamily: FontFamily.body,
    fontSize: 16,
  },
});
