/// 8-point spacing scale (with 4pt half-steps) for all padding, gaps, and
/// layout rhythm. Never use raw magic numbers for spacing.
abstract final class AppSpacing {
  static const double none = 0;
  static const double xxs = 4;
  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 20;
  static const double xl = 24;
  static const double xxl = 32;
  static const double xxxl = 40;
  static const double huge = 48;
  static const double xhuge = 56;
  static const double giant = 64;

  /// Standard screen edge padding (mobile).
  static const double screenPadding = md;

  /// Generous edge padding for the large-screen display app.
  static const double displayPadding = giant;
}
