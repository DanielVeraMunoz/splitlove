import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
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

  // Mine first, then the biggest, then by id so the order never jumps between reloads
  const sortedDebts = [...debts].sort(
    (a, b) =>
      Number(involvesMe(b, myId)) - Number(involvesMe(a, myId)) ||
      b.points - a.points ||
      `${a.debtor_id}${a.creditor_id}`.localeCompare(`${b.debtor_id}${b.creditor_id}`),
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
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
        {t('balance.pointsDone')}
      </ThemedText>
      <View style={styles.scores}>
        {[...points]
          .sort((a, b) => b.points_done - a.points_done)
          .map((member) => (
            <ThemedView key={member.user_id} type="backgroundElement" style={styles.score}>
              <ThemedText type="title" style={styles.number}>
                {member.points_done}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.scoreName} numberOfLines={1}>
                {nameOf(member.user_id)}
              </ThemedText>
            </ThemedView>
          ))}
      </View>

      <View style={styles.debts}>
        {sortedDebts.length === 0 ? (
          // "even" only makes sense with at least two people to be even with
          points.length >= 2 && (
            <ThemedText themeColor="textSecondary">{t('balance.even')}</ThemedText>
          )
        ) : (
          sortedDebts.map((debt) => (
            <ThemedText
              key={`${debt.debtor_id}-${debt.creditor_id}`}
              type="smallBold"
              style={styles.debt}>
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
  container: { gap: 10 },
  sectionLabel: { fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  scores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  // two tiles per row, each taking half of the width (a third one wraps to the next row)
  score: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    gap: 2,
  },
  number: {
    fontSize: 38,
    lineHeight: 42,
  },
  scoreName: { fontSize: 13, lineHeight: 18 },
  debts: { gap: Spacing.one },
  debt: { fontSize: 15, lineHeight: 22 },
});
