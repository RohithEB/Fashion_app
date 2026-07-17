import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../models/money.dart';

/// Renders a product price with the **base price struck through** whenever the
/// effective (paid) price is genuinely lower — so a reduced/variant price reads
/// as a deal. When base == effective it shows a single clean price (no fake
/// strikethrough). Used identically on the mobile controller and the customer
/// display so the same product always reads the same way on both screens.
class PriceTag extends StatelessWidget {
  const PriceTag({
    super.key,
    required this.base,
    required this.effective,
    this.style,
    this.alignment = WrapAlignment.start,
  });

  /// The list / base price (struck through when higher than [effective]).
  final Money base;

  /// The price actually charged (variant override, or the base when none).
  final Money effective;

  /// Style for the effective price; the struck base derives from it.
  final TextStyle? style;
  final WrapAlignment alignment;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextStyle priceStyle =
        style ?? Theme.of(context).textTheme.titleMedium ?? const TextStyle();
    final bool discounted = base.minorUnits > effective.minorUnits;
    if (!discounted) {
      return Text(effective.formatted, style: priceStyle);
    }
    return Wrap(
      alignment: alignment,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: AppSpacingLike.gap,
      children: <Widget>[
        Text(effective.formatted, style: priceStyle),
        Text(
          base.formatted,
          style: priceStyle.copyWith(
            color: c.textTertiary,
            fontWeight: FontWeight.w400,
            decoration: TextDecoration.lineThrough,
            decorationColor: c.textTertiary,
          ),
        ),
      ],
    );
  }
}

/// Local spacing constant kept independent so this widget can be copied verbatim
/// between the mobile and display apps (whose spacing scales are identical).
abstract final class AppSpacingLike {
  static const double gap = 8;
}
