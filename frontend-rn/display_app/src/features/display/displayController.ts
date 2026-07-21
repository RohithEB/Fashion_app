import { Listenable } from '../../core/listenable';
import { CatalogRepository } from '../../data/catalogRepository';
import { DisplayPhase, ProductPresentation } from '../../models/presentationState';
import { Product } from '../../models/product';
import { WsEvent, WsEventType } from '../../models/wsEvent';
import { DisplayRealtimeService, isDisplayRealtimeService } from '../../realtime/displayRealtime';
import { RealtimeService } from '../../realtime/realtimeService';

type TimerHandle = ReturnType<typeof setTimeout>;

/// Drives the customer display. A thin renderer with its own phase state machine.
/// Ported 1:1 from the Flutter `DisplayController` (ChangeNotifier + timers).
export class DisplayController extends Listenable {
  private readonly realtime: RealtimeService;
  private readonly catalog: CatalogRepository;
  readonly ownsIdle: boolean;

  private sub: { cancel: () => void } | null = null;

  static readonly thankYouSeconds = 30;
  static readonly idleTimeoutMs = 90 * 1000; // Spec: 10 min; shortened for the demo.
  static readonly graceSeconds = 20;

  pairingUrl = 'http://192.168.1.42:8080/pair?token=DEMO-8421';

  private cache: Product[] = [];

  phase: DisplayPhase = DisplayPhase.splash;
  presentation: ProductPresentation | null = null;
  product: Product | null = null;
  salespersonName = '';
  thankYouCountdown = DisplayController.thankYouSeconds;

  idleWarningActive = false;
  idleSecondsLeft = DisplayController.graceSeconds;

  private presentTargetId: string | null = null;

  private phaseTimer: TimerHandle | null = null;
  private countdownTimer: TimerHandle | null = null;
  private idleTimer: TimerHandle | null = null;
  private warningTimer: TimerHandle | null = null;
  private catalogTimer: TimerHandle | null = null;

  private recommendations: Product[] | null = null;
  catalogueTitle = 'The Collection';
  cartView: Record<string, any> | null = null;
  checkoutView: Record<string, any> | null = null;

  constructor(realtime: RealtimeService, catalog: CatalogRepository, ownsIdle = true) {
    super();
    this.realtime = realtime;
    this.catalog = catalog;
    this.ownsIdle = ownsIdle;
    this.sub = this.realtime.events.listen((e) => this.handle(e));
    void this.boot();
  }

  private async boot(): Promise<void> {
    const rt = this.realtime;
    if (isDisplayRealtimeService(rt)) {
      await rt.start();
      this.pairingUrl = rt.pairingUrl;
      this.notifyListeners();
    }
    this.cache = await this.catalog.products(); // hydrate + cache the catalog
    // Re-hydrate the cached catalogue every 2 min so it tracks CMS edits.
    this.catalogTimer = setInterval(async () => {
      try {
        this.cache = await this.catalog.products();
      } catch {}
    }, 2 * 60 * 1000);
    this.phaseTimer = setTimeout(() => {
      this.phase = DisplayPhase.advertisement;
      this.notifyListeners();
      this.phaseTimer = setTimeout(() => this.toWaiting(), 6000);
    }, 2200);
  }

  private toWaiting(): void {
    this.cancelTimers();
    const rt = this.realtime;
    if (isDisplayRealtimeService(rt)) this.pairingUrl = rt.pairingUrl;
    this.phase = DisplayPhase.waiting;
    this.presentation = null;
    this.product = null;
    this.salespersonName = '';
    this.notifyListeners();
  }

