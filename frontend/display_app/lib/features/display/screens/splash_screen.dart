import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_motion.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return ColoredBox(
      color: c.background,
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
              Text('MAISON DE COUTURE', style: AppTypography.eyebrow(c.accent)),
              const SizedBox(height: AppSpacing.md),
              Text('Maison Ébani', style: t.displayMedium),
            ],
          ),
        ),
      ),
    );
  }
}
