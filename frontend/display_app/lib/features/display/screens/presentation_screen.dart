import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_icons.dart';
import '../../../core/theme/app_motion.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../models/presentation_state.dart';
import '../../../models/product.dart';
import '../../../widgets/network_photo.dart';
import '../display_controller.dart';

/// Renders the product currently presented by the salesperson, reproducing
/// every synchronized interaction (colour, image, zoom, pan, AI notes, video)
/// from the [ProductPresentation] state — never mirroring the phone screen.
class PresentationScreen extends StatelessWidget {
  const PresentationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final DisplayController ctrl = context.watch<DisplayController>();
    final ProductPresentation? p = ctrl.presentation;
    final Product? product = ctrl.product;
    if (p == null || product == null) return ColoredBox(color: c.background);

    final ProductVariant variant = product.variantById(p.variantId);
    final List<ProductMedia> images = variant.images;
    final String? image = images.isEmpty
        ? null
        : images[p.imageIndex.clamp(0, images.length - 1)].url;
    final bool isVideo = p.view == PresentationView.video;
    final bool isGallery = p.view == PresentationView.gallery;

    return ColoredBox(
      color: c.background,
      child: Row(
        children: <Widget>[
          Expanded(
            flex: 6,
            child: Stack(
              fit: StackFit.expand,
              children: <Widget>[
                AnimatedSwitcher(
                  duration: AppMotion.display,
                  child: isGallery
                      ? _GalleryStage(
                          key: const ValueKey<String>('gallery'),
                          images: images,
                        )
                      : isVideo
                      ? _VideoStage(
                          key: const ValueKey<String>('video'),
                          poster: image,
                          playing: p.videoPlaying,
                        )
                      : Transform.translate(
                          key: ValueKey<String>(
                            '${p.variantId}-${p.imageIndex}',
                          ),
                          offset: Offset(p.panX * 60, p.panY * 60),
                          child: Transform.scale(
                            scale: p.zoom,
                            child: NetworkPhoto(url: image),
                          ),
                        ),
                ),
                if (!isVideo && !isGallery && images.length > 1)
                  Positioned(
                    left: AppSpacing.xl,
                    bottom: AppSpacing.xl,
                    child: _ImageDots(
                      count: images.length,
                      index: p.imageIndex,
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            flex: 4,
            child: _InfoPanel(
              product: product,
              variant: variant,
              showAI: p.showAIHighlights,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoPanel extends StatelessWidget {
  const _InfoPanel({
    required this.product,
    required this.variant,
    required this.showAI,
  });

  final Product product;
  final ProductVariant variant;
  final bool showAI;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Container(
      color: c.surface,
      padding: const EdgeInsets.all(AppSpacing.giant),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(product.brand, style: AppTypography.eyebrow(c.accent)),
          const SizedBox(height: AppSpacing.md),
          Text(product.name, style: t.displaySmall),
          const SizedBox(height: AppSpacing.sm),
          Text(
            (variant.price ?? product.price).formatted,
            style: t.headlineSmall,
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            product.description,
            style: t.titleMedium?.copyWith(
              color: c.textSecondary,
              fontWeight: FontWeight.w400,
              height: 1.5,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'COLOUR — ${variant.colorName}',
            style: AppTypography.eyebrow(c.textSecondary),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: <Widget>[
              for (final ProductVariant v in product.variants)
                Padding(
                  padding: const EdgeInsets.only(right: AppSpacing.sm),
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _hex(v.colorHex),
                      border: Border.all(
                        color: v.id == variant.id ? c.accent : c.border,
                        width: v.id == variant.id ? 2 : 1,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          AnimatedSize(
            duration: AppMotion.base,
            curve: AppMotion.standard,
            alignment: Alignment.topLeft,
            child: showAI && product.aiHighlights.isNotEmpty
                ? Padding(
                    padding: const EdgeInsets.only(top: AppSpacing.xl),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Row(
                          children: <Widget>[
                            Icon(AppIcons.sparkle, size: 16, color: c.accent),
                            const SizedBox(width: AppSpacing.xs),
                            Text(
                              'ATELIER NOTES',
                              style: AppTypography.eyebrow(c.accent),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        for (final String h in product.aiHighlights)
                          Padding(
                            padding: const EdgeInsets.only(
                              bottom: AppSpacing.xs,
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: <Widget>[
                                Text(
                                  '—  ',
                                  style: t.bodyLarge?.copyWith(color: c.accent),
                                ),
                                Expanded(child: Text(h, style: t.bodyLarge)),
                              ],
                            ),
                          ),
                      ],
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Color _hex(String hex) =>
      Color(int.parse('FF${hex.replaceFirst('#', '')}', radix: 16));
}

class _VideoStage extends StatelessWidget {
  const _VideoStage({required this.poster, required this.playing, super.key});

  final String? poster;
  final bool playing;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: <Widget>[
        NetworkPhoto(url: poster),
        const DecoratedBox(decoration: BoxDecoration(color: Color(0x55000000))),
        Center(
          child: Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white54),
            ),
            child: Icon(
              playing ? AppIcons.pause : AppIcons.play,
              color: Colors.white,
              size: 48,
            ),
          ),
        ),
      ],
    );
  }
}

class _GalleryStage extends StatelessWidget {
  const _GalleryStage({required this.images, super.key});

  final List<ProductMedia> images;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: AppSpacing.md,
          mainAxisSpacing: AppSpacing.md,
          childAspectRatio: 0.8,
        ),
        itemCount: images.length,
        itemBuilder: (_, int i) => DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: AppRadius.brLg,
            border: Border.all(color: c.border),
          ),
          child: NetworkPhoto(url: images[i].url, borderRadius: AppRadius.brLg),
        ),
      ),
    );
  }
}

class _ImageDots extends StatelessWidget {
  const _ImageDots({required this.count, required this.index});

  final int count;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        for (int i = 0; i < count; i++)
          AnimatedContainer(
            duration: AppMotion.base,
            margin: const EdgeInsets.only(right: 6),
            width: i == index ? 28 : 8,
            height: 8,
            decoration: BoxDecoration(
              color: i == index ? Colors.white : Colors.white54,
              borderRadius: AppRadius.brPill,
            ),
          ),
      ],
    );
  }
}
