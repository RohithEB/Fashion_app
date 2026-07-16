import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_motion.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../display_controller.dart';

class ThankYouScreen extends StatelessWidget {
  const ThankYouScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final int countdown = context.select<DisplayController, int>(
      (DisplayController d) => d.thankYouCountdown,
    );

    return ColoredBox(
      color: c.background,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            TweenAnimationBuilder<double>(
              tween: Tween<double>(begin: 0, end: 1),
              duration: AppMotion.xslow,
              curve: AppMotion.decelerate,
              builder: (_, double v, Widget? child) =>
                  Opacity(opacity: v, child: child),
              child: Column(
                children: <Widget>[
                  Text(
                    'WITH GRATITUDE',
                    style: AppTypography.eyebrow(c.accent),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    'Thank you',
                    style: AppTypography.displayHero(c.textPrimary),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    'We look forward to seeing you again.',
                    style: t.titleMedium?.copyWith(
                      color: c.textSecondary,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.giant),
            Text(
              'This session ends in $countdown',
              style: t.bodySmall?.copyWith(color: c.textTertiary),
            ),
          ],
        ),
      ),
    );
  }
}
