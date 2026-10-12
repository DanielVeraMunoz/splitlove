import { t } from '@/i18n';

// "1 punto" / "3 puntos". Done by hand (not with i18n-js plural objects) so the
// translation keys stay plain strings and remain type-checked.
export function formatPoints(count: number) {
  return count === 1 ? t('points.one') : t('points.other', { count });
}
