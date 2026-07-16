import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_icons.dart';
import '../core/theme/app_motion.dart';

/// A network image with a tasteful skeleton placeholder and graceful error
/// fallback. Fades in on load so grids feel calm rather than janky.
class NetworkPhoto extends StatelessWidget {
  const NetworkPhoto({
    required this.url,
    this.fit = BoxFit.cover,
    this.borderRadius = BorderRadius.zero,
    super.key,
  });

  final String? url;
  final BoxFit fit;
  final BorderRadius borderRadius;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    Widget child;
    if (url == null || url!.isEmpty) {
      child = _placeholder(c, broken: true);
    } else {
      child = Image.network(
        url!,
        fit: fit,
        loadingBuilder: (BuildContext ctx, Widget img, ImageChunkEvent? p) {
          if (p == null) return img;
          return _placeholder(c);
        },
        errorBuilder: (_, _, _) => _placeholder(c, broken: true),
        frameBuilder: (_, Widget img, int? frame, bool wasSync) {
          if (wasSync) return img;
          return AnimatedOpacity(
            opacity: frame == null ? 0 : 1,
            duration: AppMotion.slow,
            curve: AppMotion.decelerate,
            child: img,
          );
        },
      );
    }
    return ClipRRect(
      borderRadius: borderRadius,
      child: SizedBox.expand(child: child),
    );
  }

  Widget _placeholder(AppColors c, {bool broken = false}) => ColoredBox(
        color: c.skeleton,
        child: broken
            ? Center(
                child: Icon(AppIcons.gallery, color: c.textTertiary),
              )
            : null,
      );
}
