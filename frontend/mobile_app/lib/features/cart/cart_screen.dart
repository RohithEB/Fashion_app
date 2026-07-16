import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_icons.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../models/cart.dart';
import '../../widgets/app_button.dart';
import '../../widgets/network_photo.dart';
import '../../widgets/state_views.dart';
import '../presentation/presentation_controller.dart';
import '../presentation/widgets/live_preview.dart';
import 'cart_controller.dart';

/// The cart doubles as the salesperson's **shortlist and on-screen selector**:
/// each line can be pushed to the display with one tap ("Present"), so the
/// associate can help a client compare shortlisted looks live.
class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final TextTheme t = Theme.of(context).textTheme;
    final CartController cart = context.watch<CartController>();
    final Cart data = cart.cart;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(AppIcons.back, size: 18),
          onPressed: () => context.pop(),
        ),
        title: Text('Cart & Shortlist', style: t.titleLarge),
      ),
      body: data.isEmpty
          ? const EmptyStateView(
              title: 'Your shortlist is empty',
              message: 'Add pieces to compare them live on the display.',
              icon: AppIcons.cart,
            )
          : ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.md),
              itemCount: data.items.length,
              separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
              itemBuilder: (_, int i) => _CartTile(item: data.items[i]),
            ),
      bottomNavigationBar: data.isEmpty ? null : _Summary(cart: data),
    );
  }
}

class _CartTile extends StatelessWidget {
  const _CartTile({required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final PresentationController pres = context.watch<PresentationController>();
    final bool presenting = pres.presentation?.productId == item.product.id &&
        pres.presentation?.variantId == item.variantId;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.xs),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadius.brLg,
        border: Border.all(color: presenting ? c.accent : c.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          ClipRRect(
            borderRadius: AppRadius.brMd,
            child: SizedBox(
              width: 72,
              height: 92,
              child: NetworkPhoto(url: item.variant.images.firstOrNull?.url),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const SizedBox(height: AppSpacing.xxs),
                Text(item.product.name, style: t.titleSmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(
                  '${item.variant.colorName}  ·  ${item.size}',
                  style: t.bodySmall?.copyWith(color: c.textSecondary),
                ),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: <Widget>[
                    _Stepper(item: item),
                    const Spacer(),
                    Text(item.lineTotal.formatted, style: t.titleSmall),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: AppButton(
                        label: presenting ? 'On screen' : 'Present',
                        icon: presenting ? AppIcons.connected : AppIcons.showOnScreen,
                        size: AppButtonSize.small,
                        variant: presenting
                            ? AppButtonVariant.secondary
                            : AppButtonVariant.primary,
                        onPressed: presenting
                            ? () => LivePreviewSheet.show(context)
                            : () {
                                context.read<PresentationController>().showProduct(
                                      item.product,
                                      variantId: item.variantId,
                                    );
                                LivePreviewSheet.show(context);
                              },
                      ),
                    ),
                    IconButton(
                      icon: Icon(AppIcons.delete, color: c.textTertiary),
                      onPressed: () =>
                          context.read<CartController>().removeItem(item.lineId),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Stepper extends StatelessWidget {
  const _Stepper({required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final CartController ctrl = context.read<CartController>();
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: c.border),
        borderRadius: AppRadius.brPill,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          _StepButton(
            icon: AppIcons.remove,
            onTap: () => ctrl.setQuantity(item.lineId, item.quantity - 1),
          ),
          Text('${item.quantity}', style: Theme.of(context).textTheme.titleSmall),
          _StepButton(
            icon: AppIcons.add,
            onTap: () => ctrl.setQuantity(item.lineId, item.quantity + 1),
          ),
        ],
      ),
    );
  }
}

class _StepButton extends StatelessWidget {
  const _StepButton({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkResponse(
        onTap: onTap,
        radius: 20,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xs),
          child: Icon(icon, size: 16),
        ),
      );
}

class _Summary extends StatelessWidget {
  const _Summary({required this.cart});

  final Cart cart;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Container(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.md,
        AppSpacing.md,
        MediaQuery.of(context).padding.bottom + AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border(top: BorderSide(color: c.border)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          _row(context, 'Subtotal', cart.subtotal.formatted),
          if (cart.discountRate > 0) _row(context, 'Discount', '-${cart.discount.formatted}'),
          _row(context, 'Tax', cart.tax.formatted),
          const SizedBox(height: AppSpacing.xs),
          Divider(color: c.divider),
          const SizedBox(height: AppSpacing.xs),
          Row(
            children: <Widget>[
              Text('Total', style: t.titleMedium),
              const Spacer(),
              Text(cart.total.formatted, style: t.titleLarge),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          AppButton(
            label: 'Checkout',
            icon: AppIcons.checkout,
            expand: true,
            onPressed: () => context.push(AppRoutes.checkout),
          ),
        ],
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
