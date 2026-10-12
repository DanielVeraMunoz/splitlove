/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Palette from the approved visual proposal: dusty "cupid" pink on a warm background.
// `accent` fills buttons, selected chips and the add button; `onAccent` is the text/icon on it.
// positive/negative are the +N / -N colors, kept apart from the brand pink on purpose.
export const Colors = {
  light: {
    text: '#3A2327',
    background: '#FBF1F0',
    backgroundElement: '#F6E2E2',
    backgroundSelected: '#EDCFD2',
    textSecondary: '#7E5F65',
    accent: '#A24858', // 5.3:1 against onAccent; #B25666 from the mock-up was only 4.3:1
    onAccent: '#FBF1F0',
    positive: '#2F7A5A',
    negative: '#B5412F',
  },
  dark: {
    text: '#F7E9EA',
    background: '#1F1416',
    backgroundElement: '#2D1D20',
    backgroundSelected: '#3B282C',
    textSecondary: '#C9A9AE',
    accent: '#E49AA6',
    onAccent: '#2A1518',
    positive: '#7FCBA3',
    negative: '#F0907F',
  },
} as const;

// Google Fonts bake the weight into the family name, so we pick a weight by picking a
// family (never with `fontWeight`, which fakes bold on top of a font that already has it).
// They are loaded in src/app/_layout.tsx.
export const FontFamily = {
  body: 'Nunito_500Medium',
  bodyBold: 'Nunito_700Bold',
  display: 'Fredoka_600SemiBold', // titles and numbers
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
