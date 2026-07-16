import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_motion.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../display_controller.dart';

/// "You're now connected with {Salesperson}." Shown while the salesperson
/// browses privately — the customer sees only this until a product is presented.
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final String name = context.select<DisplayController, String>(
      (DisplayController d) => d.salespersonName,
    );

    return ColoredBox(
      color: c.background,
      child: Center(
        child: TweenAnimationBuilder<double>(
          tween: Tween<double>(begin: 0, end: 1),
          duration: AppMotion.xslow,
          curve: AppMotion.decelerate,
          builder: (_, double v, Widget? child) => Opacity(
            opacity: v,
            child: Transform.translate(offset: Offset(0, (1 - v) * 16), child: child),
          ),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 900),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text('WELCOME', style: AppTypography.eyebrow(c.accent)),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'You are now connected\nwith $name',
                  textAlign: TextAlign.center,
                  style: AppTypography.displayHero(c.textPrimary).copyWith(fontSize: 72),
                ),
                const SizedBox(height: AppSpacing.xl),
                Text(
                  'Share your requirements, and our fashion experts will help '
                  'you find the perfect piece.',
                  textAlign: TextAlign.center,
                  style: t.titleMedium?.copyWith(
                    color: c.textSecondary,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
