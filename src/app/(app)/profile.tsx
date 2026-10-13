import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { DESCRIPTION_MAX, NAME_MAX, validateProfile } from '@/lib/profile';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

// What the database has, to know whether the form has changed
type Saved = { name: string; description: string };

export default function ProfileScreen() {
  const theme = useTheme();
  const { session } = useSession();
  const myId = session?.user.id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saved, setSaved] = useState<Saved | null>(null); // null = not loaded yet
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(() => {
    if (!myId) return;
    let ignore = false;
    supabase
      .from('profiles')
      .select('display_name, description')
      .eq('id', myId)
      .single()
      .then(
        ({ data, error }) => {
          if (ignore) return;
          if (error || !data) {
            setMessage({ text: t('profile.loadError'), ok: false });
            return;
          }
          const loaded = { name: data.display_name, description: data.description ?? '' };
          setSaved(loaded);
          setName(loaded.name);
          setDescription(loaded.description);
        },
        () => {
          if (!ignore) setMessage({ text: t('profile.loadError'), ok: false });
        },
      );
    return () => {
      ignore = true;
    };
  }, [myId]);

  useEffect(() => load(), [load]);

  // a "Guardado" or an error is about the last thing you did: don't keep it when you come back
  useFocusEffect(
    useCallback(
      () => () => {
        setMessage(null);
      },
      [],
    ),
  );

  const checked = validateProfile({ name, description });
  // compared after trimming on both sides, so stray spaces never count as a change
  const changed =
    saved !== null &&
    (checked.name !== saved.name.trim() || (checked.description ?? '') !== saved.description.trim());

  async function save() {
    if (!myId || !checked.valid) return;
    setSaving(true);
    setMessage(null);

    try {
      // .select() so we can tell if the database really changed the row (row-level security
      // answers "0 rows" instead of an error when it refuses)
      const { data, error } = await supabase
        .from('profiles')
        .update({ display_name: checked.name, description: checked.description })
        .eq('id', myId)
        .select('id');

      if (error || !data?.length) {
        setMessage({ text: t('profile.saveFailed'), ok: false });
      } else {
        // Only remember what was saved. The inputs are left alone: if you kept typing while the
        // request was in flight, that text is still there (and counts as a new change).
        setSaved({ name: checked.name, description: checked.description ?? '' });
        setMessage({ text: t('profile.saved'), ok: true });
      }
    } catch {
      setMessage({ text: t('profile.saveFailed'), ok: false });
    }
    setSaving(false);
  }

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.form}
          // iOS: scroll the content above the keyboard by itself
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle">{t('profile.title')}</ThemedText>

          <View style={styles.field}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t('profile.nameLabel')}
            </ThemedText>
            <TextInput
              style={inputStyle}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setMessage(null);
              }}
              maxLength={NAME_MAX}
              editable={saved !== null}
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t('profile.descriptionLabel')}
            </ThemedText>
            <TextInput
              style={[inputStyle, styles.multiline]}
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                setMessage(null);
              }}
              placeholder={t('profile.descriptionPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              maxLength={DESCRIPTION_MAX}
              editable={saved !== null}
              multiline
            />
            <ThemedText type="small" themeColor="textSecondary" style={styles.counter}>
              {description.length}/{DESCRIPTION_MAX}
            </ThemedText>
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t('auth.email')}
            </ThemedText>
            <ThemedText themeColor="textSecondary">{session?.user.email}</ThemedText>
          </View>

          {message && (
            <ThemedText themeColor={message.ok ? 'positive' : 'negative'}>{message.text}</ThemedText>
          )}

          {/* the profile could not be loaded: without it nothing can be edited, so offer a retry */}
          {saved === null && message && (
            <Button
              label={t('common.retry')}
              onPress={() => {
                setMessage(null); // in the handler, not in the effect that loads
                load();
              }}
            />
          )}

          {saved !== null && (
            <Button
              label={t('profile.save')}
              onPress={save}
              loading={saving}
              disabled={!changed || !checked.valid}
            />
          )}

          <Pressable onPress={() => supabase.auth.signOut()}>
            {/* quiet on purpose: small, grey and regular weight, as in the mock-up */}
            <ThemedText type="small" themeColor="textSecondary" style={styles.signOut}>
              {t('auth.signOut')}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  form: { gap: Spacing.three, padding: Spacing.four },
  field: { gap: Spacing.one },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontFamily: FontFamily.body,
    fontSize: 16,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  counter: { textAlign: 'right', fontSize: 12 },
  signOut: { fontSize: 13, textAlign: 'center' },
});
