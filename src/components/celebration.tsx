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

import { useTheme } from '@/hooks/use-theme';
import { ARROW_HEIGHT, ARROW_WIDTH, pathFor } from '@/lib/pixel-arrow';

const PIXEL = 6; // size of one arrow pixel, in points
const ARROW_PX_WIDTH = ARROW_WIDTH * PIXEL;
const FLIGHT_MS = 700;
const SECOND_ARROW_DELAY_MS = 180; // one arrow leaves a moment before the other

// A modal is a native layer above the whole app on iOS. For about this long after it starts
// closing it would hide the arrows, so screens that close a modal wait before celebrating.
export const MODAL_DISMISS_MS = 350;

// The drawing never changes: build its paths once, not on every render
const SHAFT_PATH = pathFor('shaft');
const FEATHER_PATH = pathFor('feather');
const HEAD_PATH = pathFor('head');

type Direction = 'right' | 'left';

function FlyingArrow({
  direction,
  top,
  delay,
}: {
  direction: Direction;
  top: number;
  delay: number;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(
        delay,
        withTiming(1, { duration: FLIGHT_MS, easing: Easing.inOut(Easing.quad) }),
      ),
    );
  }, [delay, progress]);

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
          <Path d={SHAFT_PATH} fill={theme.text} stroke={theme.text} strokeWidth={0.06} />
          <Path d={FEATHER_PATH} fill={theme.accent} stroke={theme.accent} strokeWidth={0.06} />
          <Path d={HEAD_PATH} fill={theme.accent} stroke={theme.accent} strokeWidth={0.06} />
        </Svg>
      </View>
    </Animated.View>
  );
}

// `delayMs`: how long to wait before the arrows start (see MODAL_DISMISS_MS)
type CelebrationContextValue = { celebrate: (options?: { delayMs?: number }) => void };

const CelebrationContext = createContext<CelebrationContextValue>({ celebrate: () => {} });

// Anything that went well calls `celebrate()`: two arrows cross the screen. It lives at the root
// of the app, above every screen, so it survives the screen that fired it closing.
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  // null = nothing flying. A new id restarts the animation, even mid-flight.
  const [flight, setFlight] = useState<{ id: number; delayMs: number } | null>(null);

  const celebrate = useCallback(
    ({ delayMs = 0 }: { delayMs?: number } = {}) => {
      // someone who asked their phone for less motion gets none
      if (reduceMotion) return;
      setFlight((current) => ({ id: (current?.id ?? 0) + 1, delayMs }));
    },
    [reduceMotion],
  );

  // Remove the overlay when the flight is over. A timer rather than a callback from the
  // animation: if the animation is cut short (app sent to the background), it still goes away.
  const flightId = flight?.id;
  const flightDelay = flight?.delayMs ?? 0;
  useEffect(() => {
    if (flightId === undefined) return;
    const timer = setTimeout(
      () => setFlight(null),
      flightDelay + SECOND_ARROW_DELAY_MS + FLIGHT_MS + 100,
    );
    return () => clearTimeout(timer);
  }, [flightId, flightDelay]);

  const value = useMemo(() => ({ celebrate }), [celebrate]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      {flight && (
        // It must never swallow a touch (prop and style: the prop is being phased out in
        // favour of the style). Decorative: hidden from screen readers.
        <View
          style={styles.overlay}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <FlyingArrow
            key={`a-${flight.id}`}
            direction="right"
            top={height * 0.3}
            delay={flight.delayMs}
          />
          <FlyingArrow
            key={`b-${flight.id}`}
            direction="left"
            top={height * 0.42}
            delay={flight.delayMs + SECOND_ARROW_DELAY_MS}
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
  overlay: { ...StyleSheet.absoluteFill, zIndex: 900, pointerEvents: 'none' },
  arrow: { position: 'absolute', left: 0 },
  mirrored: { transform: [{ scaleX: -1 }] },
});
