/** WorkTrust Indigo & Sky Blue design tokens. */

import '@/global.css';
import { Platform } from 'react-native';

export const BrandColors = {
  // Primary brand palette from WorkTrust Theme #5: Indigo & Sky Blue.
  navy: '#0A1F44',
  indigo: '#2563EB',
  sky: '#7DD3FC',
  white: '#FFFFFF',
  skySoft: '#E0F2FE',

  // Semantic tokens used throughout the mobile application.
  slate: '#0A1F44',
  slateSoft: '#E0F2FE',
  slateElevated: '#FFFFFF',
  slateBorder: '#7DD3FC',
  gold: '#2563EB',
  goldBright: '#2563EB',
  goldSoft: '#E0F2FE',
  text: '#0A1F44',
  textSecondary: '#35537D',
  muted: '#64748B',
  surface: '#FFFFFF',
  surfaceLight: '#F7FBFF',
  border: '#BFDBFE',
  borderStrong: '#2563EB',
  success: '#15803D',
  successSoft: '#DCFCE7',
  danger: '#DC2626',
  background: '#FFFFFF',

  // Backward-compatible aliases for screens built before the final theme.
  // They intentionally resolve to the Indigo & Sky Blue palette.
  burgundy: '#2563EB',
  burgundyDark: '#1D4ED8',
  burgundySoft: '#E0F2FE',
  rose: '#2563EB',
  blush: '#7DD3FC',
  blushSoft: '#E0F2FE',
} as const;

export const Colors = {
  light: {
    text: BrandColors.text,
    background: BrandColors.background,
    backgroundElement: BrandColors.surface,
    backgroundSelected: BrandColors.skySoft,
    textSecondary: BrandColors.textSecondary,
  },
  dark: {
    text: BrandColors.white,
    background: BrandColors.navy,
    backgroundElement: '#102B56',
    backgroundSelected: '#173D78',
    textSecondary: '#C7E9FF',
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
