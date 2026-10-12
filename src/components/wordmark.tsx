import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// The outline of a heart on a 9 x 8 pixel grid, as ONE shape. Nine adjacent rectangles
// would leave hairline seams between them after anti-aliasing.
const HEART_PATH =
  'M1 0H3V1H4V2H5V1H6V0H8V1H9V4H8V5H7V6H6V7H5V8H4V7H3V6H2V5H1V4H0V1H1Z';

export function PixelHeart({ width, color }: { width: number; color: string }) {
  return (
    <Svg width={width} height={(width * 8) / 9} viewBox="0 0 9 8">
      <Path d={HEART_PATH} fill={color} />
    </Svg>
  );
}

// "Splitl" + pixel heart + "ve". `size` is the font size; the heart scales with it.
export function Wordmark({ size = 24 }: { size?: number }) {
  const theme = useTheme();
  const text = { fontFamily: FontFamily.display, fontSize: size, lineHeight: size * 1.2 };

  return (
    // read as one word, not as three pieces and an unlabeled drawing
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="Splitlove">
      <ThemedText style={text}>Splitl</ThemedText>
      <PixelHeart width={size * 0.72} color={theme.accent} />
      <ThemedText style={text}>ve</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline' },
});
