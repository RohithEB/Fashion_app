import 'package:flutter/material.dart';

import '../../../core/theme/app_motion.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';

/// Boot splash: the Maison Ébani mark on a clean white field, continuing
/// straight on from the native splash so there is no colour flash at launch.
/// Deliberately light (the rest of the display app is dark) — this is the brand
/// moment before the gallery takes over.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  /// Brand ink + gilt, sampled from the monogram itself.
  static const Color _ink = Color(0xFF182838);
  static const Color _gilt = Color(0xFFC8A070);

  @override
  Widget build(BuildContext context) {
    final TextTheme t = Theme.of(context).textTheme;
    return ColoredBox(
      color: Colors.white,
      child: Center(
        child: TweenAnimationBuilder<double>(
          tween: Tween<double>(begin: 0, end: 1),
          duration: AppMotion.xslow,
          curve: AppMotion.decelerate,
          builder: (_, double v, Widget? child) =>
              Opacity(opacity: v, child: child),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Image.asset(
                'assets/icon/app_icon.png',
                width: 220,
                height: 220,
                filterQuality: FilterQuality.high,
              ),
              const SizedBox(height: AppSpacing.xl),
              Text('LUXURY FASHION', style: AppTypography.eyebrow(_gilt)),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Ebani',
                style: t.displayMedium?.copyWith(color: _ink),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
