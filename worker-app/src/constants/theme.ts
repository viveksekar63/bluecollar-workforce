/**
 * WorkTrust design tokens. The warm blush-to-burgundy palette is shared
 * across the worker app so onboarding, authentication and home screens
 * have one consistent visual identity.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const BrandColors = {
  blush: '#E18C88',
  rose: '#B86F77',
  burgundy: '#713442',
  burgundyDark: '#5D2938',
  burgundySoft: '#F6E7E8',
  blushSoft: '#FBEFEE',
  text: '#18233D',
  textSecondary: '#6F6870',
  background: '#FAF8F8',
  surface: '#FFFFFF',
  border: '#E8DADC',
  borderStrong: '#D9B9BD',
  success: '#20A77A',
  successSoft: '#E8F7F1',
  muted: '#9A8F95',
  danger: '#B84A55',
} as const;

export const Colors = {
  light: {
    text: BrandColors.text,
    background: BrandColors.background,
    backgroundElement: '#F5EEEE',
    backgroundSelected: BrandColors.burgundySoft,
    textSecondary: BrandColors.textSecondary,
  },
  dark: {
    text: '#FFFFFF',
    background: '#21171B',
    backgroundElement: '#33242A',
    backgroundSelected: '#4A2D37',
    textSecondary: '#D6C6CB',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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
