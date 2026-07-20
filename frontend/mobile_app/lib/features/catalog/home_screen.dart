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
import '../../widgets/initials_avatar.dart';
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
    final ConnectionController conn = context.watch<ConnectionController>();

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => context.read<CatalogController>().refresh(),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            // Flipkart-style: the brand bar, search and filters scroll away when
            // you scroll down to browse, and snap back the instant you scroll up.
            slivers: <Widget>[
              SliverAppBar(
                floating: true,
                snap: true,
                pinned: false,
                backgroundColor: c.background,
                surfaceTintColor: Colors.transparent,
                elevation: 0,
                titleSpacing: AppSpacing.xl,
                toolbarHeight: 76,
                automaticallyImplyLeading: false,
                title: Row(
                  children: <Widget>[
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
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
                                child: Text('Ebani', style: t.headlineSmall),
                              ),
                              const SizedBox(width: AppSpacing.sm),
                              _StatusBadge(connected: conn.liveLink),
                            ],
                          ),
                        ],
                      ),
                    ),
                    _SavedOutfitsButton(
                      count: context.watch<CartController>().cart.count,
                      onTap: () => context.push(AppRoutes.cart),
                    ),
                    // Customer profiles, recommendations and sign out live
                    // inside the profile hub.
                    IconButton(
                      icon: InitialsAvatar(
                        name: context
                            .watch<AuthController>()
                            .salesperson
                            ?.name,
                        radius: 15,
                      ),
                      tooltip: 'Profile',
                      onPressed: () => context.push(AppRoutes.profile),
                    ),
                  ],
                ),
                bottom: PreferredSize(
                  preferredSize: const Size.fromHeight(58),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.md,
                      0,
                      AppSpacing.md,
                      AppSpacing.sm,
                    ),
                    child: TextField(
                      onChanged: (String q) =>
                          context.read<CatalogController>().search(q),
                      decoration: InputDecoration(
                        hintText: 'Search the atelier…',
                        prefixIcon: const Icon(AppIcons.search),
                      ),
                    ),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Column(
                  children: <Widget>[
                    const SizedBox(height: AppSpacing.sm),
                    _CategoryBar(
                      categories: catalog.categories,
                      selectedId: catalog.selectedCategoryId,
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    _ColorExplorer(
                      products: catalog.products,
                      connected: conn.liveLink,
                    ),
                  ],
                ),
              ),
              _ProductsSliver(catalog: catalog, connected: conn.liveLink),
            ],
          ),
        ),
      ),
      bottomNavigationBar: conn.isConnected ? const NowShowingBar() : null,
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

/// Colour selector: a row of swatches; picking one expands a panel listing every
/// piece available in that colour (filtered from the loaded catalogue). Tap again
/// to collapse.
class _ColorExplorer extends StatefulWidget {
  const _ColorExplorer({required this.products, required this.connected});

  final List<Product> products;
  final bool connected;

  @override
  State<_ColorExplorer> createState() => _ColorExplorerState();
}

class _ColorExplorerState extends State<_ColorExplorer> {
  String? _selected;

  void _present(BuildContext context, Product product) {
    context.read<PresentationController>().showProduct(
      product,
      size: product.defaultVariant.sizes.firstOrNull,
    );
    LivePreviewSheet.show(context);
  }

