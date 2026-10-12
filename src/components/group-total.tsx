import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily } from '@/constants/theme';
import { t } from '@/i18n';
import { formatPoints } from '@/lib/format';

// +3 (green): others owe you. -5 (red): you owe. 0: even.
export function GroupTotal({ total, size = 24 }: { total: number; size?: number }) {
  const label =
    total > 0
      ? t('balance.totalOwedToYou', { points: formatPoints(total) })
      : total < 0
        ? t('balance.totalYouOwe', { points: formatPoints(-total) })
        : t('balance.totalEven');

  return (
    <ThemedText
      type="smallBold"
      themeColor={total > 0 ? 'positive' : total < 0 ? 'negative' : 'textSecondary'}
      style={[styles.total, { fontSize: size, lineHeight: size * 1.35 }]}
      accessibilityLabel={label}>
      {total > 0 ? `+${total}` : String(total)}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  total: { fontFamily: FontFamily.display },
});
