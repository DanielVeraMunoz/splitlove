export type DebtRow = {
  group_id: string;
  creditor_id: string;
  debtor_id: string;
  points: number;
};

// Your net total in each group, from the pair_debts rows:
//   > 0  others owe you that many points
//   < 0  you owe others
// Groups where nobody owes anything have no rows, so the caller treats a missing
// key as 0.
export function totalsByGroup(debts: DebtRow[], myId: string): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const debt of debts) {
    if (debt.creditor_id === myId) {
      totals[debt.group_id] = (totals[debt.group_id] ?? 0) + debt.points;
    } else if (debt.debtor_id === myId) {
      totals[debt.group_id] = (totals[debt.group_id] ?? 0) - debt.points;
    }
  }
  return totals;
}
