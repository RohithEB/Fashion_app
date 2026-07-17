import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../models/product.dart';
import '../../../widgets/network_photo.dart';
import '../display_controller.dart';

/// The full collection shown on the display as a grid — pushed by the controller
/// right after onboarding. The customer only *views* it here; all search/sort
/// controls live on the salesperson's device. A tap on the controller swaps this
/// for the focused presentation of a single product.
class CatalogScreen extends StatelessWidget {
  const CatalogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final List<Product> products = context
        .select<DisplayController, List<Product>>(
          (DisplayController ctrl) => ctrl.catalog,
        );

    return Container(
      color: c.background,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text('THE COLLECTION', style: AppTypography.eyebrow(c.accent)),
              const SizedBox(height: AppSpacing.xs),
              Text('Explore the atelier', style: t.displaySmall),
              const SizedBox(height: AppSpacing.lg),
              Expanded(
                child: products.isEmpty
                    ? Center(
                        child: Text(
                          'Preparing the collection…',
                          style: t.bodyLarge?.copyWith(color: c.textSecondary),
                        ),
                      )
                    : LayoutBuilder(
                        builder: (BuildContext ctx, BoxConstraints box) {
                          final int columns = box.maxWidth > 900 ? 4 : 2;
                          return GridView.builder(
                            gridDelegate:
                                SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: columns,
                                  crossAxisSpacing: AppSpacing.md,
                                  mainAxisSpacing: AppSpacing.lg,
                                  childAspectRatio: 0.62,
                                ),
                            itemCount: products.length,
                            itemBuilder: (_, int i) =>
                                _CatalogCard(product: products[i]),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CatalogCard extends StatelessWidget {
  const _CatalogCard({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Expanded(
          child: NetworkPhoto(
            url: product.heroImage,
            borderRadius: AppRadius.brLg,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(product.brand, style: AppTypography.eyebrow(c.textTertiary)),
        const SizedBox(height: 2),
        Text(
          product.name,
          style: t.titleSmall,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 2),
        Text(
          product.price.formatted,
          style: t.bodyMedium?.copyWith(color: c.textSecondary),
        ),
      ],
    );
  }
}
