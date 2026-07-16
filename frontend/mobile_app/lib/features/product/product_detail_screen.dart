import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_icons.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../models/product.dart';
import '../../widgets/app_button.dart';
import '../../widgets/network_photo.dart';
import '../cart/cart_controller.dart';
import '../presentation/presentation_controller.dart';
import '../presentation/widgets/live_preview.dart';

/// Private product detail. Selecting colours/sizes/images here is silent until
/// "Show on Screen" enters Presentation mode; from then on those same actions
/// are synchronized live to the display.
class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({required this.product, super.key});

  final Product product;

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late String _variantId = widget.product.defaultVariant.id;
  late String _size = widget.product.defaultVariant.sizes.first;
  int _imageIndex = 0;
  late final PageController _page = PageController();

  Product get product => widget.product;
  ProductVariant get variant => product.variantById(_variantId);

  bool _isPresentingThis(PresentationController pres) =>
      pres.isPresenting && pres.presentation?.productId == product.id;

  void _selectVariant(String id) {
    setState(() {
      _variantId = id;
      _imageIndex = 0;
      _size = product.variantById(id).sizes.first;
    });
    _page.jumpToPage(0);
    final PresentationController pres = context.read<PresentationController>();
    if (_isPresentingThis(pres)) pres.changeColor(id);
  }

  void _onImageChanged(int i) {
    setState(() => _imageIndex = i);
    final PresentationController pres = context.read<PresentationController>();
    if (_isPresentingThis(pres)) pres.changeImage(i);
  }

  void _showOnScreen() {
    context.read<PresentationController>().showProduct(product, variantId: _variantId);
    LivePreviewSheet.show(context);
  }

  @override
  void dispose() {
    _page.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final PresentationController pres = context.watch<PresentationController>();
    final bool presentingThis = _isPresentingThis(pres);

    return Scaffold(
      body: CustomScrollView(
        slivers: <Widget>[
          SliverAppBar(
            pinned: true,
            expandedHeight: MediaQuery.of(context).size.height * 0.62,
            leading: const _CircleBackButton(),
            actions: <Widget>[
              if (presentingThis)
                Padding(
                  padding: const EdgeInsets.only(right: AppSpacing.sm),
                  child: _LiveBadge(onTap: () => LivePreviewSheet.show(context)),
                ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: _Gallery(
                variant: variant,
                controller: _page,
                index: _imageIndex,
                onChanged: _onImageChanged,
                interactive: presentingThis,
                onTransform: (double scale, double px, double py) => context
                    .read<PresentationController>()
                    .zoom(scale, focalX: px, focalY: py),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: Text(product.brand, style: AppTypography.eyebrow(c.textTertiary)),
                      ),
                      Text(product.price.formatted, style: t.titleMedium),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(product.name, style: t.headlineMedium),
                  const SizedBox(height: AppSpacing.lg),
                  _Label(text: 'COLOUR — ${variant.colorName}'),
                  const SizedBox(height: AppSpacing.xs),
                  _ColorSelector(
                    product: product,
                    selectedId: _variantId,
                    onSelect: _selectVariant,
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  const _Label(text: 'SIZE'),
                  const SizedBox(height: AppSpacing.xs),
                  _SizeSelector(
                    sizes: variant.sizes,
                    selected: _size,
                    onSelect: (String s) => setState(() => _size = s),
                  ),
                  if (product.aiHighlights.isNotEmpty) ...<Widget>[
                    const SizedBox(height: AppSpacing.xl),
                    Row(
                      children: <Widget>[
                        Icon(AppIcons.sparkle, size: 16, color: c.accent),
                        const SizedBox(width: AppSpacing.xs),
                        Text('ATELIER NOTES', style: AppTypography.eyebrow(c.textSecondary)),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    ...product.aiHighlights.map((String h) => Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text('—  ', style: t.bodyMedium?.copyWith(color: c.accent)),
                              Expanded(child: Text(h, style: t.bodyMedium)),
                            ],
                          ),
                        )),
                  ],
                  const SizedBox(height: AppSpacing.lg),
                  Text(product.description, style: t.bodyLarge?.copyWith(color: c.textSecondary)),
                  if (product.materials.isNotEmpty) ...<Widget>[
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      product.materials.join('  ·  '),
                      style: t.bodySmall?.copyWith(color: c.textTertiary),
                    ),
                  ],
                  if (presentingThis) ...<Widget>[
                    const SizedBox(height: AppSpacing.xl),
                    _SyncControls(product: product),
                  ],
                  const SizedBox(height: 96),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: _ActionBar(
        presentingThis: presentingThis,
        onShow: _showOnScreen,
        onAdd: () {
          context.read<CartController>().addItem(
                product,
                variantId: _variantId,
                size: _size,
              );
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${product.name} added to the cart')),
          );
        },
      ),
    );
  }
}

/// Product gallery. When [interactive] (Presentation mode for this product),
/// each image becomes pinch-zoom/pan enabled and reports its transform via
/// [onTransform] as `(scale, panXNormalized, panYNormalized)`, which the
/// controller emits as live-sync events to the display.
class _Gallery extends StatefulWidget {
  const _Gallery({
    required this.variant,
    required this.controller,
    required this.index,
    required this.onChanged,
    this.interactive = false,
    this.onTransform,
  });

  final ProductVariant variant;
  final PageController controller;
  final int index;
  final ValueChanged<int> onChanged;
  final bool interactive;
  final void Function(double scale, double panX, double panY)? onTransform;

  @override
  State<_Gallery> createState() => _GalleryState();
}

class _GalleryState extends State<_Gallery> {
  final TransformationController _tc = TransformationController();

  @override
  void initState() {
    super.initState();
    _tc.addListener(_emit);
  }

  void _emit() {
    if (!widget.interactive || widget.onTransform == null) return;
    final Matrix4 m = _tc.value;
    final double scale = m.getMaxScaleOnAxis();
    // Normalize translation to roughly [-1, 1] against a nominal image extent.
    final double px = (m.getTranslation().x / 300).clamp(-1.0, 1.0);
    final double py = (m.getTranslation().y / 400).clamp(-1.0, 1.0);
    widget.onTransform!(scale, px, py);
  }

  @override
  void dispose() {
    _tc.removeListener(_emit);
    _tc.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final List<ProductMedia> images = widget.variant.images;
    return Stack(
      fit: StackFit.expand,
      children: <Widget>[
        PageView.builder(
          controller: widget.controller,
          onPageChanged: widget.onChanged,
          physics: widget.interactive
              ? const NeverScrollableScrollPhysics()
              : const PageScrollPhysics(),
          itemCount: images.length,
          itemBuilder: (_, int i) {
            final Widget photo = NetworkPhoto(url: images[i].url);
            if (!widget.interactive) return photo;
            return InteractiveViewer(
              transformationController: _tc,
              minScale: 1,
              maxScale: 4,
              child: photo,
            );
          },
        ),
        Positioned(
          bottom: AppSpacing.md,
          left: 0,
          right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              for (int i = 0; i < images.length; i++)
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == widget.index ? 20 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: i == widget.index
                        ? c.onPrimary
                        : c.onPrimary.withValues(alpha: 0.5),
                    borderRadius: AppRadius.brPill,
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ColorSelector extends StatelessWidget {
  const _ColorSelector({
    required this.product,
    required this.selectedId,
    required this.onSelect,
  });

  final Product product;
  final String selectedId;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return Wrap(
      spacing: AppSpacing.sm,
      children: product.variants.map((ProductVariant v) {
        final bool selected = v.id == selectedId;
        return GestureDetector(
          onTap: () => onSelect(v.id),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: selected ? c.accent : c.border,
                width: selected ? 2 : 1,
              ),
            ),
            child: Center(
              child: Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: _hex(v.colorHex),
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Color _hex(String hex) =>
      Color(int.parse('FF${hex.replaceFirst('#', '')}', radix: 16));
}

class _SizeSelector extends StatelessWidget {
  const _SizeSelector({
    required this.sizes,
    required this.selected,
    required this.onSelect,
  });

  final List<String> sizes;
  final String selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.xs,
      children: sizes.map((String s) {
        return ChoiceChip(
          label: Text(s),
          selected: s == selected,
          showCheckmark: false,
          onSelected: (_) => onSelect(s),
        );
      }).toList(),
    );
  }
}

class _SyncControls extends StatelessWidget {
  const _SyncControls({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final PresentationController pres = context.watch<PresentationController>();
    final bool ai = pres.presentation?.showAIHighlights ?? false;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadius.brLg,
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text('PRESENTATION CONTROLS', style: AppTypography.eyebrow(c.accent)),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: <Widget>[
              _Pill(
                icon: AppIcons.sparkle,
                label: ai ? 'Hide notes' : 'Show notes',
                onTap: () => context.read<PresentationController>().toggleAIHighlights(),
              ),
              _Pill(
                icon: AppIcons.gallery,
                label: 'Gallery',
                onTap: () => context.read<PresentationController>().showGallery(),
              ),
              _Pill(
                icon: AppIcons.zoomIn,
                label: 'Focus',
                onTap: () => context.read<PresentationController>().focusImage(0),
              ),
              if (product.defaultVariant.video != null)
                _Pill(
                  icon: AppIcons.play,
                  label: 'Play video',
                  onTap: () => context.read<PresentationController>().playVideo(),
                ),
              _Pill(
                icon: AppIcons.close,
                label: 'Reset view',
                onTap: () => context.read<PresentationController>().resetZoom(),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return ActionChip(
      avatar: Icon(icon, size: 16, color: c.textPrimary),
      label: Text(label),
      onPressed: onTap,
    );
  }
}

class _ActionBar extends StatelessWidget {
  const _ActionBar({
    required this.presentingThis,
    required this.onShow,
    required this.onAdd,
  });

  final bool presentingThis;
  final VoidCallback onShow;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return Container(
      color: c.background,
      padding: EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.sm,
        AppSpacing.md,
        MediaQuery.of(context).padding.bottom + AppSpacing.sm,
      ),
      child: Row(
        children: <Widget>[
          Expanded(
            flex: 3,
            child: AppButton(
              label: presentingThis ? 'Showing live' : 'Show on Screen',
              icon: presentingThis ? AppIcons.connected : AppIcons.showOnScreen,
              expand: true,
              onPressed: presentingThis ? null : onShow,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            flex: 2,
            child: AppButton(
              label: 'Add',
              icon: AppIcons.add,
              variant: AppButtonVariant.outline,
              expand: true,
              onPressed: onAdd,
            ),
          ),
        ],
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label({required this.text});
  final String text;
  @override
  Widget build(BuildContext context) =>
      Text(text, style: AppTypography.eyebrow(AppColors.of(context).textSecondary));
}

class _CircleBackButton extends StatelessWidget {
  const _CircleBackButton();
  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xs),
      child: CircleAvatar(
        backgroundColor: c.background.withValues(alpha: 0.9),
        child: IconButton(
          icon: const Icon(AppIcons.back, size: 18),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
    );
  }
}

class _LiveBadge extends StatelessWidget {
  const _LiveBadge({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 6),
        decoration: BoxDecoration(color: c.primary, borderRadius: AppRadius.brPill),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(AppIcons.connected, size: 14, color: c.accent),
            const SizedBox(width: 4),
            Text('LIVE', style: AppTypography.eyebrow(c.onPrimary)),
          ],
        ),
      ),
    );
  }
}
