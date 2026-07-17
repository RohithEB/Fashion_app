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
import '../../data/checkout_repository.dart';
import '../../models/order.dart';
import '../../models/ws_event.dart';
import '../../widgets/app_button.dart';
import '../auth/auth_controller.dart';
import '../cart/cart_controller.dart';
import '../connection/connection_controller.dart';

/// Checkout summary + confirm. Confirming **persists the order** through the
/// backend (`POST /api/cart/:sessionId/checkout`) — cart lines, quantities,
/// totals, and any captured customer — then notifies the display and completes
/// the session. In standalone mode a mock repository completes the sale locally.
class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final TextEditingController _customerName = TextEditingController();
  final TextEditingController _customerMobile = TextEditingController();
  bool _processing = false;

  @override
  void dispose() {
    _customerName.dispose();
    _customerMobile.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    final CartController cartCtrl = context.read<CartController>();
    if (cartCtrl.cart.isEmpty) return;

    final RealtimeService realtime = context.read<RealtimeService>();
    final ConnectionController conn = context.read<ConnectionController>();
    final AuthController auth = context.read<AuthController>();
    final CheckoutRepository repo = context.read<CheckoutRepository>();

    final String? token = auth.token;
    if (token == null) {
      _showError('Your session expired. Please sign in again.');
      return;
    }

    setState(() => _processing = true);
    final String sessionId = conn.session?.sessionId ?? 'no-session';

    // Notify the display it is authorising (drives its thank-you sequence).
    realtime.emit(WsEvent(type: WsEventType.checkout, sessionId: sessionId));

    try {
      final Order order = await repo.checkout(
        sessionId: sessionId,
        token: token,
        cart: cartCtrl.cart,
        customer: CustomerDraft(
          name: _customerName.text,
          mobile: _customerMobile.text,
        ),
      );
      if (!mounted) return;
      realtime.emit(
        WsEvent(type: WsEventType.paymentSuccess, sessionId: sessionId),
      );
      cartCtrl.clear();
      context.go(AppRoutes.success, extra: order);
    } on CheckoutException catch (e) {
      if (!mounted) return;
      setState(() => _processing = false);
      _showError(e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _processing = false);
      _showError('Checkout failed. Please try again.');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
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
          Text('CUSTOMER (OPTIONAL)',
              style: AppTypography.eyebrow(c.textSecondary)),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Attach the client to this order for their records.',
            style: t.bodySmall?.copyWith(color: c.textSecondary),
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: _customerName,
            textCapitalization: TextCapitalization.words,
            enabled: !_processing,
            decoration: const InputDecoration(
              labelText: 'Name',
              prefixIcon: Icon(Icons.person_outline),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: _customerMobile,
            keyboardType: TextInputType.phone,
            enabled: !_processing,
            decoration: const InputDecoration(
              labelText: 'Mobile',
              prefixIcon: Icon(Icons.phone_outlined),
            ),
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
                    'Store Terminal · Demo Gateway',
                    style: t.bodyMedium,
                  ),
                ),
                Icon(AppIcons.check, color: c.success, size: 18),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
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
              ? 'Placing order…'
              : 'Place order · ${cart.cart.total.formatted}',
          icon: AppIcons.payment,
          expand: true,
          isLoading: _processing,
          onPressed: _processing || cart.cart.isEmpty ? null : _confirm,
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
