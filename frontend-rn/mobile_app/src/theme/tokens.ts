import { TextStyle } from 'react-native';

/// 8-point spacing scale (with 4pt half-steps). Ported from AppSpacing.
export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  xhuge: 56,
  giant: 64,
  screenPadding: 16,
  displayPadding: 64,
} as const;

/// Corner-radius scale. Ported from AppRadius.
export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/// Dimensional tokens. Ported from AppSizes.
export const sizes = {
  buttonSm: 40,
  buttonMd: 48,
  buttonLg: 56,
  inputMd: 52,
  inputLg: 60,
  minTouchTarget: 48,
  iconXs: 16,
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
  iconXl: 40,
  opacityDisabled: 0.38,
  opacityHint: 0.6,
  opacityScrim: 0.72,
  opacityFull: 1.0,
  ratioPortrait: 3 / 4,
  ratioTall: 2 / 3,
  ratioSquare: 1,
  ratioLandscape: 16 / 9,
  breakpointMobile: 600,
  breakpointTablet: 1024,
  breakpointDesktop: 1440,
} as const;

/// Motion tokens — durations (ms) and easing. Ported from AppMotion.
export const motion = {
  instant: 90,
  fast: 150,
  base: 250,
  slow: 400,
  xslow: 600,
  display: 700,
  // react-native-reanimated / Animated easings map roughly to these curves;
  // most ports use timing with the default easeInOut.
} as const;

/// Elevation tokens as reusable shadow styles. Ported from AppElevation.
/// (react-native-web maps these onto box-shadow.)
export const elevation: Record<string, TextStyle> = {
  none: {},
  low: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  } as TextStyle,
  medium: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  } as TextStyle,
  high: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  } as TextStyle,
  overlay: {
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 56,
    shadowOffset: { width: 0, height: 24 },
    elevation: 24,
  } as TextStyle,
};
