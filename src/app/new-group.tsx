import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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
      if (rpcError) setError(rpcError.message);
      else router.back();
    } catch {
      setError('Something went wrong. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">New group</ThemedText>

        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          placeholder="Group name"
          placeholderTextColor={theme.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <ThemedText type="smallBold">What are you?</ThemedText>
        <View style={styles.chips}>
          {GROUP_KINDS.map((option) => {
            const selected = option.value === kind;
            return (
              <Pressable
                key={option.value}
                onPress={() => setKind(option.value)}
                style={[
                  styles.chip,
                  { backgroundColor: selected ? theme.text : theme.backgroundElement },
                ]}>
                <ThemedText style={{ color: selected ? theme.background : theme.text }}>
                  {option.label}
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
            <ThemedText style={{ color: theme.background }}>Create group</ThemedText>
          )}
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
