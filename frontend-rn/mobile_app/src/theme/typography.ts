import { TextStyle } from 'react-native';

/// Typographic system. Ported from AppTypography.
///
/// * Cormorant Garamond (serif) — display + headline text.
/// * Inter (sans) — every functional role.
///
/// With custom fonts, weight is encoded in the family name (RN cannot synthesise
/// a weight from a single family), so each role names its exact family.
export const fonts = {
  serif500: 'CormorantGaramond_500Medium',
  serif600: 'CormorantGaramond_600SemiBold',
  sans400: 'Inter_400Regular',
  sans500: 'Inter_500Medium',
  sans600: 'Inter_600SemiBold',
} as const;

export interface TextTheme {
  displayLarge: TextStyle;
  displayMedium: TextStyle;
  displaySmall: TextStyle;
  headlineLarge: TextStyle;
  headlineMedium: TextStyle;
  headlineSmall: TextStyle;
  titleLarge: TextStyle;
  titleMedium: TextStyle;
  titleSmall: TextStyle;
  bodyLarge: TextStyle;
  bodyMedium: TextStyle;
  bodySmall: TextStyle;
  labelLarge: TextStyle;
  labelMedium: TextStyle;
  labelSmall: TextStyle;
}

/// Build the full text theme for a given ink color.
export function makeTextTheme(color: string): TextTheme {
  return {
    displayLarge: { fontFamily: fonts.serif500, color, fontSize: 64, lineHeight: 64 * 1.04, letterSpacing: -0.5 },
    displayMedium: { fontFamily: fonts.serif500, color, fontSize: 52, lineHeight: 52 * 1.06, letterSpacing: -0.5 },
    displaySmall: { fontFamily: fonts.serif500, color, fontSize: 40, lineHeight: 40 * 1.1 },
    headlineLarge: { fontFamily: fonts.serif600, color, fontSize: 34, lineHeight: 34 * 1.12 },
    headlineMedium: { fontFamily: fonts.serif600, color, fontSize: 28, lineHeight: 28 * 1.16 },
    headlineSmall: { fontFamily: fonts.serif600, color, fontSize: 24, lineHeight: 24 * 1.2 },
    titleLarge: { fontFamily: fonts.sans600, color, fontSize: 20, lineHeight: 20 * 1.25, letterSpacing: -0.2 },
    titleMedium: { fontFamily: fonts.sans600, color, fontSize: 16, lineHeight: 16 * 1.3 },
    titleSmall: { fontFamily: fonts.sans600, color, fontSize: 14, lineHeight: 14 * 1.35 },
    bodyLarge: { fontFamily: fonts.sans400, color, fontSize: 16, lineHeight: 16 * 1.5 },
    bodyMedium: { fontFamily: fonts.sans400, color, fontSize: 14, lineHeight: 14 * 1.5 },
    bodySmall: { fontFamily: fonts.sans400, color, fontSize: 12, lineHeight: 12 * 1.45 },
    labelLarge: { fontFamily: fonts.sans600, color, fontSize: 14, lineHeight: 14 * 1.2, letterSpacing: 0.4 },
    labelMedium: { fontFamily: fonts.sans600, color, fontSize: 12, lineHeight: 12 * 1.2, letterSpacing: 0.6 },
    labelSmall: { fontFamily: fonts.sans600, color, fontSize: 11, lineHeight: 11 * 1.2, letterSpacing: 0.8 },
  };
}

/// Uppercase, wide-tracking "eyebrow"/overline for luxury signals.
export function eyebrow(color: string): TextStyle {
  return { fontFamily: fonts.sans600, color, fontSize: 11, fontWeight: '600', letterSpacing: 2.4, lineHeight: 11 * 1.2 };
}

/// Oversized display style for the customer-facing TV screens.
export function displayHero(color: string): TextStyle {
  return { fontFamily: fonts.serif500, color, fontSize: 96, lineHeight: 96 * 1.02, letterSpacing: -1 };
}

/// A body-weight (w400) serif variant — used where Flutter did
/// `titleLarge.copyWith(fontWeight: w400)` on the sans font.
export function sansRegular(base: TextStyle): TextStyle {
  return { ...base, fontFamily: fonts.sans400, fontWeight: '400' };
}
