import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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
      const { data, error: rpcError } = await supabase.rpc('join_group', { p_code: code.trim() });

      if (rpcError) {
        setError(
          rpcError.message.includes('too_many_attempts')
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
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.form}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ThemedText type="subtitle">{t('groups.joinTitle')}</ThemedText>

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

          <Pressable
            style={[styles.button, { backgroundColor: theme.text }]}
            onPress={join}
            disabled={loading || !code.trim()}>
            {loading ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <ThemedText style={{ color: theme.background }}>{t('groups.joinAction')}</ThemedText>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  form: {
    flex: 1,
    gap: Spacing.three,
    padding: Spacing.four,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
