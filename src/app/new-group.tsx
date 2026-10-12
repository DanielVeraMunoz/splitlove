import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { GROUP_KINDS, type GroupKind } from '@/lib/groups';
import { supabase } from '@/lib/supabase';

export default function NewGroupScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<GroupKind | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!kind) return;
    setLoading(true);
    setError(null);

    try {
      // One server-side call creates the group AND adds you as a member (atomic)
      const { error: rpcError } = await supabase.rpc('create_group', {
        p_name: name.trim(),
        p_kind: kind,
      });
      if (!rpcError) {
        router.back();
        return; // the screen is closing: don't touch its state any more
      }
      setError(rpcError.message);
    } catch {
      setError(t('common.networkError'));
    }
    setLoading(false);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.form}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder={t('groups.namePlaceholder')}
            placeholderTextColor={theme.textSecondary}
            maxLength={50}
            value={name}
            onChangeText={setName}
          />

          <ThemedText type="smallBold">{t('groups.whatAreYou')}</ThemedText>
          <View style={styles.chips}>
            {GROUP_KINDS.map((option) => {
              const selected = option === kind;
              return (
                <Pressable
                  key={option}
                  onPress={() => setKind(option)}
                  style={[
                    styles.chip,
                    { backgroundColor: selected ? theme.text : theme.backgroundElement },
                  ]}>
                  <ThemedText style={{ color: selected ? theme.background : theme.text }}>
                    {t(`groups.kinds.${option}`)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {error && <ThemedText themeColor="textSecondary">{error}</ThemedText>}

          <Pressable
            style={[styles.button, { backgroundColor: theme.text }]}
            onPress={create}
            disabled={loading || !name.trim() || !kind}>
            {loading ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <ThemedText style={{ color: theme.background }}>{t('groups.create')}</ThemedText>
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
