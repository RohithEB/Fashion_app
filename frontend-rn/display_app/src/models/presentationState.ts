import { WsEvent, WsEventType } from './wsEvent';

/// The high-level phase the display is in. Drives the display app's screen FSM.
export enum DisplayPhase {
  splash = 'splash',
  advertisement = 'advertisement',
  waiting = 'waiting',
  connecting = 'connecting',
  loading = 'loading',
  welcome = 'welcome',
  catalogue = 'catalogue',
  cart = 'cart',
  checkout = 'checkout',
  presenting = 'presenting',
  thankYou = 'thankYou',
  disconnected = 'disconnected',
}

/// Which view of the presented product is active.
export enum PresentationView {
  hero = 'hero',
  gallery = 'gallery',
  video = 'video',
  colorways = 'colorways',
  specifications = 'specifications',
}

/// The synchronized state of the product currently on the display. Immutable;
/// every live-sync WsEvent produces a new copy via applyEvent. Ported 1:1.
export class ProductPresentation {
  readonly productId: string;
  readonly variantId?: string;
  readonly size?: string;
  readonly view: PresentationView;
  readonly imageIndex: number;
  readonly zoom: number;
  readonly panX: number;
  readonly panY: number;
  readonly showAIHighlights: boolean;
  readonly relatedMediaId?: string;
  readonly videoPlaying: boolean;
  readonly videoPositionMs: number;
  readonly videoMuted: boolean;
  readonly detailsExpanded: boolean;
  readonly fullscreen: boolean;
  readonly scrollFraction: number;

  constructor(init: {
    productId: string;
    variantId?: string;
    size?: string;
    view?: PresentationView;
    imageIndex?: number;
    zoom?: number;
    panX?: number;
    panY?: number;
    showAIHighlights?: boolean;
    relatedMediaId?: string;
    videoPlaying?: boolean;
    videoPositionMs?: number;
    videoMuted?: boolean;
    detailsExpanded?: boolean;
    fullscreen?: boolean;
    scrollFraction?: number;
  }) {
    this.productId = init.productId;
    this.variantId = init.variantId;
    this.size = init.size;
    this.view = init.view ?? PresentationView.hero;
    this.imageIndex = init.imageIndex ?? 0;
    this.zoom = init.zoom ?? 1.0;
    this.panX = init.panX ?? 0.0;
    this.panY = init.panY ?? 0.0;
    this.showAIHighlights = init.showAIHighlights ?? false;
    this.relatedMediaId = init.relatedMediaId;
    this.videoPlaying = init.videoPlaying ?? false;
    this.videoPositionMs = init.videoPositionMs ?? 0;
    this.videoMuted = init.videoMuted ?? false;
    this.detailsExpanded = init.detailsExpanded ?? false;
    this.fullscreen = init.fullscreen ?? false;
    this.scrollFraction = init.scrollFraction ?? 0;
  }

  copyWith(patch: Partial<{
    productId: string;
    variantId: string;
    size: string;
    view: PresentationView;
    imageIndex: number;
    zoom: number;
    panX: number;
    panY: number;
    showAIHighlights: boolean;
    relatedMediaId: string;
    videoPlaying: boolean;
    videoPositionMs: number;
    videoMuted: boolean;
    detailsExpanded: boolean;
    fullscreen: boolean;
    scrollFraction: number;
  }>): ProductPresentation {
    return new ProductPresentation({
      productId: patch.productId ?? this.productId,
      variantId: patch.variantId ?? this.variantId,
      size: patch.size ?? this.size,
      view: patch.view ?? this.view,
      imageIndex: patch.imageIndex ?? this.imageIndex,
      zoom: patch.zoom ?? this.zoom,
      panX: patch.panX ?? this.panX,
      panY: patch.panY ?? this.panY,
      showAIHighlights: patch.showAIHighlights ?? this.showAIHighlights,
      relatedMediaId: patch.relatedMediaId ?? this.relatedMediaId,
      videoPlaying: patch.videoPlaying ?? this.videoPlaying,
      videoPositionMs: patch.videoPositionMs ?? this.videoPositionMs,
      videoMuted: patch.videoMuted ?? this.videoMuted,
      detailsExpanded: patch.detailsExpanded ?? this.detailsExpanded,
      fullscreen: patch.fullscreen ?? this.fullscreen,
      scrollFraction: patch.scrollFraction ?? this.scrollFraction,
    });
  }

  /// Reduce a realtime event into a new presentation state. Pure function —
  /// the same reducer runs on both apps so they stay perfectly in sync.
  applyEvent(event: WsEvent): ProductPresentation {
    switch (event.type) {
      case WsEventType.showProduct:
        return new ProductPresentation({
          productId: event.productId ?? this.productId,
          variantId: event.variantId ?? this.variantId,
          size: event.size ?? this.size,
        });
      case WsEventType.changeColor:
        return this.copyWith({
          variantId: event.variantId,
          size: event.size ?? this.size,
          imageIndex: 0,
          zoom: 1,
          panX: 0,
          panY: 0,
          view: PresentationView.hero,
        });
      case WsEventType.changeSize:
        return this.copyWith({ size: event.size ?? this.size });
      case WsEventType.scrollSync:
        return this.copyWith({ scrollFraction: event.fraction ?? this.scrollFraction });
      case WsEventType.changeImage:
        return this.copyWith({
          imageIndex: event.imageIndex ?? this.imageIndex,
          view: PresentationView.hero,
          zoom: 1,
          panX: 0,
          panY: 0,
        });
      case WsEventType.zoomImage:
        return this.copyWith({
          zoom: event.scale ?? this.zoom,
          panX: event.focalX ?? this.panX,
          panY: event.focalY ?? this.panY,
        });
      case WsEventType.panImage:
        return this.copyWith({
          panX: event.offsetX ?? this.panX,
          panY: event.offsetY ?? this.panY,
        });
      case WsEventType.resetZoom:
        return this.copyWith({ zoom: 1, panX: 0, panY: 0 });
      case WsEventType.showAIHighlights:
        return this.copyWith({
          showAIHighlights: (event.payload.visible as boolean | undefined) ?? true,
        });
      case WsEventType.fullscreen:
        return this.copyWith({ fullscreen: event.isFullscreen ?? !this.fullscreen });
      case WsEventType.showDetails:
        return this.copyWith({
          detailsExpanded: (event.payload.expanded as boolean | undefined) ?? !this.detailsExpanded,
        });
      case WsEventType.showRelatedMedia:
        return this.copyWith({
          relatedMediaId: event.mediaId,
          view: PresentationView.gallery,
        });
      case WsEventType.playVideo:
        return this.copyWith({ view: PresentationView.video, videoPlaying: true });
      case WsEventType.pauseVideo:
        return this.copyWith({ videoPlaying: false });
      case WsEventType.seekVideo:
        return this.copyWith({ videoPositionMs: event.positionMs ?? this.videoPositionMs });
      case WsEventType.muteVideo:
        return this.copyWith({ videoMuted: (event.payload.muted as boolean | undefined) ?? true });
      default:
        return this;
    }
  }
}
