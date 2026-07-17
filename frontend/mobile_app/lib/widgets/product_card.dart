import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_icons.dart';
import '../core/theme/app_radius.dart';
import '../core/theme/app_sizes.dart';
import '../core/theme/app_spacing.dart';
import '../core/theme/app_typography.dart';
import '../models/product.dart';
import 'network_photo.dart';

/// Editorial product tile used in the catalog grid. When [onPresent] is given
/// (a display is connected) a quick "view on screen" button overlays the image
/// so the associate can push the product to the TV without opening detail.
class ProductCard extends StatelessWidget {
  const ProductCard({
    required this.product,
    required this.onTap,
    this.onPresent,
    super.key,
  });

  final Product product;
  final VoidCallback onTap;
  final VoidCallback? onPresent;

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
                      child: Text(
                        'NEW',
                        style: AppTypography.eyebrow(c.textPrimary),
                      ),
                    ),
                  ),
                if (onPresent != null)
                  Positioned(
                    top: AppSpacing.xs,
                    right: AppSpacing.xs,
                    child: _PresentButton(onTap: onPresent!),
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

/// Compact overlay action to push this product to the display ("view on screen").
class _PresentButton extends StatelessWidget {
  const _PresentButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return Material(
      color: c.primary,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: Tooltip(
          message: 'View on screen',
          child: SizedBox(
            width: 34,
            height: 34,
            child: Icon(AppIcons.showOnScreen, size: 17, color: c.onPrimary),
          ),
        ),
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
