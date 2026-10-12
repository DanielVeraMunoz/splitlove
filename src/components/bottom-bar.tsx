import {
  faClockRotateLeft,
  faHouse,
  faPlus,
  faUser,
  faUserGroup,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { router } from 'expo-router';
import type { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';

// The props the tab bar receives, taken from the public Tabs component
type BarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { icon: IconDefinition; label: TranslationKey }> = {
  index: { icon: faHouse, label: 'tabs.home' },
  groups: { icon: faUserGroup, label: 'tabs.groups' },
  activity: { icon: faClockRotateLeft, label: 'tabs.activity' },
  profile: { icon: faUser, label: 'tabs.profile' },
};

// Inicio · Grupos · (+) · Actividad · Perfil. The native tab bar can't host a button in the
// middle that isn't a tab, hence this custom one. The (+) is not a route: it opens the flow
// to log an action.
export function BottomBar({ state, navigation, insets }: BarProps) {
  const theme = useTheme();

  function renderTab(name: string) {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return null;
    const focused = state.routes[state.index].key === route.key;
    const color = focused ? theme.accent : theme.textSecondary;

    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={t(TABS[name].label)}
        style={styles.tab}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        }}>
        <FontAwesomeIcon icon={TABS[name].icon} size={20} color={color} />
        <ThemedText style={[styles.label, { color }]}>{t(TABS[name].label)}</ThemedText>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.backgroundSelected,
          paddingBottom: Math.max(insets.bottom, Spacing.two),
        },
      ]}>
      {renderTab('index')}
      {renderTab('groups')}

      <View style={styles.tab}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tabs.add')}
          style={({ pressed }) => [
            styles.add,
            { backgroundColor: theme.accent, shadowColor: theme.accent, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => router.push('/pick-group')}>
          <FontAwesomeIcon icon={faPlus} size={24} color={theme.onAccent} />
        </Pressable>
      </View>

      {renderTab('activity')}
      {renderTab('profile')}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  tab: { flex: 1, alignItems: 'center', gap: Spacing.one, minHeight: 44, justifyContent: 'flex-end' },
  label: { fontFamily: FontFamily.bodyBold, fontSize: 11, lineHeight: 14 },
  // raised a little above the bar, like the add button of the group screen
  add: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginTop: -22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
