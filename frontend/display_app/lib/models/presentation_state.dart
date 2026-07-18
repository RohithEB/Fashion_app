import 'ws_event.dart';

/// The high-level phase the display is in. Drives the display app's screen FSM.
enum DisplayPhase {
  splash,
  advertisement,
  waiting, // showing QR, awaiting pairing
  connecting,
  loading,
  welcome,
  catalogue, // the collection / curated recommendations grid
  cart, // the saved-outfits page mirrored from the controller
  checkout, // the order review mirrored from the controller
  presenting, // a product is on screen (Presentation mode)
  thankYou,
  disconnected,
}

/// Which view of the presented product is active.
enum PresentationView { hero, gallery, video, colorways, specifications }

/// The synchronized state of the product currently on the display.
///
/// This is the single object the display renders and the mobile mirrors. Every
/// live-sync [WsEvent] produces a new immutable copy via [applyEvent].
class ProductPresentation {
  const ProductPresentation({
    required this.productId,
    this.variantId,
    this.size,
    this.view = PresentationView.hero,
    this.imageIndex = 0,
    this.zoom = 1.0,
    this.panX = 0.0,
    this.panY = 0.0,
    this.showAIHighlights = false,
    this.relatedMediaId,
    this.videoPlaying = false,
    this.videoPositionMs = 0,
    this.videoMuted = false,
    this.detailsExpanded = false,
    this.scrollFraction = 0,
  });

  final String productId;
  final String? variantId;

  /// The size the salesperson has selected (mirrored onto the display).
  final String? size;
  final PresentationView view;
  final int imageIndex;
  final double zoom;
  final double panX;
  final double panY;
  final bool showAIHighlights;
  final String? relatedMediaId;
  final bool videoPlaying;
  final int videoPositionMs;
  final bool videoMuted;

  /// Whether the full product-details panel is expanded (synced from the sheet).
  final bool detailsExpanded;

  /// Normalised scroll position (0..1) of the associate's product-detail sheet,
  /// mirrored so the display's info panel scrolls in step.
  final double scrollFraction;

  ProductPresentation copyWith({
    String? productId,
    String? variantId,
    String? size,
    PresentationView? view,
    int? imageIndex,
    double? zoom,
    double? panX,
    double? panY,
    bool? showAIHighlights,
    String? relatedMediaId,
    bool? videoPlaying,
    int? videoPositionMs,
    bool? videoMuted,
    bool? detailsExpanded,
    double? scrollFraction,
  }) => ProductPresentation(
    productId: productId ?? this.productId,
    variantId: variantId ?? this.variantId,
    size: size ?? this.size,
    view: view ?? this.view,
    imageIndex: imageIndex ?? this.imageIndex,
    zoom: zoom ?? this.zoom,
    panX: panX ?? this.panX,
    panY: panY ?? this.panY,
    showAIHighlights: showAIHighlights ?? this.showAIHighlights,
    relatedMediaId: relatedMediaId ?? this.relatedMediaId,
    videoPlaying: videoPlaying ?? this.videoPlaying,
    videoPositionMs: videoPositionMs ?? this.videoPositionMs,
    videoMuted: videoMuted ?? this.videoMuted,
    detailsExpanded: detailsExpanded ?? this.detailsExpanded,
    scrollFraction: scrollFraction ?? this.scrollFraction,
  );

  /// Reduce a realtime [event] into a new presentation state. Pure function —
  /// the same reducer runs on both apps so they stay perfectly in sync.
  ProductPresentation applyEvent(WsEvent event) {
    switch (event.type) {
      case WsEventType.showProduct:
        return ProductPresentation(
          productId: event.productId ?? productId,
          variantId: event.variantId ?? variantId,
          size: event.size ?? size,
        );
      case WsEventType.changeColor:
        return copyWith(
          variantId: event.variantId,
          size: event.size ?? size,
          imageIndex: 0,
          zoom: 1,
          panX: 0,
          panY: 0,
          view: PresentationView.hero,
        );
      case WsEventType.changeSize:
        return copyWith(size: event.size ?? size);
      case WsEventType.scrollSync:
        return copyWith(scrollFraction: event.fraction ?? scrollFraction);
      case WsEventType.changeImage:
        return copyWith(
          imageIndex: event.imageIndex ?? imageIndex,
          view: PresentationView.hero,
          zoom: 1,
          panX: 0,
          panY: 0,
        );
      case WsEventType.zoomImage:
        return copyWith(
          zoom: event.scale ?? zoom,
          panX: event.focalX ?? panX,
          panY: event.focalY ?? panY,
        );
      case WsEventType.panImage:
        return copyWith(
          panX: event.offsetX ?? panX,
          panY: event.offsetY ?? panY,
        );
      case WsEventType.resetZoom:
        return copyWith(zoom: 1, panX: 0, panY: 0);
      case WsEventType.showAIHighlights:
        return copyWith(
          showAIHighlights: (event.payload['visible'] as bool?) ?? true,
        );
      case WsEventType.showDetails:
        return copyWith(
          detailsExpanded:
              (event.payload['expanded'] as bool?) ?? !detailsExpanded,
        );
      case WsEventType.showRelatedMedia:
        return copyWith(
          relatedMediaId: event.mediaId,
          view: PresentationView.gallery,
        );
      case WsEventType.playVideo:
        return copyWith(view: PresentationView.video, videoPlaying: true);
      case WsEventType.pauseVideo:
        return copyWith(videoPlaying: false);
      case WsEventType.seekVideo:
        return copyWith(videoPositionMs: event.positionMs ?? videoPositionMs);
      case WsEventType.muteVideo:
        return copyWith(videoMuted: (event.payload['muted'] as bool?) ?? true);
      default:
        return this;
    }
  }
}