  Color _hex(String hex) {
    final String h = hex.replaceFirst('#', '').padLeft(6, '0');
    return Color(int.parse('FF$h', radix: 16));
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;

    // Distinct, real colours across the loaded catalogue (skip placeholders).
    final Map<String, String> swatches = <String, String>{};
    for (final Product p in widget.products) {
      for (final ProductVariant v in p.variants) {
        if (v.colorName.isEmpty || v.colorName.toLowerCase() == 'default') {
          continue;
        }
        swatches.putIfAbsent(v.colorName, () => v.colorHex);
      }
    }
    if (swatches.isEmpty) return const SizedBox.shrink();

    final List<Product> matches = _selected == null
        ? const <Product>[]
        : widget.products
              .where(
                (Product p) => p.variants.any(
                  (ProductVariant v) => v.colorName == _selected,
                ),
              )
              .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        SizedBox(
          height: 40,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            children: <Widget>[
              for (final MapEntry<String, String> e in swatches.entries)
                Padding(
                  padding: const EdgeInsets.only(right: AppSpacing.sm),
                  child: _Swatch(
                    color: _hex(e.value),
                    selected: _selected == e.key,
                    onTap: () => setState(
                      () => _selected = _selected == e.key ? null : e.key,
                    ),
                  ),
                ),
            ],
          ),
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 240),
          curve: Curves.easeInOut,
          alignment: Alignment.topCenter,
          child: _selected == null
              ? const SizedBox(width: double.infinity)
              : Padding(
                  padding: const EdgeInsets.only(top: AppSpacing.xs),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md,
                        ),
                        child: Text(
                          '$_selected · ${matches.length} '
                          'piece${matches.length == 1 ? '' : 's'}',
                          style: AppTypography.eyebrow(c.accent),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      SizedBox(
                        height: 268,
                        child: matches.isEmpty
                            ? Center(
                                child: Text(
                                  'No pieces in this colour',
                                  style: t.bodyMedium?.copyWith(
                                    color: c.textSecondary,
                                  ),
                                ),
                              )
                            : ListView.separated(
                                scrollDirection: Axis.horizontal,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.md,
                                ),
                                itemCount: matches.length,
                                separatorBuilder: (_, _) =>
                                    const SizedBox(width: AppSpacing.md),
                                itemBuilder: (BuildContext ctx, int i) {
                                  final Product product = matches[i];
                                  return SizedBox(
                                    width: 150,
                                    child: ProductCard(
                                      product: product,
                                      onTap: () => ctx.push(
                                        AppRoutes.product,
                                        extra: product,
                                      ),
                                      onPresent: widget.connected
                                          ? () => _present(ctx, product)
                                          : null,
                                    ),
                                  );
                                },
                              ),
                      ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}

class _Swatch extends StatelessWidget {
  const _Swatch({
    required this.color,
    required this.selected,
    required this.onTap,
  });

  final Color color;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(
            color: selected ? c.accent : c.border,
            width: selected ? 3 : 1,
          ),
        ),
      ),
    );
  }
}

/// The product grid as a sliver, so it shares one scroll view with the
/// collapsing header (Flipkart-style). Loading/error/empty render as a filled
/// remaining region so pull-to-refresh still works.
class _ProductsSliver extends StatelessWidget {
  const _ProductsSliver({required this.catalog, required this.connected});

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
      return const SliverFillRemaining(
        hasScrollBody: false,
        child: LoadingView(label: 'Curating…'),
      );
    }
    if (catalog.state == LoadState.error) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: ErrorStateView(
          message: catalog.error ?? 'Please try again.',
          onRetry: () => context.read<CatalogController>().load(),
        ),
      );
    }
    if (catalog.products.isEmpty) {
      return const SliverFillRemaining(
        hasScrollBody: false,
        child: EmptyStateView(
          title: 'Nothing found',
          message: 'Pull down to refresh, or try another search.',
          icon: AppIcons.search,
        ),
      );
    }
    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.xs,
        AppSpacing.md,
        AppSpacing.xl,
      ),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.56,
          crossAxisSpacing: AppSpacing.md,
          mainAxisSpacing: AppSpacing.lg,
        ),
        delegate: SliverChildBuilderDelegate((BuildContext ctx, int i) {
          final Product product = catalog.products[i];
          return ProductCard(
            product: product,
            onTap: () => ctx.push(AppRoutes.product, extra: product),
            onPresent: connected ? () => _present(ctx, product) : null,
          );
        }, childCount: catalog.products.length),
      ),
    );
  }
}

/// Quick access to the guest's saved outfits, with a live count badge.
class _SavedOutfitsButton extends StatelessWidget {
  const _SavedOutfitsButton({required this.count, required this.onTap});

  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return Stack(
      children: <Widget>[
        IconButton(
          icon: const Icon(AppIcons.cart),
          iconSize: 24,
          tooltip: 'Saved outfits',
          onPressed: onTap,
        ),
        if (count > 0)
          Positioned(
            right: 4,
            top: 4,
            child: Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(color: c.accent, shape: BoxShape.circle),
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
