/** WorkTrust dark-slate + gold design tokens. */

import '@/global.css';
import { Platform } from 'react-native';

export const BrandColors = {
  slate: '#0D141A',
  slateSoft: '#151E26',
  slateElevated: '#1B2731',
  slateBorder: '#34424D',
  gold: '#F4B93F',
  goldBright: '#FFC95A',
  goldSoft: '#2C2414',
  text: '#FFFFFF',
  textSecondary: '#C2CBD2',
  muted: '#8D99A3',
  surface: '#151E26',
  surfaceLight: '#202C36',
  border: '#34424D',
  borderStrong: '#F4B93F',
  success: '#39C58A',
  successSoft: '#123A2E',
  danger: '#FF6B6B',
  background: '#0D141A',
  burgundy: '#F4B93F',
  burgundyDark: '#C99122',
  burgundySoft: '#2C2414',
  rose: '#F4B93F',
} as const;

export const Colors = {
  light: {
    text: BrandColors.text,
    background: BrandColors.background,
    backgroundElement: BrandColors.slateSoft,
    backgroundSelected: BrandColors.goldSoft,
    textSecondary: BrandColors.textSecondary,
  },
  dark: {
    text: BrandColors.text,
    background: BrandColors.background,
    backgroundElement: BrandColors.slateSoft,
    backgroundSelected: BrandColors.goldSoft,
    textSecondary: BrandColors.textSecondary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 } as const;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
