import { describe, it, expect } from '@jest/globals';
import { totalsByGroup, type DebtRow } from '../balance';

const debt = (group: string, creditor: string, debtor: string, points: number): DebtRow => ({
  group_id: group,
  creditor_id: creditor,
  debtor_id: debtor,
  points,
});

describe('totalsByGroup', () => {
  it('is positive when others owe me', () => {
    expect(totalsByGroup([debt('g1', 'me', 'isaac', 3)], 'me')).toEqual({ g1: 3 });
  });

  it('is negative when I owe', () => {
    expect(totalsByGroup([debt('g1', 'isaac', 'me', 5)], 'me')).toEqual({ g1: -5 });
  });

  it('adds up everyone who owes me in a group, and keeps groups apart', () => {
    const rows = [debt('g2', 'me', 'a', 1), debt('g2', 'me', 'b', 1), debt('g3', 'a', 'me', 2)];
    expect(totalsByGroup(rows, 'me')).toEqual({ g2: 2, g3: -2 });
  });

  it('nets what I am owed against what I owe inside one group', () => {
    const rows = [debt('g4', 'me', 'a', 3), debt('g4', 'b', 'me', 1)];
    expect(totalsByGroup(rows, 'me')).toEqual({ g4: 2 });
  });

  it('ignores debts between two other people', () => {
    expect(totalsByGroup([debt('g2', 'a', 'b', 4)], 'me')).toEqual({});
  });

  it('is empty when there are no debts', () => {
    expect(totalsByGroup([], 'me')).toEqual({});
  });

  it('adds numbers even if the points arrive as strings', () => {
    // PostgREST could hand numerics back as text; "1" + "2" must not become "12"
    const rows = [debt('g1', 'me', 'a', '1' as unknown as number), debt('g1', 'me', 'b', '2' as unknown as number)];
    expect(totalsByGroup(rows, 'me')).toEqual({ g1: 3 });
  });
});
