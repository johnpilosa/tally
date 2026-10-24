/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// La app es solo oscura, al estilo del modo oscuro de Nothing OS: negro puro, blanco y grises.
const NothingDark = {
  text: '#FFFFFF',
  background: '#000000',
  backgroundElement: '#111111',
  backgroundSelected: '#1C1C1C',
  textSecondary: '#8A8A8A',
  border: '#2A2A2A',
  /** El rojo de Nothing. Úsalo poco: un punto, un detalle. */
  accent: '#D71921',
} as const;

export const Colors = {
  light: NothingDark,
  dark: NothingDark,
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

/** Fuentes cargadas en src/app/_layout.tsx. Doto es de matriz de puntos, como la de Nothing. */
export const Type = {
  dot: 'Doto_900Black',
  dotLight: 'Doto_700Bold',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
} as const;

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
