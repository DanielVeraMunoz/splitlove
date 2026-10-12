import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { CloseButton } from '@/components/close-button';
import { t } from '@/i18n';
import { SessionProvider, useSession } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

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
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </SessionProvider>
    </ThemeProvider>
  );
}
