import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_radius.dart';
import '../core/theme/app_sizes.dart';
import '../core/theme/app_spacing.dart';
import '../core/theme/app_typography.dart';
import '../models/product.dart';
import 'network_photo.dart';

/// Editorial product tile used in the catalog grid.
class ProductCard extends StatelessWidget {
  const ProductCard({required this.product, required this.onTap, super.key});

  final Product product;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Expanded(
            child: Stack(
              children: <Widget>[
                Positioned.fill(
                  child: NetworkPhoto(
                    url: product.heroImage,
                    borderRadius: AppRadius.brLg,
                  ),
                ),
                if (product.isNew)
                  Positioned(
                    top: AppSpacing.xs,
                    left: AppSpacing.xs,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.xs,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: c.background,
                        borderRadius: AppRadius.brPill,
                      ),
                      child: Text('NEW', style: AppTypography.eyebrow(c.textPrimary)),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(product.brand, style: AppTypography.eyebrow(c.textTertiary)),
          const SizedBox(height: 2),
          Text(
            product.name,
            style: t.titleSmall,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Row(
            children: <Widget>[
              Text(product.price.formatted, style: t.bodyMedium),
              const Spacer(),
              _Swatches(product: product),
            ],
          ),
        ],
      ),
    );
  }
}

class _Swatches extends StatelessWidget {
  const _Swatches({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final List<ProductVariant> shown = product.variants.take(4).toList();
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        for (final ProductVariant v in shown)
          Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Container(
              width: AppSizes.iconXs - 4,
              height: AppSizes.iconXs - 4,
              decoration: BoxDecoration(
                color: _hex(v.colorHex),
                shape: BoxShape.circle,
                border: Border.all(color: c.border),
              ),
            ),
          ),
      ],
    );
  }

  Color _hex(String hex) {
    final String h = hex.replaceFirst('#', '');
    return Color(int.parse('FF$h', radix: 16));
  }
}
