import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Typographic system.
///
/// * **Cormorant Garamond** — a high-contrast couture serif — carries display
///   and headline text (welcome, product names, hero moments). Used only at
///   large sizes where its fine strokes stay legible.
/// * **Inter** — a neutral, highly legible grotesque — carries every functional
///   role (titles, body, labels, buttons, captions), giving controller/POS
///   surfaces a crisp, precise clarity.
abstract final class AppTypography {
  static TextTheme textTheme(Color color) {
    final TextStyle serif = GoogleFonts.cormorantGaramond(color: color);
    final TextStyle sans = GoogleFonts.inter(color: color);

    return TextTheme(
      displayLarge: serif.copyWith(
        fontSize: 64,
        height: 1.04,
        fontWeight: FontWeight.w500,
        letterSpacing: -0.5,
      ),
      displayMedium: serif.copyWith(
        fontSize: 52,
        height: 1.06,
        fontWeight: FontWeight.w500,
        letterSpacing: -0.5,
      ),
      displaySmall: serif.copyWith(
        fontSize: 40,
        height: 1.1,
        fontWeight: FontWeight.w500,
      ),
      headlineLarge: serif.copyWith(
        fontSize: 34,
        height: 1.12,
        fontWeight: FontWeight.w600,
      ),
      headlineMedium: serif.copyWith(
        fontSize: 28,
        height: 1.16,
        fontWeight: FontWeight.w600,
      ),
      headlineSmall: serif.copyWith(
        fontSize: 24,
        height: 1.2,
        fontWeight: FontWeight.w600,
      ),
      titleLarge: sans.copyWith(
        fontSize: 20,
        height: 1.25,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.2,
      ),
      titleMedium: sans.copyWith(
        fontSize: 16,
        height: 1.3,
        fontWeight: FontWeight.w600,
      ),
      titleSmall: sans.copyWith(
        fontSize: 14,
        height: 1.35,
        fontWeight: FontWeight.w600,
      ),
      bodyLarge: sans.copyWith(fontSize: 16, height: 1.5),
      bodyMedium: sans.copyWith(fontSize: 14, height: 1.5),
      bodySmall: sans.copyWith(fontSize: 12, height: 1.45),
      labelLarge: sans.copyWith(
        fontSize: 14,
        height: 1.2,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.4,
      ),
      labelMedium: sans.copyWith(
        fontSize: 12,
        height: 1.2,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.6,
      ),
      labelSmall: sans.copyWith(
        fontSize: 11,
        height: 1.2,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.8,
      ),
    );
  }

  /// Uppercase, wide-tracking "eyebrow"/overline for luxury signals.
  static TextStyle eyebrow(Color color) => GoogleFonts.inter(
        color: color,
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 2.4,
        height: 1.2,
      );

  /// Oversized display style for the customer-facing TV screens.
  static TextStyle displayHero(Color color) => GoogleFonts.cormorantGaramond(
        color: color,
        fontSize: 96,
        height: 1.02,
        fontWeight: FontWeight.w500,
        letterSpacing: -1,
      );
}
