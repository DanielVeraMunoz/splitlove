import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// The rounded square that frames an icon (group cards, entry rows)
export function IconBadge({ children }: { children: ReactNode }) {
  return (
    // decorative: the text next to it already says everything
    <ThemedView
      type="backgroundSelected"
      style={styles.badge}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 44,
    height: 44,
    flexShrink: 0, // never squeezed by a long name next to it
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
