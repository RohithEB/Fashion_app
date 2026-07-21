// Semantic color palette for the luxury fashion showroom.
//
// Design language: warm near-black ink, ivory/porcelain surfaces, and a
// restrained champagne-gold accent. Ported 1:1 from the Flutter `AppColors`
// tokens (light + dark). The display app runs always-dark.

export interface AppColors {
  brightness: 'light' | 'dark';

  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  accent: string;
  onAccent: string;

  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;
  overlay: string;
  scrim: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  border: string;
  divider: string;
  hover: string;
  pressed: string;
  focus: string;
  disabled: string;
  onDisabled: string;

  success: string;
  warning: string;
  error: string;
  info: string;
  onStatus: string;

  skeleton: string;
  shimmerBase: string;
  shimmerHighlight: string;
}

/// Warm ivory light theme.
export const lightColors: AppColors = {
  brightness: 'light',
  primary: '#141210',
  onPrimary: '#F7F5F1',
  secondary: '#6E655B',
  onSecondary: '#F7F5F1',
  accent: '#B79268',
  onAccent: '#1A140C',
  background: '#F7F5F1',
  surface: '#FFFFFF',
  surfaceElevated: '#FCFBF9',
  card: '#FFFFFF',
  overlay: 'rgba(20,18,16,0.60)',
  scrim: 'rgba(0,0,0,0.70)',
  textPrimary: '#141210',
  textSecondary: '#5C544B',
  textTertiary: '#938A7E',
  textInverse: '#F7F5F1',
  border: '#E6E1D8',
  divider: '#EDEAE3',
  hover: 'rgba(20,18,16,0.039)',
  pressed: 'rgba(20,18,16,0.078)',
  focus: '#B79268',
  disabled: '#E6E1D8',
  onDisabled: '#B4ABA0',
  success: '#3F7A5B',
  warning: '#B8863B',
  error: '#A23A32',
  info: '#3E6B87',
  onStatus: '#F7F5F1',
  skeleton: '#ECE8E1',
  shimmerBase: '#ECE8E1',
  shimmerHighlight: '#F7F5F1',
};

/// Deep near-black dark theme (gallery-at-night feel).
export const darkColors: AppColors = {
  brightness: 'dark',
  primary: '#F4F1EC',
  onPrimary: '#141210',
  secondary: '#A79D90',
  onSecondary: '#141210',
  accent: '#C9A97E',
  onAccent: '#1A140C',
  background: '#0E0D0C',
  surface: '#171614',
  surfaceElevated: '#1F1D1A',
  card: '#17150F',
  overlay: 'rgba(0,0,0,0.70)',
  scrim: 'rgba(0,0,0,0.80)',
  textPrimary: '#F4F1EC',
  textSecondary: '#B4ABA0',
  textTertiary: '#827A6F',
  textInverse: '#141210',
  border: '#2C2A26',
  divider: '#242220',
  hover: 'rgba(244,241,236,0.06)',
  pressed: 'rgba(244,241,236,0.12)',
  focus: '#C9A97E',
  disabled: '#2C2A26',
  onDisabled: '#615A50',
  success: '#5B9E78',
  warning: '#CB9C52',
  error: '#C65A50',
  info: '#5E8CA6',
  onStatus: '#0E0D0C',
  skeleton: '#201E1B',
  shimmerBase: '#201E1B',
  shimmerHighlight: '#2C2A26',
};

/// Apply an alpha (0..1) to a `#RRGGBB` hex color, returning an rgba() string.
export function withAlpha(hex: string, alpha: number): string {
  const s = hex.replace('#', '');
  const r = parseInt(s.substring(0, 2), 16);
  const g = parseInt(s.substring(2, 4), 16);
  const b = parseInt(s.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
