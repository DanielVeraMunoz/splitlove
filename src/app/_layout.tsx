import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Nunito_500Medium, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/splash-overlay';
import { Colors, FontFamily } from '@/constants/theme';
import { CelebrationProvider } from '@/components/celebration';
import { CloseButton } from '@/components/close-button';
import { t } from '@/i18n';
import { SessionProvider, useSession } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

// Navigation (headers, screen backgrounds) uses the same tokens as the rest of the app.
// Built once per scheme, so the provider always receives the same object.
const buildNavigationTheme = (scheme: 'light' | 'dark') => {
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
const NAVIGATION_THEMES = { light: buildNavigationTheme('light'), dark: buildNavigationTheme('dark') };

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
    <Stack screenOptions={{ headerShown: false, headerTitleStyle: { fontFamily: FontFamily.display, fontSize: 20 } }}>
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
  const [fontsLoaded, fontsError] = useFonts({ Fredoka_600SemiBold, Nunito_500Medium, Nunito_700Bold });

  // The native splash stays up (preventAutoHideAsync above) until the fonts are ready.
  // If they fail, or simply never answer, we carry on with system fonts after a few
  // seconds instead of leaving the user on the splash forever.
  const [fontsTimedOut, setFontsTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setFontsTimedOut(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded && !fontsError && !fontsTimedOut) return null;

  return (
    // Swipe gestures need this wrapper at the root of the app
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={NAVIGATION_THEMES[colorScheme === 'dark' ? 'dark' : 'light']}>
        <SessionProvider>
          <CelebrationProvider>
            <RootNavigator />
          </CelebrationProvider>
          <AnimatedSplashOverlay />
        </SessionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
