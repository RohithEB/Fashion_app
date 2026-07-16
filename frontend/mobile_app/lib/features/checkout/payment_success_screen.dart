import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_icons.dart';
import '../../core/theme/app_motion.dart';
import '../../core/theme/app_spacing.dart';
import '../../widgets/app_button.dart';
import '../presentation/presentation_controller.dart';

/// Payment confirmation. The display simultaneously shows its Thank-You screen
/// (driven by the `paymentSuccess` event).
class PaymentSuccessScreen extends StatelessWidget {
  const PaymentSuccessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          child: Column(
            children: <Widget>[
              const Spacer(flex: 2),
              TweenAnimationBuilder<double>(
                tween: Tween<double>(begin: 0.6, end: 1),
                duration: AppMotion.slow,
                curve: AppMotion.emphasized,
                builder: (_, double v, Widget? child) =>
                    Transform.scale(scale: v, child: child),
                child: Icon(AppIcons.success, size: 88, color: c.success),
              ),
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Thank you',
                style: t.displaySmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'The order is complete and the client display is showing a '
                'thank-you message.',
                style: t.bodyLarge?.copyWith(color: c.textSecondary),
                textAlign: TextAlign.center,
              ),
              const Spacer(flex: 3),
              AppButton(
                label: 'Return to the collection',
                expand: true,
                onPressed: () {
                  context.read<PresentationController>().hideProduct();
                  context.go(AppRoutes.home);
                },
              ),
              const SizedBox(height: AppSpacing.xl),
            ],
          ),
        ),
      ),
    );
  }
}
