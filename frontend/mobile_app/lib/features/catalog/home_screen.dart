import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_icons.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../models/category.dart';
import '../../models/product.dart';
import '../../widgets/product_card.dart';
import '../../widgets/state_views.dart';
import '../cart/cart_controller.dart';
import '../connection/connection_controller.dart';
import '../presentation/widgets/now_showing_bar.dart';
import 'catalog_controller.dart';

/// Private browsing home: search, categories, and the collection grid. Nothing
/// here reaches the display until the salesperson presses "Show on Screen".
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final CatalogController catalog = context.watch<CatalogController>();
    final CartController cart = context.watch<CartController>();
    final ConnectionController conn = context.watch<ConnectionController>();

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.xl,
                AppSpacing.md,
                AppSpacing.md,
                AppSpacing.xs,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          'THE COLLECTION',
                          style: AppTypography.eyebrow(c.accent),
                        ),
                        const SizedBox(height: 2),
                        Text('Maison Ébani', style: t.headlineMedium),
                      ],
                    ),
                  ),
                  _CartButton(
                    count: cart.cart.count,
                    onTap: () => context.push(AppRoutes.cart),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: TextField(
                onChanged: (String q) =>
                    context.read<CatalogController>().search(q),
                decoration: InputDecoration(
                  hintText: 'Search the atelier…',
                  prefixIcon: const Icon(AppIcons.search),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            _CategoryBar(
              categories: catalog.categories,
              selectedId: catalog.selectedCategoryId,
            ),
            const SizedBox(height: AppSpacing.xs),
            Expanded(child: _Grid(catalog: catalog)),
          ],
        ),
      ),
      bottomNavigationBar: conn.isConnected ? const NowShowingBar() : null,
    );
  }
}

class _CartButton extends StatelessWidget {
  const _CartButton({required this.count, required this.onTap});

  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return Stack(
      children: <Widget>[
        IconButton(
          icon: const Icon(AppIcons.cart),
          iconSize: 26,
          onPressed: onTap,
        ),
        if (count > 0)
          Positioned(
            right: 4,
            top: 4,
            child: Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: c.accent,
                shape: BoxShape.circle,
              ),
              child: Text(
                '$count',
                style: Theme.of(
                  context,
                ).textTheme.labelSmall?.copyWith(color: c.onAccent),
              ),
            ),
          ),
      ],
    );
  }
}

class _CategoryBar extends StatelessWidget {
  const _CategoryBar({required this.categories, required this.selectedId});

  final List<Category> categories;
  final String? selectedId;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        children: <Widget>[
          _Chip(
            label: 'All',
            selected: selectedId == null,
            onTap: () => context.read<CatalogController>().selectCategory(null),
          ),
          for (final Category cat in categories)
            _Chip(
              label: cat.name,
              selected: selectedId == cat.id,
              onTap: () =>
                  context.read<CatalogController>().selectCategory(cat.id),
            ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.xs),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        showCheckmark: false,
      ),
    );
  }
}

class _Grid extends StatelessWidget {
  const _Grid({required this.catalog});

  final CatalogController catalog;

  @override
  Widget build(BuildContext context) {
    if (catalog.state == LoadState.loading && catalog.products.isEmpty) {
      return const LoadingView(label: 'Curating…');
    }
    if (catalog.state == LoadState.error) {
      return ErrorStateView(
        message: catalog.error ?? 'Please try again.',
        onRetry: () => context.read<CatalogController>().load(),
      );
    }
    if (catalog.products.isEmpty) {
      return const EmptyStateView(
        title: 'Nothing found',
        message: 'Try another search or category.',
        icon: AppIcons.search,
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.xs,
        AppSpacing.md,
        AppSpacing.xl,
      ),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.56,
        crossAxisSpacing: AppSpacing.md,
        mainAxisSpacing: AppSpacing.lg,
      ),
      itemCount: catalog.products.length,
      itemBuilder: (_, int i) {
        final Product product = catalog.products[i];
        return ProductCard(
          product: product,
          onTap: () => context.push(AppRoutes.product, extra: product),
        );
      },
    );
  }
}
