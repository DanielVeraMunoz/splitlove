import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { t } from '@/i18n';
import { totalsByGroup, type DebtRow } from '@/lib/balance';
import type { Group } from '@/lib/groups';
import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

// My groups and my net total in each. Reloaded every time the screen gains focus, so a group
// just created (or an entry just logged) shows up.
export function useGroupsOverview() {
  const { session } = useSession();
  const myId = session?.user.id;
  const [groups, setGroups] = useState<Group[]>([]);
  // my net total per group (a group missing here means 0). null = not known:
  // not loaded yet, or the debts query failed. Then no number is shown at all.
  const [totals, setTotals] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      // If we leave the screen before the answer arrives, ignore it
      let ignore = false;

      // Both queries only return what RLS lets me see: my groups and their debts
      Promise.all([
        supabase.from('groups').select('id, name, kind').order('created_at', { ascending: false }),
        // only the rows that involve me: the view lists every pair of every group
        myId
          ? supabase
              .from('pair_debts')
              .select('group_id, creditor_id, debtor_id, points')
              .or(`creditor_id.eq.${myId},debtor_id.eq.${myId}`)
          : Promise.resolve({ data: null, error: new Error('no session') }),
      ]).then(
        ([groupRows, debtRows]) => {
          if (ignore) return;
          if (groupRows.error) {
            setError(t('groups.loadError'));
            setTotals(null);
          } else {
            setError(null);
            setGroups(groupRows.data as Group[]);
            // The totals are an extra: if only they fail, the list still updates
            // and just the numbers disappear.
            setTotals(
              debtRows.error || !myId ? null : totalsByGroup(debtRows.data as DebtRow[], myId),
            );
          }
          setLoading(false);
        },
        // the query builder only has .then(ok, fail): no .catch/.finally
        () => {
          if (ignore) return;
          setError(t('groups.loadError'));
          setLoading(false);
        },
      );

      return () => {
        ignore = true;
      };
    }, [myId]),
  );

  return { groups, totals, error, loading };
}
