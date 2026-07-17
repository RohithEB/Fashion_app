import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_icons.dart';
import '../../core/theme/app_motion.dart';
import '../../core/theme/app_spacing.dart';
import '../../models/order.dart';
import '../../widgets/app_button.dart';
import '../connection/connection_controller.dart';
import '../presentation/presentation_controller.dart';

/// Payment confirmation. The display simultaneously shows its Thank-You screen
/// (driven by the `paymentSuccess` event). When an [order] is provided, its
/// reference and total are shown as proof the sale was recorded.
class PaymentSuccessScreen extends StatelessWidget {
  const PaymentSuccessScreen({super.key, this.order});

  final Order? order;

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
              if (order != null) ...<Widget>[
                const SizedBox(height: AppSpacing.xl),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  decoration: BoxDecoration(
                    color: c.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: c.border),
                  ),
                  child: Column(
                    children: <Widget>[
                      _detailRow(context, 'Order', '#${order!.id}'),
                      const SizedBox(height: AppSpacing.xs),
                      _detailRow(context, 'Items', '${order!.itemCount}'),
                      if (order!.customerName != null) ...<Widget>[
                        const SizedBox(height: AppSpacing.xs),
                        _detailRow(context, 'Customer', order!.customerName!),
                      ],
                      const SizedBox(height: AppSpacing.xs),
                      _detailRow(
                        context,
                        'Total',
                        order!.total.formatted,
                        emphasize: true,
                      ),
                    ],
                  ),
                ),
              ],
              const Spacer(flex: 3),
              AppButton(
                label: 'Go to QR screen',
                icon: AppIcons.qrCode,
                expand: true,
                // End the session: the server frees the display and pushes a
                // fresh pairing QR to the big screen, ready for the next guest.
                // The router then returns this device to the pairing screen.
                onPressed: () {
                  context.read<PresentationController>().hideProduct();
                  context.read<ConnectionController>().endSession();
                },
              ),
              const SizedBox(height: AppSpacing.sm),
              TextButton(
                onPressed: () {
                  context.read<PresentationController>().hideProduct();
                  context.go(AppRoutes.home);
                },
                child: Text(
                  'Continue with this guest',
                  style: t.bodyMedium?.copyWith(color: c.textSecondary),
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailRow(
    BuildContext context,
    String label,
    String value, {
    bool emphasize = false,
  }) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Row(
      children: <Widget>[
        Text(label, style: t.bodyMedium?.copyWith(color: c.textSecondary)),
        const Spacer(),
        Text(
          value,
          style: emphasize
              ? t.titleMedium
              : t.bodyMedium?.copyWith(color: c.textPrimary),
        ),
      ],
    );
  }
}
