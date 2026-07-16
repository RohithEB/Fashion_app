import 'package:flutter/animation.dart';

/// Motion tokens — durations and curves. Motion is restrained and confident:
/// quick, eased, never bouncy. The customer-facing display cross-fades content
/// cinematically; UI feedback is fast and crisp.
abstract final class AppMotion {
  static const Duration instant = Duration(milliseconds: 90);
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration base = Duration(milliseconds: 250);
  static const Duration slow = Duration(milliseconds: 400);
  static const Duration xslow = Duration(milliseconds: 600);

  /// Cinematic cross-fade used when the display swaps content.
  static const Duration display = Duration(milliseconds: 700);

  static const Curve standard = Curves.easeInOutCubic;
  static const Curve emphasized = Cubic(0.2, 0.0, 0.0, 1.0);
  static const Curve decelerate = Curves.easeOutCubic;
  static const Curve accelerate = Curves.easeInCubic;
  static const Curve enter = Curves.easeOutCubic;
  static const Curve exit = Curves.easeInCubic;
}
