import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { CloseButton } from '@/components/close-button';
import { t } from '@/i18n';
import { SessionProvider, useSession } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

// Navigation (headers, screen backgrounds) uses the same tokens as the rest of the app
const navigationTheme = (scheme: 'light' | 'dark') => {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const c = Colors[scheme];
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.accent,
      background: c.background,
      card: c.background,
      text: c.text,
      border: c.backgroundSelected,
    },
  };
};

// Module-level so React Navigation gets the same function every render
const renderCloseButton = () => <CloseButton />;

// Same look for every modal: its own title and an X to close it
const modalOptions = (title: string) => ({
  presentation: 'modal' as const,
  headerShown: true,
  title,
  headerShadowVisible: false,
  headerRight: renderCloseButton,
});

function RootNavigator() {
  const { session, isLoading } = useSession();

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="group/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="new-entry" options={modalOptions(t('entries.newTitle'))} />
        <Stack.Screen name="new-group" options={modalOptions(t('groups.newTitle'))} />
        <Stack.Screen name="join-group" options={modalOptions(t('groups.joinTitle'))} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    // Swipe gestures need this wrapper at the root of the app
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navigationTheme(colorScheme === 'dark' ? 'dark' : 'light')}>
        <SessionProvider>
          <AnimatedSplashOverlay />
          <RootNavigator />
        </SessionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
