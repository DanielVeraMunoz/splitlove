import { router } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { MODAL_DISMISS_MS, useCelebration } from '@/components/celebration';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { GROUP_KINDS, type GroupKind } from '@/lib/groups';
import { supabase } from '@/lib/supabase';

export default function NewGroupScreen() {
  const theme = useTheme();
  const { celebrate } = useCelebration();
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
        // wait until the modal has left, or it would cover the first arrow
        celebrate({ delayMs: MODAL_DISMISS_MS });
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
        <ScrollView
          contentContainerStyle={styles.form}
          // iOS: scroll content above the keyboard by itself (no header height needed)
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled">
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
                    { backgroundColor: selected ? theme.accent : theme.backgroundElement },
                  ]}>
                  <ThemedText style={{ color: selected ? theme.onAccent : theme.text }}>
                    {t(`groups.kinds.${option}`)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {error && <ThemedText themeColor="textSecondary">{error}</ThemedText>}

          <Button
            label={t('groups.create')}
            onPress={create}
            loading={loading}
            disabled={!name.trim() || !kind}
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
});
