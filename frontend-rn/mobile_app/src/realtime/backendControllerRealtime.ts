import { AppConfig } from '../config/appConfig';
import { SenderRole, WsEvent, WsEventType } from '../models/wsEvent';
import { EventStream, RealtimeService } from './realtimeService';

/// Controller-side realtime for **backend mode**: a WebSocket client of the Node
/// server (`ws://<box>:3000/ws?role=controller`) speaking the frozen PROTOCOL.md
/// contract. Translates the app's rich WsEvent vocabulary down to the contract's
/// command set and inbound lifecycle messages back. Ported 1:1 from
/// `BackendControllerRealtime`.
export class BackendControllerRealtime implements RealtimeService {
  readonly events = new EventStream<WsEvent>();
  readonly role: SenderRole;

  private channel: WebSocket | null = null;
  private sessionId: string | null = null;
  // Full presented state so colour/size/image changes re-send a complete
  // show_product (the frozen protocol only relays show_product, not deltas).
  private currentProductId: string | null = null;
  private currentVariantId: string | null = null;
  private currentSize: string | null = null;
  private currentImageIndex = 0;
  private connected = false;

  constructor(role: SenderRole = 'salesperson') {
    this.role = role;
  }

  async connect(url: string): Promise<boolean> {
    // Ignore the QR's path; connect to the backend WS on the scanned host.
    let host = AppConfig.backendHost;
    try {
      host = new URL(url).hostname || host;
    } catch {
      // keep default host
    }
    const wsUrl = AppConfig.ws('controller').replace(AppConfig.backendHost, host);
    try {
      const ws = new WebSocket(wsUrl);
      const opened = new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = () => reject(new Error('ws error'));
      });
      ws.onmessage = (ev) => this.onData(ev.data);
      ws.onclose = () => (this.connected = false);
      await withTimeout(opened, 5000);
      this.channel = ws;
      this.connected = true;
      return true;
    } catch {
      this.connected = false;
      return false;
    }
  }

  private onData(data: any): void {
    if (typeof data !== 'string' || this.events.isClosed) return;
    let msg: any;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }
    const type = (msg.type as string) ?? '';
    const payload = (msg.payload as Record<string, any>) ?? {};
    switch (type) {
      case 'paired':
        this.sessionId = (payload.sessionId as string) ?? (msg.sessionId as string) ?? null;
        this.events.add(new WsEvent({ type: WsEventType.paired, payload }));
        break;
      case 'session_warning':
        this.events.add(new WsEvent({ type: WsEventType.sessionWarning, payload }));
        break;
      case 'session_end':
        this.events.add(new WsEvent({ type: WsEventType.sessionEnd, payload }));
        break;
      default:
        break;
    }
  }

  private send(type: string, payload: Record<string, any>): void {
    if (!this.connected || this.channel == null) return;
    const msg: Record<string, any> = { type, payload };
    if (this.sessionId != null) msg.sessionId = this.sessionId;
    this.channel.send(JSON.stringify(msg));
  }

  private sendShowProduct(): void {
    if (this.currentProductId == null) return;
    const payload: Record<string, any> = { productId: this.currentProductId, imageIndex: this.currentImageIndex };
    if (this.currentVariantId != null) payload.variantId = this.currentVariantId;
    if (this.currentSize != null) payload.size = this.currentSize;
    this.send('show_product', payload);
  }

  emit(event: WsEvent): void {
    switch (event.type) {
      case WsEventType.pair: {
        const p: Record<string, any> = { pairingToken: event.payload.token };
        if (event.payload.salespersonId != null) p.salespersonId = event.payload.salespersonId;
        if (event.payload.salespersonName != null) p.salespersonName = event.payload.salespersonName;
        this.send('pair', p);
        break;
      }
      case WsEventType.showCatalog:
        this.currentProductId = null;
        this.send('show_catalog', event.payload);
        break;
      case WsEventType.showCart:
        this.currentProductId = null;
        this.send('show_cart', event.payload);
        break;
      case WsEventType.showRecommendations:
        this.currentProductId = null;
        this.send('show_recommendations', { productIds: event.productIds });
        break;
      case WsEventType.scrollSync:
        this.send('scroll', { fraction: event.fraction ?? 0 });
        break;
      case WsEventType.showProduct:
        this.currentProductId = event.productId ?? this.currentProductId;
        this.currentVariantId = event.variantId ?? this.currentVariantId;
        this.currentSize = event.size ?? this.currentSize;
        this.currentImageIndex = event.imageIndex ?? 0;
        this.sendShowProduct();
        break;
      case WsEventType.changeColor:
        this.currentVariantId = event.variantId ?? this.currentVariantId;
        this.currentImageIndex = 0; // new colour → first image
        this.sendShowProduct();
        break;
      case WsEventType.changeSize:
        this.currentSize = event.size ?? this.currentSize;
        this.sendShowProduct();
        break;
      case WsEventType.changeImage:
        this.currentImageIndex = event.imageIndex ?? this.currentImageIndex;
        this.sendShowProduct();
        break;
      case WsEventType.fullscreen:
        this.send('fullscreen', event.payload);
        break;
      case WsEventType.zoomImage:
        this.send('zoom', { assetId: this.currentProductId, level: event.scale ?? 1, x: event.focalX ?? 0, y: event.focalY ?? 0 });
        break;
      case WsEventType.resetZoom:
        this.send('zoom', { assetId: this.currentProductId, level: 1, x: 0, y: 0 });
        break;
      case WsEventType.showDetails:
        this.send('show_details', event.payload);
        break;
      case WsEventType.showRelatedMedia:
        this.send('show_related', { productId: this.currentProductId, mediaId: event.mediaId });
        break;
      case WsEventType.hideProduct:
        this.send('clear', {});
        break;
      case WsEventType.keepAlive:
        this.send('keep_alive', {});
        break;
      // Not in the frozen contract — stay controller-local (no send).
      default:
        break;
    }
  }

  async closeTransport(): Promise<void> {
    this.sessionId = null;
    await this.teardown();
  }

  private async teardown(): Promise<void> {
    try {
      this.channel?.close();
    } catch {}
    this.channel = null;
    this.connected = false;
  }

  async dispose(): Promise<void> {
    await this.teardown();
    this.events.close();
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
