import 'package:flutter/material.dart';

/// Elevation tokens as reusable, tasteful shadow sets — soft, low-opacity
/// lifts appropriate to a premium aesthetic. Use these instead of ad-hoc shadows.
abstract final class AppElevation {
  static const List<BoxShadow> none = <BoxShadow>[];

  static const List<BoxShadow> low = <BoxShadow>[
    BoxShadow(color: Color(0x0F000000), blurRadius: 12, offset: Offset(0, 2)),
  ];

  static const List<BoxShadow> medium = <BoxShadow>[
    BoxShadow(color: Color(0x14000000), blurRadius: 24, offset: Offset(0, 6)),
  ];

  static const List<BoxShadow> high = <BoxShadow>[
    BoxShadow(
      color: Color(0x1F000000),
      blurRadius: 40,
      spreadRadius: -4,
      offset: Offset(0, 16),
    ),
  ];

  static const List<BoxShadow> overlay = <BoxShadow>[
    BoxShadow(
      color: Color(0x29000000),
      blurRadius: 56,
      spreadRadius: -8,
      offset: Offset(0, 24),
    ),
  ];
}
