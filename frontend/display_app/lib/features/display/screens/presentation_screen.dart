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
    if (p == null || product == null) {
      // Never blank: show a brand loader while product data resolves.
      return ColoredBox(
        color: c.background,
        child: Center(
          child: SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(strokeWidth: 2, color: c.accent),
          ),
        ),
      );
    }

    final ProductVariant variant = product.variantById(p.variantId);
    final List<ProductMedia> images = variant.images;
    final String? image = images.isEmpty
        ? null
        : images[p.imageIndex.clamp(0, images.length - 1)].url;
    final bool isVideo = p.view == PresentationView.video;
    final bool isGallery = p.view == PresentationView.gallery;

    final Widget stage = Stack(
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
              : _SyncedTransform(
                  key: ValueKey<String>('${p.variantId}-${p.imageIndex}'),
                  scale: p.zoom,
                  panX: p.panX,
                  panY: p.panY,
                  child: NetworkPhoto(url: image),
                ),
        ),
        if (!isVideo && !isGallery && images.length > 1)
          Positioned(
            left: AppSpacing.xl,
            bottom: AppSpacing.xl,
            child: _ImageDots(count: images.length, index: p.imageIndex),
          ),
        // Full labeled details are drawn ON TOP of the image when the associate
        // expands them — they never resize the image or the info panel.
        Positioned.fill(
          child: AnimatedSwitcher(
            duration: AppMotion.base,
            switchInCurve: AppMotion.standard,
            switchOutCurve: AppMotion.standard,
            child: p.detailsExpanded && product.details.isNotEmpty
                ? _DetailsOverlay(
                    key: const ValueKey<String>('details-overlay'),
                    product: product,
                  )
                : const SizedBox.shrink(),
          ),
        ),
      ],
    );

    final Widget info = _InfoPanel(
      product: product,
      variant: variant,
      size: p.size,
      showAI: p.showAIHighlights,
    );

    return ColoredBox(
      color: c.background,
      child: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          final bool portrait = constraints.maxHeight > constraints.maxWidth;
          // Image takes 70%, the info panel 30% (of height in portrait, of
          // width in landscape).
          return portrait
              ? Column(
                  children: <Widget>[
                    Expanded(flex: 7, child: stage),
                    Expanded(flex: 3, child: info),
                  ],
                )
              : Row(
                  children: <Widget>[
                    Expanded(flex: 7, child: stage),
                    Expanded(flex: 3, child: info),
                  ],
                );
        },
      ),
    );
  }
}

class _InfoPanel extends StatelessWidget {
  const _InfoPanel({
    required this.product,
    required this.variant,
    required this.size,
    required this.showAI,
  });

  final Product product;
  final ProductVariant variant;
  final String? size;
  final bool showAI;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Container(
      color: c.surface,
      padding: const EdgeInsets.all(AppSpacing.giant),
      alignment: Alignment.centerLeft,
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
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
              'COLOR — ${variant.colorName}',
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
            if (size != null && size!.isNotEmpty) ...<Widget>[
              const SizedBox(height: AppSpacing.xl),
              Text(
                'SIZE — $size',
                style: AppTypography.eyebrow(c.textSecondary),
              ),
            ],
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
                                'STYLE NOTES',
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
                                    style: t.bodyLarge?.copyWith(
                                      color: c.accent,
                                    ),
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
      ),
    );
  }

  Color _hex(String hex) =>
      Color(int.parse('FF${hex.replaceFirst('#', '')}', radix: 16));
}

/// The full labeled product details, drawn as a scrim panel ON TOP of the image
/// when the associate expands the details sheet — it overlays the image rather
/// than resizing it or the info panel below.
class _DetailsOverlay extends StatelessWidget {
  const _DetailsOverlay({required this.product, super.key});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        // Scrim so the image stays faintly visible behind the details.
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: <Color>[
            c.background.withValues(alpha: 0.96),
            c.background.withValues(alpha: 0.82),
          ],
        ),
      ),
      child: Align(
        alignment: Alignment.bottomLeft,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.giant),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text('DETAILS', style: AppTypography.eyebrow(c.accent)),
              const SizedBox(height: AppSpacing.md),
              for (final ProductDetail d in product.details)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      SizedBox(
                        width: 180,
                        child: Text(
                          d.label.toUpperCase(),
                          style: AppTypography.eyebrow(c.textTertiary),
                        ),
                      ),
                      Expanded(child: Text(d.value, style: t.bodyLarge)),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Smooths the zoom/pan that arrives as discrete WebSocket updates (~16 Hz) into
/// continuous motion by interpolating from the current rendered transform toward
/// each new target. Purely client-side — the transport stays WebSocket.
class _SyncedTransform extends StatefulWidget {
  const _SyncedTransform({
    required this.scale,
    required this.panX,
    required this.panY,
    required this.child,
    super.key,
  });

  final double scale;
  final double panX;
  final double panY;
  final Widget child;

  @override
  State<_SyncedTransform> createState() => _SyncedTransformState();
}

class _SyncedTransformState extends State<_SyncedTransform>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 120),
  );

  late double _fromScale = widget.scale;
  late double _fromX = widget.panX;
  late double _fromY = widget.panY;
  late double _toScale = widget.scale;
  late double _toX = widget.panX;
  late double _toY = widget.panY;

  static double _lerp(double a, double b, double t) => a + (b - a) * t;

  @override
  void didUpdateWidget(covariant _SyncedTransform old) {
    super.didUpdateWidget(old);
    if (widget.scale == _toScale &&
        widget.panX == _toX &&
        widget.panY == _toY) {
      return;
    }
    // Continue from the value currently on screen so bursts don't snap back.
    final double t = _ctrl.isAnimating
        ? Curves.easeOut.transform(_ctrl.value)
        : 1;
    _fromScale = _lerp(_fromScale, _toScale, t);
    _fromX = _lerp(_fromX, _toX, t);
    _fromY = _lerp(_fromY, _toY, t);
    _toScale = widget.scale;
    _toX = widget.panX;
    _toY = widget.panY;
    _ctrl.forward(from: 0);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      child: widget.child,
      builder: (_, Widget? child) {
        final double t = Curves.easeOut.transform(_ctrl.value);
        return Transform.translate(
          offset: Offset(
            _lerp(_fromX, _toX, t) * 60,
            _lerp(_fromY, _toY, t) * 60,
          ),
          child: Transform.scale(
            scale: _lerp(_fromScale, _toScale, t),
            child: child,
          ),
        );
      },
    );
  }
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
