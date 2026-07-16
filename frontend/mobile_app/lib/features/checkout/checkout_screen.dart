import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/realtime/realtime_service.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_icons.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../models/ws_event.dart';
import '../../widgets/app_button.dart';
import '../cart/cart_controller.dart';
import '../connection/connection_controller.dart';

/// Checkout summary + payment. Payment is a **modular fake gateway** for the
/// POC — the "Pay" action simulates authorization, notifies the display
/// (`checkout` → `paymentSuccess`), and completes the session.
class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  bool _processing = false;

  Future<void> _pay() async {
    setState(() => _processing = true);
    final RealtimeService realtime = context.read<RealtimeService>();
    final ConnectionController conn = context.read<ConnectionController>();
    final String? sid = conn.session?.sessionId;

    realtime.emit(WsEvent(type: WsEventType.checkout, sessionId: sid));
    await Future<void>.delayed(const Duration(milliseconds: 1400));
    realtime.emit(WsEvent(type: WsEventType.paymentSuccess, sessionId: sid));

    if (!mounted) return;
    context.read<CartController>().clear();
    context.go(AppRoutes.success);
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final CartController cart = context.watch<CartController>();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(AppIcons.back, size: 18),
          onPressed: () => context.pop(),
        ),
        title: Text('Checkout', style: t.titleLarge),
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        children: <Widget>[
          Text('ORDER', style: AppTypography.eyebrow(c.textSecondary)),
          const SizedBox(height: AppSpacing.sm),
          ...cart.cart.items.map(
            (i) => Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
              child: Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      '${i.product.name}  ×${i.quantity}',
                      style: t.bodyMedium,
                    ),
                  ),
                  Text(i.lineTotal.formatted, style: t.bodyMedium),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Divider(color: c.divider),
          const SizedBox(height: AppSpacing.md),
          _row(context, 'Subtotal', cart.cart.subtotal.formatted),
          _row(context, 'Tax', cart.cart.tax.formatted),
          const SizedBox(height: AppSpacing.xs),
          Row(
            children: <Widget>[
              Text('Total', style: t.titleMedium),
              const Spacer(),
              Text(cart.cart.total.formatted, style: t.titleLarge),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          Text('PAYMENT', style: AppTypography.eyebrow(c.textSecondary)),
          const SizedBox(height: AppSpacing.sm),
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: AppRadius.brLg,
              border: Border.all(color: c.border),
            ),
            child: Row(
              children: <Widget>[
                Icon(AppIcons.payment, color: c.textSecondary),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    'Boutique Terminal · Fake Gateway',
                    style: t.bodyMedium,
                  ),
                ),
                Icon(AppIcons.check, color: c.success, size: 18),
              ],
            ),
          ),
        ],
      ),
      bottomSheet: Container(
        color: c.background,
        padding: EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.sm,
          AppSpacing.md,
          MediaQuery.of(context).padding.bottom + AppSpacing.sm,
        ),
        child: AppButton(
          label: _processing
              ? 'Processing payment…'
              : 'Pay ${cart.cart.total.formatted}',
          icon: AppIcons.payment,
          expand: true,
          isLoading: _processing,
          onPressed: _processing || cart.cart.isEmpty ? null : _pay,
        ),
      ),
    );
  }

  Widget _row(BuildContext context, String label, String value) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: <Widget>[
          Text(label, style: t.bodyMedium?.copyWith(color: c.textSecondary)),
          const Spacer(),
          Text(value, style: t.bodyMedium),
        ],
      ),
    );
  }
}
