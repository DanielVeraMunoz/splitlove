import { t } from '@/i18n';

// +N for what I did, -N for what someone else did (and I owe)
export function signedPoints(mine: boolean, points: number) {
  return `${mine ? '+' : '-'}${points}`;
}

// "1 punto" / "3 puntos". Done by hand (not with i18n-js plural objects) so the
// translation keys stay plain strings and remain type-checked.
export function formatPoints(count: number) {
  return count === 1 ? t('points.one') : t('points.other', { count });
}
