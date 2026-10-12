import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CategoryIcon } from '@/components/category-icon';
import { MODAL_DISMISS_MS, useCelebration } from '@/components/celebration';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import { CATEGORY_IDS, detectCategory, isCategoryId, type CategoryId } from '@/lib/categories';
import { formatPoints } from '@/lib/format';
import { POINT_OPTIONS, type Points } from '@/lib/points';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

type Member = { user_id: string; name: string };

export default function NewEntryScreen() {
  const theme = useTheme();
  // With `entryId` this screen edits that entry (the other params prefill the form)
  const params = useLocalSearchParams<{
    groupId: string;
    entryId?: string;
    label?: string;
    category?: string;
    points?: string;
    authorId?: string;
  }>();
  const { groupId, entryId } = params;
  const editing = !!entryId;
  const { celebrate } = useCelebration();
  const { session } = useSession();
  const myId = session?.user.id;

  const [members, setMembers] = useState<Member[]>([]);
  const [label, setLabel] = useState(params.label ?? '');
  // undefined = nobody picked yet: it falls back to me (see `author`)
  const [authorId, setAuthorId] = useState<string | undefined>(params.authorId);
  // null = nobody chose: follow the detector while the user types. When editing, the entry's
  // own category is kept until the user picks another one.
  const [manualCategory, setManualCategory] = useState<CategoryId | null>(() =>
    // keep the saved category only if it was a manual choice (it differs from what the text
    // would give); otherwise keep following the detector as the text is edited
    params.category && isCategoryId(params.category) && params.category !== detectCategory(params.label ?? '')
      ? params.category
      : null,
  );
  const [points, setPoints] = useState<Points>(
    POINT_OPTIONS.find((option) => option === Number(params.points)) ?? 1,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = manualCategory ?? detectCategory(label);
  const author = authorId ?? myId;

  useEffect(() => {
    let ignore = false;
    supabase
      .from('group_members')
      .select('user_id, profiles(display_name)')
      .eq('group_id', groupId)
      .then(
        ({ data, error: queryError }) => {
          if (ignore) return;
          if (queryError || !data) {
            setError(t('common.networkError'));
            return;
          }
          setMembers(
            (data as unknown as { user_id: string; profiles: { display_name: string } | null }[]).map(
              (row) => ({ user_id: row.user_id, name: row.profiles?.display_name ?? '?' }),
            ),
          );
        },
        () => {
          if (!ignore) setError(t('common.networkError'));
        },
      );
    return () => {
      ignore = true;
    };
  }, [groupId]);

  async function save() {
    if (!myId || !author) return;
    // Nothing changed: no point in voiding an entry to create an identical one
    if (
      editing &&
      label.trim() === (params.label ?? '').trim() &&
      category === params.category &&
      points === Number(params.points) &&
      author === params.authorId
    ) {
      router.back();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: saveError } = editing
        ? // an edit voids the old entry and creates a new one, atomically, on the server
          await supabase.rpc('edit_entry', {
            p_entry_id: entryId,
            p_label: label.trim(),
            p_category: category,
            p_points: points,
            p_author_id: author,
          })
        : await supabase.from('entries').insert({
            group_id: groupId,
            author_id: author, // who DID it
            created_by: myId, // who LOGGED it (RLS requires it to be you)
            label: label.trim(),
            category,
            points,
          });
      if (!saveError) {
        // The arrows reward logging something new, not fixing a typo.
        // Wait until the modal has left, or it would cover the first arrow.
        if (!editing) celebrate({ delayMs: MODAL_DISMISS_MS });
        router.back();
        return; // the screen is closing: don't touch its state any more
      }
      // EE001: not yours / already voided. 23503: the author has left the group.
      setError(
        saveError.code === 'EE001'
          ? t('entries.editFailed')
          : saveError.code === '23503'
            ? t('entries.authorLeft')
            : t('common.networkError'),
      );
    } catch {
      setError(t('common.networkError'));
    }
    setLoading(false);
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: editing ? t('entries.editTitle') : t('entries.newTitle') }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.form}
          // iOS: scroll content above the keyboard by itself (no header height needed)
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled">
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder={t('entries.labelPlaceholder')}
            placeholderTextColor={theme.textSecondary}
            maxLength={100}
            value={label}
            onChangeText={setLabel}
          />

          <ThemedText type="smallBold">{t('entries.category')}</ThemedText>
          <View style={styles.chips}>
            {CATEGORY_IDS.map((id) => (
              <Chip
                key={id}
                selected={id === category}
                label={t(`categories.${id}`)}
                category={id}
                onPress={() => setManualCategory(id)}
              />
            ))}
          </View>

          <ThemedText type="smallBold">{t('entries.points')}</ThemedText>
          <View style={styles.chips}>
            {POINT_OPTIONS.map((option) => (
              <Chip
                key={option}
                selected={option === points}
                label={String(option)}
                accessibilityLabel={formatPoints(option)}
                onPress={() => setPoints(option)}
              />
            ))}
          </View>

          <ThemedText type="smallBold">{t('entries.whoDid')}</ThemedText>
          <View style={styles.chips}>
            {members.map((member) => (
              <Chip
                key={member.user_id}
                selected={member.user_id === author}
                label={member.user_id === myId ? t('entries.you') : member.name}
                onPress={() => setAuthorId(member.user_id)}
              />
            ))}
          </View>

          {error && <ThemedText themeColor="textSecondary">{error}</ThemedText>}

          <Button
            label={editing ? t('entries.saveChanges') : t('entries.save')}
            onPress={save}
            loading={loading}
            disabled={!label.trim() || !author}
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Chip({
  label,
  selected,
  onPress,
  category,
  accessibilityLabel,
}: {
  label: string;
  accessibilityLabel?: string;
  selected: boolean;
  onPress: () => void;
  category?: CategoryId;
}) {
  const theme = useTheme();
  const color = selected ? theme.onAccent : theme.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      style={[styles.chip, { backgroundColor: selected ? theme.accent : theme.backgroundElement }]}>
      {category && <CategoryIcon category={category} size={14} color={color} />}
      <ThemedText style={{ color }}>{label}</ThemedText>
    </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
