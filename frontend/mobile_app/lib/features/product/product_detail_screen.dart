import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_icons.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../data/catalog_repository.dart';
import '../../data/journey_logger.dart';
import '../../models/product.dart';
import '../../widgets/app_button.dart';
import '../../widgets/network_photo.dart';
import '../../widgets/price_tag.dart';
import '../auth/auth_controller.dart';
import '../cart/cart_controller.dart';
import '../connection/connection_controller.dart';
import '../presentation/presentation_controller.dart';
import '../presentation/widgets/live_preview.dart';

/// Private product detail. The image fills the screen; a **draggable details
/// sheet** sits at the bottom showing the main info, and drags up to reveal the
/// full enriched details (fabric, vibe, season, occasion, fit, rating, …).
/// While the product is presented, expanding the sheet mirrors the full details
/// onto the display; colour/size/zoom stay synchronized as before.
class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({required this.product, super.key});

  final Product product;

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  late Product _product = widget.product;
  late String _variantId = widget.product.defaultVariant.id;
  late String _size = widget.product.defaultVariant.sizes.first;
  int _imageIndex = 0;
  late final PageController _page = PageController();
  final DraggableScrollableController _sheet = DraggableScrollableController();
  bool _detailsShown = false;

  static const double _collapsed = 0.42;
  static const double _expanded = 0.92;

  Product get product => _product;
  ProductVariant get variant => product.variantById(_variantId);

  @override
  void initState() {
    super.initState();
    _loadDetail();
    _sheet.addListener(_onSheetMove);
  }

  Future<void> _loadDetail() async {
    final Product? full = await context.read<CatalogRepository>().productById(
      widget.product.id,
    );
    if (full != null && mounted) {
      setState(() {
        _product = full;
        _variantId = full.defaultVariant.id;
        _size = full.defaultVariant.sizes.first;
        _imageIndex = 0;
      });
    }
  }

  bool _isPresentingThis(PresentationController pres) =>
      pres.isPresenting && pres.presentation?.productId == product.id;

  /// Mirror the details expansion to the display while presenting this product.
  void _onSheetMove() {
    if (!_sheet.isAttached) return;
    final bool expanded = _sheet.size > (_collapsed + _expanded) / 2;
    if (expanded == _detailsShown) return;
    setState(() => _detailsShown = expanded);
    final PresentationController pres = context.read<PresentationController>();
    if (_isPresentingThis(pres)) pres.showDetails(expanded);
  }

  void _toggleSheet() {
    _sheet.animateTo(
      _detailsShown ? _collapsed : _expanded,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeInOut,
    );
  }

  void _selectVariant(String id) {
    final String newSize = product.variantById(id).sizes.first;
    setState(() {
      _variantId = id;
      _imageIndex = 0;
      _size = newSize;
    });
    _page.jumpToPage(0);
    final PresentationController pres = context.read<PresentationController>();
    if (_isPresentingThis(pres)) pres.changeColor(id, size: newSize);
  }

  void _selectSize(String size) {
    setState(() => _size = size);
    final PresentationController pres = context.read<PresentationController>();
    if (_isPresentingThis(pres)) pres.changeSize(size);
  }

  void _onImageChanged(int i) {
    setState(() => _imageIndex = i);
    final PresentationController pres = context.read<PresentationController>();
    if (_isPresentingThis(pres)) pres.changeImage(i);
  }

  void _showOnScreen() {
    final PresentationController pres = context.read<PresentationController>();
    pres.showProduct(product, variantId: _variantId, size: _size);
    if (_detailsShown) pres.showDetails(true);
    LivePreviewSheet.show(context);
  }

  void _addToCart() {
    context.read<CartController>().addItem(
      product,
      variantId: _variantId,
      size: _size,
    );
    context.read<JourneyLogger>().log(
      eventType: 'cart_add',
      token: context.read<AuthController>().token,
      sessionId: context.read<ConnectionController>().session?.sessionId,
      refId: product.id,
      meta: <String, dynamic>{'size': _size, 'variantId': _variantId},
    );
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${product.name} added to the cart')),
    );
  }

  @override
  void dispose() {
    _sheet.removeListener(_onSheetMove);
    _sheet.dispose();
    _page.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final PresentationController pres = context.watch<PresentationController>();
    final bool presentingThis = _isPresentingThis(pres);
    final bool connected = context.watch<ConnectionController>().liveLink;

    return Scaffold(
      body: Stack(
        children: <Widget>[
          // Full-bleed gallery behind the sheet; pinch-zoom syncs while presenting.
          Positioned.fill(
            child: _Gallery(
              variant: variant,
              controller: _page,
              index: _imageIndex,
              onChanged: _onImageChanged,
              interactive: true,
              onTransform: presentingThis
                  ? (double scale, double px, double py) => context
                        .read<PresentationController>()
                        .zoom(scale, focalX: px, focalY: py)
                  : null,
            ),
          ),
          const SafeArea(child: _CircleBackButton()),
          if (presentingThis)
            SafeArea(
              child: Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.sm),
                  child: _LiveBadge(
                    onTap: () => LivePreviewSheet.show(context),
                  ),
                ),
              ),
            ),
          DraggableScrollableSheet(
            controller: _sheet,
            initialChildSize: _collapsed,
            minChildSize: _collapsed,
            maxChildSize: _expanded,
            snap: true,
            snapSizes: const <double>[_collapsed, _expanded],
            builder: (BuildContext ctx, ScrollController scrollController) =>
                _DetailsSheet(
                  scrollController: scrollController,
                  product: product,
                  variant: variant,
                  selectedVariantId: _variantId,
                  selectedSize: _size,
                  connected: connected,
                  presentingThis: presentingThis,
                  expanded: _detailsShown,
                  onSelectVariant: _selectVariant,
                  onSelectSize: _selectSize,
                  onToggleDetails: _toggleSheet,
                  onShow: _showOnScreen,
                  onAdd: _addToCart,
                ),
          ),
        ],
      ),
    );
  }
}

