import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { PixelHeart } from '@/components/wordmark';
import { Colors } from '@/constants/theme';
import { useSession } from '@/lib/session';

// The native splash (app.json) shows the heart on the brand background. This overlay is
// IDENTICAL to it and stays on top until the app can show its first real screen (the stored
// session has been read), then fades out. So going from the native splash to the app has no jump.
//
// Keep these in sync with app.json ("expo-splash-screen" plugin) and splash-icon.png:
const SPLASH_IMAGE_WIDTH = 120; // `imageWidth` in app.json
const HEART_FRACTION = 864 / 1024; // the heart is 864 px wide inside the 1024 px PNG
const HEART_WIDTH = SPLASH_IMAGE_WIDTH * HEART_FRACTION;

// Reading the stored session takes a few milliseconds, which would make the heart flash by
// unseen. It stays at least this long so the brand moment is actually perceived.
const MIN_VISIBLE_MS = 800;

export function AnimatedSplashOverlay() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { isLoading } = useSession();
  const nativeSplashHidden = useRef(false);
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  // Mobile only: on web there is no native splash to hand over from.
  // When the app is ready (session read AND minimum time passed) the overlay stops rendering,
  // and the `exiting` animation below turns that disappearance into the fade-out.
  if (Platform.OS === 'web' || (!isLoading && minTimePassed)) return null;

  return (
    <Animated.View
      exiting={FadeOut.duration(400)}
      // As soon as this overlay is on screen it covers the native splash, so that one can go.
      // Once only: onLayout fires again on rotation or inset changes.
      onLayout={() => {
        if (nativeSplashHidden.current) return;
        nativeSplashHidden.current = true;
        SplashScreen.hideAsync().catch(() => {
          // already hidden: nothing to do
        });
      }}
      style={[styles.overlay, { backgroundColor: Colors[scheme].background }]}>
      <PixelHeart width={HEART_WIDTH} color={Colors[scheme].accent} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
