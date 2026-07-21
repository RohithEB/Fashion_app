import { AppConfig } from '../config/appConfig';
import { SenderRole, WsEvent, WsEventType } from '../models/wsEvent';
import { DisplayRealtimeService } from './displayRealtime';
import { EventStream } from './realtimeService';

/// Display-side realtime for **backend mode**: a WebSocket client of the Node
/// server (`ws://<box>:3000/ws?role=display`). Ported from
/// `BackendDisplayRealtime`. Uses the browser/RN global WebSocket.
export class BackendDisplayRealtime implements DisplayRealtimeService {
  readonly events = new EventStream<WsEvent>();
  readonly role: SenderRole = 'display';

  private channel: WebSocket | null = null;
  private pairing = '';
  private registeredResolve: (() => void) | null = null;

  get pairingUrl(): string {
    return this.pairing.length === 0 ? 'Connecting to server…' : this.pairing;
  }

  async start(): Promise<void> {
    try {
      const ws = new WebSocket(AppConfig.ws('display'));
      this.channel = ws;

      const opened = new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = () => reject(new Error('ws error'));
      });
      ws.onmessage = (ev) => this.onData(ev.data);
      ws.onclose = () => {};

      await withTimeout(opened, 5000);

      // Wait for the first display_registered so the QR is correct on first paint.
      const registered = new Promise<void>((resolve) => {
        this.registeredResolve = resolve;
      });
      await withTimeout(registered, 5000).catch(() => {});
    } catch {
      // Leave a placeholder pairing URL; the idle screen still renders.
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
      case 'display_registered': {
        const url = payload.controllerUrl as string | undefined;
        const token = payload.pairingToken as string | undefined;
        this.pairing =
          url ??
          (token != null ? AppConfig.http('/pair', { token }) : this.pairing);
        if (this.registeredResolve) {
          this.registeredResolve();
          this.registeredResolve = null;
        }
        break;
      }
      case 'paired':
        this.push(
          new WsEvent({
            type: WsEventType.connectScreen,
            payload: { salespersonName: (payload.salespersonName as string) ?? 'your advisor' },
          }),
        );
        break;
      case 'show_catalog':
        this.push(new WsEvent({ type: WsEventType.showCatalog, payload }));
        break;
      case 'show_recommendations':
        this.push(new WsEvent({ type: WsEventType.showRecommendations, payload }));
        break;
      case 'show_cart':
        this.push(new WsEvent({ type: WsEventType.showCart, payload }));
        break;
      case 'show_product':
        this.push(new WsEvent({ type: WsEventType.showProduct, payload }));
        break;
      case 'scroll':
        this.push(new WsEvent({ type: WsEventType.scrollSync, payload }));
        break;
      case 'show_details':
        this.push(new WsEvent({ type: WsEventType.showDetails, payload }));
        break;
      case 'show_related':
        this.push(new WsEvent({ type: WsEventType.showRelatedMedia, payload }));
        break;
      case 'fullscreen':
        this.push(new WsEvent({ type: WsEventType.fullscreen, payload }));
        break;
      case 'zoom':
        this.push(
          new WsEvent({
            type: WsEventType.zoomImage,
            payload: { scale: payload.level, focalX: payload.x, focalY: payload.y },
          }),
        );
        break;
      case 'clear':
        this.push(new WsEvent({ type: WsEventType.hideProduct }));
        break;
      case 'session_end':
        this.push(new WsEvent({ type: WsEventType.sessionEnd }));
        break;
      default:
        break;
    }
  }

  private push(event: WsEvent): void {
    if (!this.events.isClosed) this.events.add(event);
  }

  /// The display never sends commands to the controller in backend mode.
  emit(): void {}

  inject(event: WsEvent): void {
    this.push(event);
  }

  async dispose(): Promise<void> {
    try {
      this.channel?.close();
    } catch {}
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
