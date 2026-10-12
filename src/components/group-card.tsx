import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GroupKindIcon } from '@/components/group-kind-icon';
import { IconBadge } from '@/components/icon-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { t } from '@/i18n';
import type { Group } from '@/lib/groups';

// A group in a list: icon by kind, name, kind, and something on the right (its total, ...)
export function GroupCard({
  group,
  onPress,
  right,
}: {
  group: Group;
  onPress: () => void;
  right?: ReactNode;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <IconBadge>
          <GroupKindIcon kind={group.kind} />
        </IconBadge>
        <View style={styles.text}>
          <ThemedText type="smallBold" style={styles.title}>
            {group.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
            {t(`groups.kinds.${group.kind}`, { defaultValue: group.kind })}
          </ThemedText>
        </View>
        {right}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: Radius.card,
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
  },
  text: { flex: 1, gap: Spacing.one },
  title: { fontSize: 16, lineHeight: 22 },
  sub: { fontSize: 13, lineHeight: 18 },
});
