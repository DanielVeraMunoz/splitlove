import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { t } from '@/i18n';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export type ActivityItem = {
  id: string;
  groupId: string;
  groupName: string;
  label: string;
  category: string;
  points: number;
  createdAt: string;
  mine: boolean; // did I do it? (it decides +N or -N from my point of view)
  authorName: string; // '' when it is me (the screen says "Tú" instead)
};

type EntryRow = {
  id: string;
  group_id: string;
  author_id: string;
  label: string;
  category: string;
  points: number;
  created_at: string;
  groups: { name: string } | null;
};

const LIMIT = 50;

// The latest live entries across all my groups. Row-level security already limits them to
// groups I belong to. Reloaded on focus; `reload` is for pull to refresh and the retry button.
export function useActivity() {
  const { session } = useSession();
  const myId = session?.user.id;
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // cancels the previous load when a new one starts, so an old answer can't overwrite a new one
  const cancelLoad = useRef<(() => void) | null>(null);

  const load = useCallback(() => {
    // without a session we can't tell which entries are mine: better nothing than wrong signs
    if (!myId) return;

    cancelLoad.current?.();
    let ignore = false;

    supabase
      .from('entries')
      .select('id, group_id, author_id, label, category, points, created_at, groups(name)')
      .is('voided_at', null)
      .order('created_at', { ascending: false })
      .limit(LIMIT)
      .then(
        async ({ data, error: queryError }) => {
          if (ignore) return;
          if (queryError || !data) {
            setError(t('activity.loadError'));
            setItems([]); // never leave the old list under an error: it would look current
            setLoading(false);
            return;
          }

          const rows = data as unknown as EntryRow[];

          // Names of the authors. supabase-js returns failures in `error` (it does not throw),
          // and a rejection means no network. Either way the feed still works, without names.
          const authorIds = [...new Set(rows.map((row) => row.author_id))];
          const names = new Map<string, string>();
          if (authorIds.length > 0) {
            try {
              const { data: profiles, error: namesError } = await supabase
                .from('profiles')
                .select('id, display_name')
                .in('id', authorIds);
              if (!namesError) {
                for (const profile of profiles ?? []) names.set(profile.id, profile.display_name);
              }
            } catch {
              // no network for this one: keep going without names
            }
            if (ignore) return;
          }

          setItems(
            rows.map((row) => ({
              id: row.id,
              groupId: row.group_id,
              groupName: row.groups?.name ?? '',
              label: row.label,
              category: row.category,
              points: row.points,
              createdAt: row.created_at,
              mine: row.author_id === myId,
              authorName: row.author_id === myId ? '' : (names.get(row.author_id) ?? '?'),
            })),
          );
          setError(null);
          setLoading(false);
        },
        // the query builder only has .then(ok, fail): no .catch/.finally
        () => {
          if (ignore) return;
          setError(t('activity.loadError'));
          setItems([]);
          setLoading(false);
        },
      );

    const cleanup = () => {
      ignore = true;
    };
    cancelLoad.current = cleanup;
    return cleanup;
  }, [myId]);

  useFocusEffect(load);

  const reload = useCallback(() => {
    setError(null);
    setLoading(true);
    load();
  }, [load]);

  return { items, error, loading, reload };
}