/// The draggable bottom sheet. Collapsed it shows the main details (name, price,
/// colour, size, actions); dragged up it reveals description, style notes, and
/// the full labeled enrichment.
class _DetailsSheet extends StatelessWidget {
  const _DetailsSheet({
    required this.scrollController,
    required this.product,
    required this.variant,
    required this.selectedVariantId,
    required this.selectedSize,
    required this.connected,
    required this.presentingThis,
    required this.expanded,
    required this.onSelectVariant,
    required this.onSelectSize,
    required this.onToggleDetails,
    required this.onShow,
    required this.onAdd,
  });

  final ScrollController scrollController;
  final Product product;
  final ProductVariant variant;
  final String selectedVariantId;
  final String selectedSize;
  final bool connected;
  final bool presentingThis;
  final bool expanded;
  final ValueChanged<String> onSelectVariant;
  final ValueChanged<String> onSelectSize;
  final VoidCallback onToggleDetails;
  final VoidCallback onShow;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;

    final String showLabel = !connected
        ? 'No screen connected'
        : (presentingThis ? 'Showing live' : 'Show on Screen');
    final IconData showIcon = !connected
        ? AppIcons.disconnect
        : (presentingThis ? AppIcons.connected : AppIcons.showOnScreen);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(color: c.border),
      ),
      child: ListView(
        controller: scrollController,
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl,
          AppSpacing.sm,
          AppSpacing.xl,
          AppSpacing.xxl,
        ),
        children: <Widget>[
          // Grab handle.
          Center(
            child: Container(
              width: 44,
              height: 4,
              margin: const EdgeInsets.only(bottom: AppSpacing.md),
              decoration: BoxDecoration(
                color: c.border,
                borderRadius: AppRadius.brPill,
              ),
            ),
          ),

          // Header: brand · name · price.
          Text(product.brand, style: AppTypography.eyebrow(c.textTertiary)),
          const SizedBox(height: AppSpacing.xxs),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(child: Text(product.name, style: t.headlineSmall)),
              const SizedBox(width: AppSpacing.sm),
              PriceTag(
                base: product.price,
                effective: variant.price ?? product.price,
                style: t.titleMedium,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),

          _Label(text: 'COLOR — ${variant.colorName}'),
          const SizedBox(height: AppSpacing.xs),
          _ColorSelector(
            product: product,
            selectedId: selectedVariantId,
            onSelect: onSelectVariant,
          ),
          const SizedBox(height: AppSpacing.lg),
          const _Label(text: 'SIZE'),
          const SizedBox(height: AppSpacing.xs),
          _SizeSelector(
            sizes: variant.sizes,
            selected: selectedSize,
            onSelect: onSelectSize,
          ),
          const SizedBox(height: AppSpacing.lg),

          // Primary actions.
          Row(
            children: <Widget>[
              Expanded(
                flex: 3,
                child: AppButton(
                  label: showLabel,
                  icon: showIcon,
                  expand: true,
                  onPressed: (!connected || presentingThis) ? null : onShow,
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
          const SizedBox(height: AppSpacing.sm),

          // Drag-up affordance / toggle.
          Center(
            child: TextButton.icon(
              onPressed: onToggleDetails,
              icon: Icon(
                expanded ? Icons.keyboard_arrow_down : Icons.keyboard_arrow_up,
              ),
              label: Text(expanded ? 'Hide details' : 'View all details'),
            ),
          ),

          Divider(color: c.divider, height: AppSpacing.lg),

          if (product.description.isNotEmpty) ...<Widget>[
            Text(
              product.description,
              style: t.bodyLarge?.copyWith(color: c.textSecondary),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],

          if (product.aiHighlights.isNotEmpty) ...<Widget>[
            Row(
              children: <Widget>[
                Icon(AppIcons.sparkle, size: 16, color: c.accent),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  'STYLE NOTES',
                  style: AppTypography.eyebrow(c.textSecondary),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            for (final String h in product.aiHighlights)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text('—  ', style: t.bodyMedium?.copyWith(color: c.accent)),
                    Expanded(child: Text(h, style: t.bodyMedium)),
                  ],
                ),
              ),
            const SizedBox(height: AppSpacing.lg),
          ],

          if (product.details.isNotEmpty) ...<Widget>[
            Text('DETAILS', style: AppTypography.eyebrow(c.textSecondary)),
            const SizedBox(height: AppSpacing.sm),
            for (final ProductDetail d in product.details)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    SizedBox(
                      width: 120,
                      child: Text(
                        d.label.toUpperCase(),
                        style: AppTypography.eyebrow(c.textTertiary),
                      ),
                    ),
                    Expanded(child: Text(d.value, style: t.bodyMedium)),
                  ],
                ),
              ),
          ],

          if (presentingThis) ...<Widget>[
            const SizedBox(height: AppSpacing.lg),
            _SyncControls(product: product),
          ],
        ],
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
          physics: const PageScrollPhysics(),
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
          bottom: MediaQuery.of(context).size.height * 0.44 + AppSpacing.md,
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
        color: c.background,
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
                onTap: () =>
                    context.read<PresentationController>().toggleAIHighlights(),
              ),
              _Pill(
                icon: AppIcons.gallery,
                label: 'Gallery',
                onTap: () =>
                    context.read<PresentationController>().showGallery(),
              ),
              _Pill(
                icon: AppIcons.zoomIn,
                label: 'Focus',
                onTap: () =>
                    context.read<PresentationController>().focusImage(0),
              ),
              if (product.defaultVariant.video != null)
                _Pill(
                  icon: AppIcons.play,
                  label: 'Play video',
                  onTap: () =>
                      context.read<PresentationController>().playVideo(),
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

class _Label extends StatelessWidget {
  const _Label({required this.text});
  final String text;
  @override
  Widget build(BuildContext context) => Text(
    text,
    style: AppTypography.eyebrow(AppColors.of(context).textSecondary),
  );
}

class _CircleBackButton extends StatelessWidget {
  const _CircleBackButton();
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xs),
      child: Align(
        alignment: Alignment.topLeft,
        child: Material(
          color: Colors.black.withValues(alpha: 0.45),
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: () => Navigator.of(context).maybePop(),
            child: const SizedBox(
              width: 40,
              height: 40,
              child: Icon(AppIcons.back, size: 18, color: Colors.white),
            ),
          ),
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
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: 6,
        ),
        decoration: BoxDecoration(
          color: c.primary,
          borderRadius: AppRadius.brPill,
        ),
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
