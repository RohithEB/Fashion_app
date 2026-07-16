import 'package:flutter/material.dart';

/// Semantic color palette for the luxury fashion showroom.
///
/// Design language: warm near-black ink, ivory/porcelain surfaces, and a
/// restrained champagne-gold accent — the vocabulary of couture houses rather
/// than a mass-market shopping app. Never hardcode a [Color] in feature code;
/// reference [AppColors.of] or the light/dark instances below.
@immutable
class AppColors {
  const AppColors({
    required this.brightness,
    required this.primary,
    required this.onPrimary,
    required this.secondary,
    required this.onSecondary,
    required this.accent,
    required this.onAccent,
    required this.background,
    required this.surface,
    required this.surfaceElevated,
    required this.card,
    required this.overlay,
    required this.scrim,
    required this.textPrimary,
    required this.textSecondary,
    required this.textTertiary,
    required this.textInverse,
    required this.border,
    required this.divider,
    required this.hover,
    required this.pressed,
    required this.focus,
    required this.disabled,
    required this.onDisabled,
    required this.success,
    required this.warning,
    required this.error,
    required this.info,
    required this.onStatus,
    required this.skeleton,
    required this.shimmerBase,
    required this.shimmerHighlight,
  });

  final Brightness brightness;

  final Color primary;
  final Color onPrimary;
  final Color secondary;
  final Color onSecondary;
  final Color accent;
  final Color onAccent;

  final Color background;
  final Color surface;
  final Color surfaceElevated;
  final Color card;
  final Color overlay;
  final Color scrim;

  final Color textPrimary;
  final Color textSecondary;
  final Color textTertiary;
  final Color textInverse;

  final Color border;
  final Color divider;
  final Color hover;
  final Color pressed;
  final Color focus;
  final Color disabled;
  final Color onDisabled;

  final Color success;
  final Color warning;
  final Color error;
  final Color info;
  final Color onStatus;

  final Color skeleton;
  final Color shimmerBase;
  final Color shimmerHighlight;

  /// Warm ivory light theme.
  static const AppColors light = AppColors(
    brightness: Brightness.light,
    primary: Color(0xFF141210),
    onPrimary: Color(0xFFF7F5F1),
    secondary: Color(0xFF6E655B),
    onSecondary: Color(0xFFF7F5F1),
    accent: Color(0xFFB79268),
    onAccent: Color(0xFF1A140C),
    background: Color(0xFFF7F5F1),
    surface: Color(0xFFFFFFFF),
    surfaceElevated: Color(0xFFFCFBF9),
    card: Color(0xFFFFFFFF),
    overlay: Color(0x99141210),
    scrim: Color(0xB3000000),
    textPrimary: Color(0xFF141210),
    textSecondary: Color(0xFF5C544B),
    textTertiary: Color(0xFF938A7E),
    textInverse: Color(0xFFF7F5F1),
    border: Color(0xFFE6E1D8),
    divider: Color(0xFFEDEAE3),
    hover: Color(0x0A141210),
    pressed: Color(0x14141210),
    focus: Color(0xFFB79268),
    disabled: Color(0xFFE6E1D8),
    onDisabled: Color(0xFFB4ABA0),
    success: Color(0xFF3F7A5B),
    warning: Color(0xFFB8863B),
    error: Color(0xFFA23A32),
    info: Color(0xFF3E6B87),
    onStatus: Color(0xFFF7F5F1),
    skeleton: Color(0xFFECE8E1),
    shimmerBase: Color(0xFFECE8E1),
    shimmerHighlight: Color(0xFFF7F5F1),
  );

  /// Deep near-black dark theme (gallery-at-night feel).
  static const AppColors dark = AppColors(
    brightness: Brightness.dark,
    primary: Color(0xFFF4F1EC),
    onPrimary: Color(0xFF141210),
    secondary: Color(0xFFA79D90),
    onSecondary: Color(0xFF141210),
    accent: Color(0xFFC9A97E),
    onAccent: Color(0xFF1A140C),
    background: Color(0xFF0E0D0C),
    surface: Color(0xFF171614),
    surfaceElevated: Color(0xFF1F1D1A),
    card: Color(0xFF17150F),
    overlay: Color(0xB3000000),
    scrim: Color(0xCC000000),
    textPrimary: Color(0xFFF4F1EC),
    textSecondary: Color(0xFFB4ABA0),
    textTertiary: Color(0xFF827A6F),
    textInverse: Color(0xFF141210),
    border: Color(0xFF2C2A26),
    divider: Color(0xFF242220),
    hover: Color(0x0FF4F1EC),
    pressed: Color(0x1FF4F1EC),
    focus: Color(0xFFC9A97E),
    disabled: Color(0xFF2C2A26),
    onDisabled: Color(0xFF615A50),
    success: Color(0xFF5B9E78),
    warning: Color(0xFFCB9C52),
    error: Color(0xFFC65A50),
    info: Color(0xFF5E8CA6),
    onStatus: Color(0xFF0E0D0C),
    skeleton: Color(0xFF201E1B),
    shimmerBase: Color(0xFF201E1B),
    shimmerHighlight: Color(0xFF2C2A26),
  );

  /// Accessor from a [BuildContext] via the theme extension.
  static AppColors of(BuildContext context) =>
      Theme.of(context).extension<AppColorsExtension>()?.colors ??
      (Theme.of(context).brightness == Brightness.dark ? dark : light);
}

/// [ThemeExtension] wrapper so [AppColors] rides along on [ThemeData].
@immutable
class AppColorsExtension extends ThemeExtension<AppColorsExtension> {
  const AppColorsExtension(this.colors);

  final AppColors colors;

  @override
  ThemeExtension<AppColorsExtension> copyWith({AppColors? colors}) =>
      AppColorsExtension(colors ?? this.colors);

  @override
  ThemeExtension<AppColorsExtension> lerp(
    covariant ThemeExtension<AppColorsExtension>? other,
    double t,
  ) {
    if (other is! AppColorsExtension) return this;
    return t < 0.5 ? this : other;
  }
}
