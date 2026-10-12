import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// The rounded square that frames an icon (group cards, entry rows)
export function IconBadge({ children }: { children: ReactNode }) {
  return (
    <ThemedView type="backgroundSelected" style={styles.badge}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 44,
    height: 44,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