  private handle(e: WsEvent): void {
    // Real interactions count as activity; pure heartbeats do not.
    if (e.type !== WsEventType.heartbeat) this.registerActivity();
    switch (e.type) {
      case WsEventType.connectScreen:
        this.salespersonName = e.payload.salespersonName ?? 'your advisor';
        this.runConnectFlow();
        break;
      case WsEventType.showCatalog:
        this.showCatalogGrid();
        break;
      case WsEventType.showRecommendations:
        this.showRecommendations(e);
        break;
      case WsEventType.showCart:
        this.showCart(e);
        break;
      case WsEventType.checkout:
        this.showCheckout(e);
        break;
      case WsEventType.showProduct:
        this.showProduct(e);
        break;
      case WsEventType.hideProduct:
        this.presentTargetId = null;
        this.phase = DisplayPhase.welcome;
        this.presentation = null;
        this.product = null;
        this.notifyListeners();
        break;
      case WsEventType.changeColor:
      case WsEventType.fullscreen:
      case WsEventType.changeImage:
      case WsEventType.zoomImage:
      case WsEventType.panImage:
      case WsEventType.resetZoom:
      case WsEventType.showAIHighlights:
      case WsEventType.showDetails:
      case WsEventType.showRelatedMedia:
      case WsEventType.playVideo:
      case WsEventType.pauseVideo:
      case WsEventType.seekVideo:
      case WsEventType.muteVideo:
      case WsEventType.scrollSync:
        if (this.presentation != null) {
          this.presentation = this.presentation.applyEvent(e);
          this.notifyListeners();
        }
        break;
      case WsEventType.paymentSuccess:
        this.runThankYou();
        break;
      case WsEventType.disconnectScreen:
      case WsEventType.sessionEnd:
      case WsEventType.sessionTimeout:
        this.runThankYou();
        break;
      default:
        break;
    }
  }

  private runConnectFlow(): void {
    this.cancelTimers();
    this.phase = DisplayPhase.connecting;
    this.notifyListeners();
    this.phaseTimer = setTimeout(() => {
      this.phase = DisplayPhase.loading;
      this.notifyListeners();
      this.phaseTimer = setTimeout(() => {
        this.phase = DisplayPhase.welcome;
        this.notifyListeners();
      }, 1100);
    }, 900);
  }

  get catalog_(): Product[] {
    return this.cache;
  }

  get catalogGrid(): Product[] {
    return this.recommendations ?? this.cache;
  }

  private showRecommendations(e: WsEvent): void {
    this.cancelTimers();
    this.presentTargetId = null;
    this.presentation = null;
    this.product = null;
    const ids = e.productIds;
    const matches = this.cache
      .filter((p) => ids.includes(p.id))
      .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    this.recommendations = matches.length === 0 ? null : matches;
    this.catalogueTitle = matches.length === 0 ? 'The Collection' : 'Curated for you';
    this.phase = DisplayPhase.catalogue;
    this.notifyListeners();
  }

  private showCatalogGrid(): void {
    this.cancelTimers();
    this.presentTargetId = null;
    this.presentation = null;
    this.product = null;
    this.recommendations = null;
    this.catalogueTitle = 'The Collection';
    this.phase = DisplayPhase.catalogue;
    this.notifyListeners();
  }

  private showCart(e: WsEvent): void {
    this.cancelTimers();
    this.presentTargetId = null;
    this.presentation = null;
    this.product = null;
    this.cartView = e.payload;
    this.phase = DisplayPhase.cart;
    this.notifyListeners();
  }

  private showCheckout(e: WsEvent): void {
    this.cancelTimers();
    this.presentTargetId = null;
    this.presentation = null;
    this.product = null;
    this.checkoutView = e.payload;
    this.phase = DisplayPhase.checkout;
    this.notifyListeners();
  }

  private showProduct(e: WsEvent): void {
    const id = e.productId;
    if (id == null) return;
    this.presentTargetId = id;
    const variantId = e.variantId;
    const size = e.size;
    const imageIndex = e.imageIndex ?? 0;

    // Same product already on screen → update in place (no re-fetch, no flicker).
    if (
      this.product != null &&
      this.product.id === id &&
      this.presentation != null &&
      this.phase === DisplayPhase.presenting
    ) {
      this.presentation = this.presentation.copyWith({
        variantId: variantId ?? this.presentation.variantId,
        size: size ?? this.presentation.size,
        imageIndex,
      });
      this.notifyListeners();
      return;
    }

    const cached = this.cache.find((p) => p.id === id);
    if (cached != null) {
      this.product = cached;
      this.presentation = new ProductPresentation({
        productId: id,
        variantId: variantId ?? cached.defaultVariant.id,
        size,
        imageIndex,
      });
      this.phase = DisplayPhase.presenting;
      this.notifyListeners();
    } else {
      this.phase = DisplayPhase.loading;
      this.notifyListeners();
    }
    // Fetch/upgrade to full detail (rich variants/media/enrichment).
    this.catalog
      .productById(id)
      .then((full) => {
        if (full == null || this.presentTargetId !== id) {
          if (this.product == null && this.phase === DisplayPhase.loading) {
            this.phase = DisplayPhase.welcome;
            this.notifyListeners();
          }
          return;
        }
        this.product = full;
        this.presentation = new ProductPresentation({
          productId: id,
          variantId: variantId ?? full.defaultVariant.id,
          size,
          imageIndex,
        });
        this.phase = DisplayPhase.presenting;
        this.notifyListeners();
      })
      .catch(() => {
        if (this.product == null && this.phase === DisplayPhase.loading) {
          this.phase = DisplayPhase.welcome;
          this.notifyListeners();
        }
      });
  }

