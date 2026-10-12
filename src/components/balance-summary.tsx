import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { t } from '@/i18n';
import { formatPoints } from '@/lib/format';

export type MemberPoints = { user_id: string; points_done: number };
export type Debt = { creditor_id: string; debtor_id: string; points: number };

type Props = {
  myId: string | undefined;
  names: Record<string, string>;
  points: MemberPoints[];
  debts: Debt[];
};

export function BalanceSummary({ myId, names, points, debts }: Props) {
  const nameOf = (id: string) => (id === myId ? t('entries.you') : (names[id] ?? '?'));

  // Debts that involve me come first
  const sortedDebts = [...debts].sort(
    (a, b) => Number(involvesMe(b, myId)) - Number(involvesMe(a, myId)),
  );

  function describe(debt: Debt) {
    const amount = formatPoints(debt.points);
    if (debt.debtor_id === myId) {
      return t('balance.youOwe', { points: amount, name: nameOf(debt.creditor_id) });
    }
    if (debt.creditor_id === myId) {
      return t('balance.owesYou', { points: amount, name: nameOf(debt.debtor_id) });
    }
    return t('balance.owes', {
      debtor: nameOf(debt.debtor_id),
      points: amount,
      creditor: nameOf(debt.creditor_id),
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.scores}>
        {[...points]
          .sort((a, b) => b.points_done - a.points_done)
          .map((member) => (
            <ThemedView key={member.user_id} type="backgroundElement" style={styles.score}>
              <ThemedText type="title" style={styles.number}>
                {member.points_done}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {nameOf(member.user_id)}
              </ThemedText>
            </ThemedView>
          ))}
      </View>

      <View style={styles.debts}>
        {sortedDebts.length === 0 ? (
          <ThemedText themeColor="textSecondary">{t('balance.even')}</ThemedText>
        ) : (
          sortedDebts.map((debt) => (
            <ThemedText key={`${debt.debtor_id}-${debt.creditor_id}`} type="smallBold">
              {describe(debt)}
            </ThemedText>
          ))
        )}
      </View>
    </View>
  );
}

function involvesMe(debt: Debt, myId: string | undefined) {
  return debt.debtor_id === myId || debt.creditor_id === myId;
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  scores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  score: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    minWidth: 88,
  },
  number: {
    fontSize: 32,
    lineHeight: 40,
  },
  debts: { gap: Spacing.one },
});
