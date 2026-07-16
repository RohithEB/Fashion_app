import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_icons.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../models/presentation_state.dart';
import '../../../models/product.dart';
import '../../../widgets/network_photo.dart';
import '../presentation_controller.dart';

/// A faithful mini-mirror of the customer display, rendered from the same
/// [ProductPresentation] state that drives the TV — so the salesperson always
/// sees exactly what the client sees, without mirroring the phone screen.
class LivePreviewSheet extends StatelessWidget {
  const LivePreviewSheet({super.key});

  static Future<void> show(BuildContext context) => showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        builder: (_) => const LivePreviewSheet(),
      );

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Icon(AppIcons.connected, size: 16, color: c.accent),
              const SizedBox(width: AppSpacing.xs),
              Text('CUSTOMER DISPLAY', style: AppTypography.eyebrow(c.textSecondary)),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          AspectRatio(
            aspectRatio: 16 / 9,
            child: ClipRRect(
              borderRadius: AppRadius.brLg,
              child: const DisplayMirror(),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'This is a live mirror of the showroom screen.',
            style: t.bodySmall?.copyWith(color: c.textSecondary),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
      ),
    );
  }
}

/// The rendering surface shared between the preview sheet and (conceptually) the
/// display app: applies zoom/pan and overlays from [ProductPresentation].
class DisplayMirror extends StatelessWidget {
  const DisplayMirror({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors dark = AppColors.dark;
    final PresentationController pres = context.watch<PresentationController>();
    final ProductPresentation? p = pres.presentation;
    final Product? product = pres.product;

    if (p == null || product == null) {
      return ColoredBox(
        color: dark.background,
        child: Center(
          child: Text(
            'Welcome',
            style: AppTypography.textTheme(dark.textPrimary).headlineMedium,
          ),
        ),
      );
    }

    final ProductVariant variant = product.variantById(p.variantId);
    final String? image = variant.images.isEmpty
        ? null
        : variant.images[p.imageIndex.clamp(0, variant.images.length - 1)].url;

    return ColoredBox(
      color: dark.background,
      child: Stack(
        fit: StackFit.expand,
        children: <Widget>[
          Transform.translate(
            offset: Offset(p.panX * 40, p.panY * 40),
            child: Transform.scale(
              scale: p.zoom,
              child: NetworkPhoto(url: image),
            ),
          ),
          if (p.showAIHighlights)
            Positioned(
              left: AppSpacing.md,
              bottom: AppSpacing.md,
              child: _HighlightsOverlay(product: product),
            ),
        ],
      ),
    );
  }
}

class _HighlightsOverlay extends StatelessWidget {
  const _HighlightsOverlay({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final AppColors dark = AppColors.dark;
    return Container(
      constraints: const BoxConstraints(maxWidth: 220),
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: dark.surface.withValues(alpha: 0.82),
        borderRadius: AppRadius.brMd,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text('ATELIER NOTES', style: AppTypography.eyebrow(dark.accent)),
          const SizedBox(height: 4),
          for (final String h in product.aiHighlights.take(3))
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                '— $h',
                style: AppTypography.textTheme(dark.textSecondary).bodySmall,
              ),
            ),
        ],
      ),
    );
  }
}
