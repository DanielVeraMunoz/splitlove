import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/hooks/use-theme';
import { ARROW_HEIGHT, ARROW_WIDTH, pathFor } from '@/lib/pixel-arrow';

const PIXEL = 6; // size of one arrow pixel, in points
const ARROW_PX_WIDTH = ARROW_WIDTH * PIXEL;
const FLIGHT_MS = 700;
const SECOND_ARROW_DELAY_MS = 180; // one arrow leaves a moment before the other

type Direction = 'right' | 'left';

function FlyingArrow({
  direction,
  top,
  delay,
  onDone,
}: {
  direction: Direction;
  top: number;
  delay: number;
  onDone?: () => void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(
        delay,
        withTiming(1, { duration: FLIGHT_MS, easing: Easing.inOut(Easing.quad) }, (finished) => {
          'worklet';
          if (finished && onDone) scheduleOnRN(onDone);
        }),
      ),
    );
  }, [delay, onDone, progress]);

  // Starts fully off one edge and ends fully off the other
  const from = direction === 'right' ? -ARROW_PX_WIDTH : width;
  const to = direction === 'right' ? width : -ARROW_PX_WIDTH;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.get(), [0, 1], [from, to]) }],
  }));

  return (
    <Animated.View style={[styles.arrow, { top }, animatedStyle]}>
      {/* the drawing points right; the left-flying arrow is the same drawing mirrored */}
      <View style={direction === 'left' ? styles.mirrored : undefined}>
        <Svg
          width={ARROW_PX_WIDTH}
          height={ARROW_HEIGHT * PIXEL}
          viewBox={`0 0 ${ARROW_WIDTH} ${ARROW_HEIGHT}`}>
          {/* the thin stroke seals the hairline seams between neighbouring pixels */}
          <Path d={pathFor('shaft')} fill={theme.text} stroke={theme.text} strokeWidth={0.06} />
          <Path d={pathFor('feather')} fill={theme.accent} stroke={theme.accent} strokeWidth={0.06} />
          <Path d={pathFor('head')} fill={theme.accent} stroke={theme.accent} strokeWidth={0.06} />
        </Svg>
      </View>
    </Animated.View>
  );
}

type CelebrationContextValue = { celebrate: () => void };

const CelebrationContext = createContext<CelebrationContextValue>({ celebrate: () => {} });

// Anything that went well calls `celebrate()`: two arrows cross the screen. It lives at the root
// of the app, above every screen, so it survives the screen that fired it closing.
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  const [flightId, setFlightId] = useState(0);
  const [active, setActive] = useState(false);

  const celebrate = useCallback(() => {
    // someone who asked their phone for less motion gets none
    if (reduceMotion) return;
    setFlightId((id) => id + 1); // a new key restarts the animation, even mid-flight
    setActive(true);
  }, [reduceMotion]);

  const finish = useCallback(() => setActive(false), []);
  const value = useMemo(() => ({ celebrate }), [celebrate]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      {active && (
        // pointerEvents none: it must never swallow a touch. Decorative: hidden from screen readers.
        <View
          style={styles.overlay}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <FlyingArrow key={`a-${flightId}`} direction="right" top={height * 0.3} delay={0} />
          <FlyingArrow
            key={`b-${flightId}`}
            direction="left"
            top={height * 0.42}
            delay={SECOND_ARROW_DELAY_MS}
            onDone={finish}
          />
        </View>
      )}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  return useContext(CelebrationContext);
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 900 },
  arrow: { position: 'absolute', left: 0 },
  mirrored: { transform: [{ scaleX: -1 }] },
});
