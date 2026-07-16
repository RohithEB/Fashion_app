import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';

class LoadingScreen extends StatelessWidget {
  const LoadingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return ColoredBox(
      color: c.background,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Text('PREPARING YOUR SHOWROOM', style: AppTypography.eyebrow(c.accent)),
            const SizedBox(height: AppSpacing.md),
            Text('One moment', style: t.headlineMedium),
            const SizedBox(height: AppSpacing.xl),
            SizedBox(
              width: 160,
              child: LinearProgressIndicator(
                color: c.accent,
                backgroundColor: c.disabled,
                minHeight: 2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
