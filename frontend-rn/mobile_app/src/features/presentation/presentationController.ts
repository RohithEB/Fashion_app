import { Listenable } from '../../core/listenable';
import { ProductPresentation } from '../../models/presentationState';
import { Product } from '../../models/product';
import { WsEvent, WsEventType } from '../../models/wsEvent';
import { RealtimeService } from '../../realtime/realtimeService';

/// The source of truth for Live Presentation Synchronization on the mobile side.
/// While browsing privately, presentation is null and nothing reaches the display.
/// "Show on Screen" enters Presentation mode; every interaction updates the local
/// preview AND emits a WsEvent. Ported 1:1 from `PresentationController`.
export class PresentationController extends Listenable {
  private _presentation: ProductPresentation | null = null;
  get presentation(): ProductPresentation | null {
    return this._presentation;
  }

  private _product: Product | null = null;
  get product(): Product | null {
    return this._product;
  }

  get isPresenting(): boolean {
    return this._presentation != null;
  }

  cartOnScreen = false;
  sessionId: string | null = null;

  private throttle: ReturnType<typeof setInterval> | null = null;
  private pendingThrottled: WsEvent | null = null;

  constructor(private readonly realtime: RealtimeService) {
    super();
  }

  private apply(event: WsEvent, throttled = false): void {
    if (this._presentation != null) {
      this._presentation = this._presentation.applyEvent(event);
      this.notifyListeners();
    }
    if (throttled) this.emitThrottled(event);
    else this.emit(event);
  }

  private emit(event: WsEvent): void {
    this.realtime.emit(
      new WsEvent({ type: event.type, sessionId: this.sessionId ?? undefined, senderRole: 'salesperson', payload: event.payload }),
    );
  }

  /// Coalesce rapid events (zoom/pan) to at most one per 60ms.
  private emitThrottled(event: WsEvent): void {
    this.pendingThrottled = event;
    if (this.throttle == null) {
      this.throttle = setInterval(() => {
        if (this.pendingThrottled != null) {
          this.emit(this.pendingThrottled);
          this.pendingThrottled = null;
        } else {
          if (this.throttle) clearInterval(this.throttle);
          this.throttle = null;
        }
      }, 60);
    }
  }

  showProduct(product: Product, opts?: { variantId?: string; size?: string }): void {
    this._product = product;
    this.cartOnScreen = false;
    const resolvedVariant = opts?.variantId ?? product.defaultVariant.id;
    this._presentation = new ProductPresentation({ productId: product.id, variantId: resolvedVariant, size: opts?.size });
    const payload: Record<string, any> = { productId: product.id, variantId: resolvedVariant };
    if (opts?.size != null) payload.size = opts.size;
    this.emit(new WsEvent({ type: WsEventType.showProduct, payload }));
    this.notifyListeners();
  }

  showRecommendations(productIds: string[]): void {
    this._presentation = null;
    this._product = null;
    this.cartOnScreen = false;
    this.emit(new WsEvent({ type: WsEventType.showRecommendations, payload: { productIds } }));
    this.notifyListeners();
  }

  syncScroll(fraction: number): void {
    this.apply(new WsEvent({ type: WsEventType.scrollSync, payload: { fraction } }), true);
  }

  showCatalog(): void {
    this._presentation = null;
    this._product = null;
    this.cartOnScreen = false;
    this.emit(new WsEvent({ type: WsEventType.showCatalog }));
    this.notifyListeners();
  }

  showCart(payload: Record<string, any>): void {
    this._presentation = null;
    this._product = null;
    this.cartOnScreen = true;
    this.emit(new WsEvent({ type: WsEventType.showCart, payload }));
    this.notifyListeners();
  }

  syncCart(payload: Record<string, any>): void {
    if (!this.cartOnScreen) return;
    this.emit(new WsEvent({ type: WsEventType.showCart, payload }));
  }

  hideProduct(): void {
    this._presentation = null;
    this._product = null;
    this.cartOnScreen = false;
    this.emit(new WsEvent({ type: WsEventType.hideProduct }));
    this.notifyListeners();
  }

  changeColor(variantId: string, opts?: { size?: string }): void {
    const payload: Record<string, any> = { variantId };
    if (opts?.size != null) payload.size = opts.size;
    this.apply(new WsEvent({ type: WsEventType.changeColor, payload }));
  }

  changeSize(size: string): void {
    this.apply(new WsEvent({ type: WsEventType.changeSize, payload: { size } }));
  }

  changeImage(index: number): void {
    this.apply(new WsEvent({ type: WsEventType.changeImage, payload: { imageIndex: index } }));
  }

  zoom(scale: number, opts?: { focalX?: number; focalY?: number }): void {
    this.apply(
      new WsEvent({ type: WsEventType.zoomImage, payload: { scale, focalX: opts?.focalX ?? 0, focalY: opts?.focalY ?? 0 } }),
      true,
    );
  }

  pan(dx: number, dy: number): void {
    this.apply(new WsEvent({ type: WsEventType.panImage, payload: { offsetX: dx, offsetY: dy } }), true);
  }

  setFullscreen(on: boolean): void {
    this.apply(new WsEvent({ type: WsEventType.fullscreen, payload: { fullscreen: on } }));
  }

  resetZoom(): void {
    this.apply(new WsEvent({ type: WsEventType.resetZoom }));
  }

  resetView(): void {
    const idx = this._presentation?.imageIndex ?? 0;
    this.apply(new WsEvent({ type: WsEventType.changeImage, payload: { imageIndex: idx } }));
  }

  showDetails(expanded: boolean): void {
    this.apply(new WsEvent({ type: WsEventType.showDetails, payload: { expanded } }));
  }

  toggleAIHighlights(): void {
    this.apply(
      new WsEvent({ type: WsEventType.showAIHighlights, payload: { visible: !(this._presentation?.showAIHighlights ?? false) } }),
    );
  }

  showRelatedMedia(mediaId: string): void {
    this.apply(new WsEvent({ type: WsEventType.showRelatedMedia, payload: { mediaId } }));
  }

  showGallery(): void {
    this.apply(new WsEvent({ type: WsEventType.showRelatedMedia, payload: { mediaId: 'gallery' } }));
  }

  focusImage(index: number): void {
    this.changeImage(index);
  }

  playVideo(): void {
    this.apply(new WsEvent({ type: WsEventType.playVideo }));
  }

  pauseVideo(): void {
    this.apply(new WsEvent({ type: WsEventType.pauseVideo }));
  }

  seekVideo(positionMs: number): void {
    this.apply(new WsEvent({ type: WsEventType.seekVideo, payload: { positionMs } }));
  }

  dispose(): void {
    if (this.throttle) clearInterval(this.throttle);
  }
}
