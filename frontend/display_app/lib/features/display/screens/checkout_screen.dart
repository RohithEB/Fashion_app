import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_icons.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../widgets/network_photo.dart';
import '../display_controller.dart';

/// Read-only checkout review mirrored from the controller: the order the
/// associate is completing (line items, quantities, totals). Follows the client
/// along from the cart through to the thank-you screen. Updated live from the
/// [DisplayController.checkoutView] payload.
class CheckoutScreen extends StatelessWidget {
  const CheckoutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final Map<String, dynamic>? order = context
        .select<DisplayController, Map<String, dynamic>?>(
          (DisplayController ctrl) => ctrl.checkoutView,
        );

    final List<dynamic> items =
        (order?['items'] as List<dynamic>?) ?? const <dynamic>[];
    final String? customerName = order?['customerName'] as String?;

    return Container(
      color: c.background,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Icon(AppIcons.checkout, size: 18, color: c.accent),
                  const SizedBox(width: AppSpacing.xs),
                  Text(
                    'COMPLETING YOUR PURCHASE',
                    style: AppTypography.eyebrow(c.accent),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                customerName == null ? 'Your order' : "$customerName's order",
                style: t.displaySmall,
              ),
              const SizedBox(height: AppSpacing.lg),
              Expanded(
                child: items.isEmpty
                    ? Center(
                        child: Text(
                          'Preparing your order…',
                          style: t.bodyLarge?.copyWith(color: c.textSecondary),
                        ),
                      )
                    : ListView.separated(
                        itemCount: items.length,
                        separatorBuilder: (_, _) =>
                            const SizedBox(height: AppSpacing.md),
                        itemBuilder: (_, int i) =>
                            _OrderLine(item: items[i] as Map<String, dynamic>),
                      ),
              ),
              if (order != null && items.isNotEmpty) _Summary(order: order),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrderLine extends StatelessWidget {
  const _OrderLine({required this.item});

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
                    if (item['size'] != null) 'Size ${item['size']}',
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
  const _Summary({required this.order});

  final Map<String, dynamic> order;

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
          row('Subtotal', order['subtotal'] as String?),
          row('Tax', order['tax'] as String?),
          Divider(color: c.divider, height: AppSpacing.lg),
          row('Total', order['total'] as String?, emphasize: true),
        ],
      ),
    );
  }
}
