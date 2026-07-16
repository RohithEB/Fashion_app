/// Dimensional tokens: control heights, icon sizes, image ratios, opacities,
/// and responsive breakpoints. Keeps touch targets consistent and accessible.
abstract final class AppSizes {
  // Button heights
  static const double buttonSm = 40;
  static const double buttonMd = 48;
  static const double buttonLg = 56;

  // Input heights
  static const double inputMd = 52;
  static const double inputLg = 60;

  // Minimum accessible touch target.
  static const double minTouchTarget = 48;

  // Icon sizes
  static const double iconXs = 16;
  static const double iconSm = 20;
  static const double iconMd = 24;
  static const double iconLg = 32;
  static const double iconXl = 40;

  // Opacities
  static const double opacityDisabled = 0.38;
  static const double opacityHint = 0.60;
  static const double opacityScrim = 0.72;
  static const double opacityFull = 1.0;

  // Image aspect ratios (fashion favours tall portrait framing).
  static const double ratioPortrait = 3 / 4;
  static const double ratioTall = 2 / 3;
  static const double ratioSquare = 1;
  static const double ratioLandscape = 16 / 9;

  // Responsive breakpoints (logical px).
  static const double breakpointMobile = 600;
  static const double breakpointTablet = 1024;
  static const double breakpointDesktop = 1440;
}
