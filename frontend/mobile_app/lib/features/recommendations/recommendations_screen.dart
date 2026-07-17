import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_icons.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../data/catalog_repository.dart';
import '../../data/journey_logger.dart';
import '../../models/product.dart';
import '../../widgets/product_card.dart';
import '../../widgets/state_views.dart';
import '../auth/auth_controller.dart';
import '../connection/connection_controller.dart';
import '../onboarding/onboarding_controller.dart';
import '../presentation/presentation_controller.dart';
import '../presentation/widgets/live_preview.dart';

/// Curated picks matched to the guest's onboarding profile (gender · personality
/// · age range) against the enriched catalog attributes. The associate can push
/// any pick straight to the display.
class RecommendationsScreen extends StatefulWidget {
  const RecommendationsScreen({super.key});

  @override
  State<RecommendationsScreen> createState() => _RecommendationsScreenState();
}

class _RecommendationsScreenState extends State<RecommendationsScreen> {
  late Future<List<Product>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
    // Record that the associate opened recommendations for this guest.
    context.read<JourneyLogger>().log(
      eventType: 'recommendations_opened',
      token: context.read<AuthController>().token,
      sessionId: context.read<ConnectionController>().session?.sessionId,
      refId: context.read<OnboardingController>().customer?.id,
    );
  }

  Future<List<Product>> _load() {
    final customer = context.read<OnboardingController>().customer;
    return context.read<CatalogRepository>().recommendations(
      customerId: customer?.id,
      gender: customer?.gender,
      ageRange: customer?.ageRange,
      personality: customer?.personality,
    );
  }

  void _present(Product product) {
    context.read<PresentationController>().showProduct(
      product,
      size: product.defaultVariant.sizes.firstOrNull,
    );
    LivePreviewSheet.show(context);
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final bool connected = context.watch<ConnectionController>().liveLink;
    final String? name = context.read<OnboardingController>().customer?.name;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(AppIcons.back, size: 18),
          onPressed: () => context.pop(),
        ),
        title: Text('Recommendations', style: t.titleLarge),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.xl,
              AppSpacing.sm,
              AppSpacing.xl,
              AppSpacing.xs,
            ),
            child: Text(
              name == null ? 'Curated for your guest' : 'Curated for $name',
              style: AppTypography.eyebrow(c.accent),
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Product>>(
              future: _future,
              builder: (BuildContext ctx, AsyncSnapshot<List<Product>> snap) {
                if (snap.connectionState != ConnectionState.done) {
                  return const LoadingView(label: 'Matching the look…');
                }
                final List<Product> items = snap.data ?? const <Product>[];
                if (items.isEmpty) {
                  return const EmptyStateView(
                    title: 'No matches yet',
                    message:
                        'Capture a guest profile or add enriched products.',
                    icon: AppIcons.sparkle,
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
                  itemCount: items.length,
                  itemBuilder: (BuildContext _, int i) {
                    final Product product = items[i];
                    return ProductCard(
                      product: product,
                      onTap: () => ctx.push(AppRoutes.product, extra: product),
                      onPresent: connected ? () => _present(product) : null,
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
