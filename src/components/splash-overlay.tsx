import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { PixelHeart } from '@/components/wordmark';
import { Colors } from '@/constants/theme';

// The native splash (app.json) shows the heart on the brand background. This overlay is
// IDENTICAL to it and sits on top of the app until it is ready, then fades out, so going
// from the native splash to the app has no jump.
// 101 = the heart's width inside the splash image: imageWidth 120 * (864 / 1024) in app.json.
const HEART_WIDTH = 101;

export function AnimatedSplashOverlay() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Animated.View
      exiting={FadeOut.duration(400)}
      // Once this overlay is on screen, hide the native splash and start the fade
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => setVisible(false));
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