  private runThankYou(): void {
    this.cancelTimers();
    this.phase = DisplayPhase.thankYou;
    this.thankYouCountdown = DisplayController.thankYouSeconds;
    this.notifyListeners();
    this.countdownTimer = setInterval(() => {
      this.thankYouCountdown--;
      if (this.thankYouCountdown <= 0) {
        this.toWaiting();
      } else {
        this.notifyListeners();
      }
    }, 1000);
  }

  // ---- Idle / session lifecycle -------------------------------------------

  private registerActivity(): void {
    if (!this.ownsIdle) return; // server owns idle in backend mode
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.idleWarningActive) {
      this.idleWarningActive = false;
      if (this.warningTimer) clearInterval(this.warningTimer);
      this.notifyListeners();
    }
    this.idleTimer = setTimeout(() => this.beginIdleWarning(), DisplayController.idleTimeoutMs);
  }

  private beginIdleWarning(): void {
    if (
      this.phase !== DisplayPhase.welcome &&
      this.phase !== DisplayPhase.presenting &&
      this.phase !== DisplayPhase.catalogue &&
      this.phase !== DisplayPhase.cart &&
      this.phase !== DisplayPhase.checkout
    ) {
      return;
    }
    this.idleWarningActive = true;
    this.idleSecondsLeft = DisplayController.graceSeconds;
    this.notifyListeners();
    this.emit(
      new WsEvent({
        type: WsEventType.sessionWarning,
        payload: { secondsLeft: this.idleSecondsLeft },
      }),
    );
    this.warningTimer = setInterval(() => {
      this.idleSecondsLeft--;
      if (this.idleSecondsLeft <= 0) {
        this.endSession('idle_timeout');
      } else {
        this.notifyListeners();
        this.emit(
          new WsEvent({
            type: WsEventType.sessionWarning,
            payload: { secondsLeft: this.idleSecondsLeft },
          }),
        );
      }
    }, 1000);
  }

  private endSession(reason: string): void {
    this.emit(new WsEvent({ type: WsEventType.sessionEnd, payload: { reason } }));
    this.toWaiting();
  }

  private emit(event: WsEvent): void {
    this.realtime.emit(event);
  }

  private cancelTimers(): void {
    if (this.phaseTimer) clearTimeout(this.phaseTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.warningTimer) clearInterval(this.warningTimer);
    this.idleWarningActive = false;
  }

  /// Standalone showcase: injects a scripted session so the display animates
  /// through every screen without a physical mobile controller.
  startDemoSession = (): void => {
    const rt = this.realtime;
    if (!isDisplayRealtimeService(rt)) return;
    const demo = this.cache.slice(0, 3);
    if (demo.length === 0) return;

    const at = (ms: number, event: WsEvent) =>
      setTimeout(() => (rt as DisplayRealtimeService).inject(event), ms);

    at(0, new WsEvent({ type: WsEventType.connectScreen, payload: { salespersonName: 'Eleanor' } }));
    at(
      3200,
      new WsEvent({
        type: WsEventType.showProduct,
        payload: { productId: demo[0].id, variantId: demo[0].defaultVariant.id },
      }),
    );
    at(5200, new WsEvent({ type: WsEventType.showAIHighlights, payload: { visible: true } }));
    if (demo[0].variants.length > 1) {
      at(7600, new WsEvent({ type: WsEventType.changeColor, payload: { variantId: demo[0].variants[1].id } }));
    }
    at(10000, new WsEvent({ type: WsEventType.changeImage, payload: { imageIndex: 1 } }));
    at(
      12400,
      new WsEvent({
        type: WsEventType.showProduct,
        payload: { productId: demo[1].id, variantId: demo[1].defaultVariant.id },
      }),
    );
    at(15000, new WsEvent({ type: WsEventType.paymentSuccess }));
  };

  dispose(): void {
    this.cancelTimers();
    if (this.catalogTimer) clearInterval(this.catalogTimer);
    this.sub?.cancel();
  }
}
