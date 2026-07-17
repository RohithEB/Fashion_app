import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../widgets/network_photo.dart';
import '../display_controller.dart';

/// Read-only cart page mirrored from the controller: line items with colour/size,
/// quantities, per-line totals, and the order summary. Updated live as the
/// salesperson edits quantities or removes items on their device.
class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final Map<String, dynamic>? cart = context
        .select<DisplayController, Map<String, dynamic>?>(
          (DisplayController ctrl) => ctrl.cartView,
        );

    final List<dynamic> items =
        (cart?['items'] as List<dynamic>?) ?? const <dynamic>[];
    final String? customerName = cart?['customerName'] as String?;

    return Container(
      color: c.background,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text('YOUR SELECTION', style: AppTypography.eyebrow(c.accent)),
              const SizedBox(height: AppSpacing.xs),
              Text(
                customerName == null ? 'The cart' : "$customerName's cart",
                style: t.displaySmall,
              ),
              const SizedBox(height: AppSpacing.lg),
              Expanded(
                child: items.isEmpty
                    ? Center(
                        child: Text(
                          'The cart is empty.',
                          style: t.bodyLarge?.copyWith(color: c.textSecondary),
                        ),
                      )
                    : ListView.separated(
                        itemCount: items.length,
                        separatorBuilder: (_, _) =>
                            const SizedBox(height: AppSpacing.md),
                        itemBuilder: (_, int i) =>
                            _CartLine(item: items[i] as Map<String, dynamic>),
                      ),
              ),
              if (items.isNotEmpty) _Summary(cart: cart!),
            ],
          ),
        ),
      ),
    );
  }
}

class _CartLine extends StatelessWidget {
  const _CartLine({required this.item});

  final Map<String, dynamic> item;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final String? image = item['image'] as String?;
    final int quantity = (item['quantity'] as num?)?.toInt() ?? 1;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadius.brLg,
        border: Border.all(color: c.border),
      ),
      child: Row(
        children: <Widget>[
          ClipRRect(
            borderRadius: AppRadius.brMd,
            child: SizedBox(
              width: 72,
              height: 92,
              child: NetworkPhoto(url: image),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                if (item['brand'] != null)
                  Text(
                    '${item['brand']}',
                    style: AppTypography.eyebrow(c.textTertiary),
                  ),
                Text(
                  '${item['name'] ?? ''}',
                  style: t.titleMedium,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  <String>[
                    if (item['color'] != null) '${item['color']}',
                    if (item['size'] != null) '${item['size']}',
                  ].join('  ·  '),
                  style: t.bodyMedium?.copyWith(color: c.textSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: <Widget>[
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: c.accent.withValues(alpha: 0.14),
                  borderRadius: AppRadius.brPill,
                ),
                child: Text(
                  '×$quantity',
                  style: t.titleSmall?.copyWith(color: c.accent),
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text('${item['lineTotal'] ?? ''}', style: t.titleMedium),
            ],
          ),
        ],
      ),
    );
  }
}

class _Summary extends StatelessWidget {
  const _Summary({required this.cart});

  final Map<String, dynamic> cart;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;

    Widget row(String label, String? value, {bool emphasize = false}) =>
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 3),
          child: Row(
            children: <Widget>[
              Text(
                label,
                style: (emphasize ? t.titleMedium : t.bodyLarge)?.copyWith(
                  color: c.textSecondary,
                ),
              ),
              const Spacer(),
              Text(
                value ?? '',
                style: emphasize ? t.headlineSmall : t.bodyLarge,
              ),
            ],
          ),
        );

    return Container(
      margin: const EdgeInsets.only(top: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadius.brLg,
        border: Border.all(color: c.border),
      ),
      child: Column(
        children: <Widget>[
          row('Subtotal', cart['subtotal'] as String?),
          row('Tax', cart['tax'] as String?),
          Divider(color: c.divider, height: AppSpacing.lg),
          row('Total', cart['total'] as String?, emphasize: true),
        ],
      ),
    );
  }
}
