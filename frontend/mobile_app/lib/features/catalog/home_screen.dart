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
import '../auth/auth_controller.dart';
import '../cart/cart_controller.dart';
import '../connection/connection_controller.dart';
import '../presentation/presentation_controller.dart';
import '../presentation/widgets/live_preview.dart';
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
                        Row(
                          children: <Widget>[
                            Flexible(
                              child: Text('Ebani', style: t.headlineMedium),
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            _StatusBadge(connected: conn.liveLink),
                          ],
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(AppIcons.sparkle),
                    iconSize: 24,
                    tooltip: 'Recommendations',
                    color: c.accent,
                    onPressed: () => context.push(AppRoutes.recommendations),
                  ),
                  _CartButton(
                    count: cart.cart.count,
                    onTap: () => context.push(AppRoutes.cart),
                  ),
                  IconButton(
                    icon: const Icon(AppIcons.logout),
                    iconSize: 22,
                    tooltip: 'Log out',
                    color: c.textSecondary,
                    onPressed: () => _confirmLogout(context),
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
            Expanded(
              child: _Grid(catalog: catalog, connected: conn.liveLink),
            ),
          ],
        ),
      ),
      bottomNavigationBar: conn.isConnected ? const NowShowingBar() : null,
    );
  }
}

Future<void> _confirmLogout(BuildContext context) async {
  final bool ok =
      await showDialog<bool>(
        context: context,
        builder: (BuildContext ctx) => AlertDialog(
          title: const Text('Log out?'),
          content: const Text(
            'This ends the current session and signs you out.',
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Log out'),
            ),
          ],
        ),
      ) ??
      false;
  if (!ok || !context.mounted) return;
  // End the live session (frees the display) then sign out → router → login.
  context.read<ConnectionController>().disconnect();
  await context.read<AuthController>().logout();
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

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.connected});

  final bool connected;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final Color color = connected ? c.success : c.textTertiary;
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.xs,
        vertical: 3,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(
            connected ? AppIcons.connected : AppIcons.disconnect,
            size: 12,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            connected ? 'LIVE' : 'OFFLINE',
            style: AppTypography.eyebrow(color).copyWith(fontSize: 9),
          ),
        ],
      ),
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
  const _Grid({required this.catalog, required this.connected});

  final CatalogController catalog;
  final bool connected;

  void _present(BuildContext context, Product product) {
    context.read<PresentationController>().showProduct(
      product,
      size: product.defaultVariant.sizes.firstOrNull,
    );
    LivePreviewSheet.show(context);
  }

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
      // Still pullable so the associate can fetch newly added products.
      return RefreshIndicator(
        onRefresh: () => context.read<CatalogController>().refresh(),
        child: LayoutBuilder(
          builder: (BuildContext ctx, BoxConstraints constraints) =>
              SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: const EmptyStateView(
                    title: 'Nothing found',
                    message: 'Pull down to refresh, or try another search.',
                    icon: AppIcons.search,
                  ),
                ),
              ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => context.read<CatalogController>().refresh(),
      child: GridView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
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
        itemBuilder: (BuildContext ctx, int i) {
          final Product product = catalog.products[i];
          return ProductCard(
            product: product,
            onTap: () => ctx.push(AppRoutes.product, extra: product),
            onPresent: connected ? () => _present(ctx, product) : null,
          );
        },
      ),
    );
  }
}
