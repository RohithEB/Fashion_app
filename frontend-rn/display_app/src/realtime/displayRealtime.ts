import { SenderRole, WsEvent } from '../models/wsEvent';
import { EventStream, RealtimeService } from './realtimeService';

/// A RealtimeService that additionally **hosts** the session: it exposes the
/// pairing URL to encode in the QR, starts the transport, and can inject events
/// locally (used by the standalone demo driver). Ported from
/// `DisplayRealtimeService`.
export interface DisplayRealtimeService extends RealtimeService {
  /// The pairing link to render as a QR.
  readonly pairingUrl: string;
  /// Start the transport.
  start(): Promise<void>;
  /// Feed an event into the inbound stream (demo/testing).
  inject(event: WsEvent): void;
}

/// Web/standalone fallback: a browser tab cannot host a TCP server, so this
/// behaves like an in-app loopback with a placeholder pairing URL. The scripted
/// demo still works via inject(). Ported from `StubDisplayRealtime`.
export class StubDisplayRealtime implements DisplayRealtimeService {
  readonly events = new EventStream<WsEvent>();
  readonly role: SenderRole = 'display';

  get pairingUrl(): string {
    return 'http://192.168.1.42:8080/pair?token=DEMO-8421';
  }

  async start(): Promise<void> {}

  emit(): void {}

  inject(event: WsEvent): void {
    if (!this.events.isClosed) this.events.add(event);
  }

  async dispose(): Promise<void> {
    this.events.close();
  }
}

export function isDisplayRealtimeService(s: RealtimeService): s is DisplayRealtimeService {
  return typeof (s as DisplayRealtimeService).start === 'function' && 'pairingUrl' in s;
}

/// Factory (native LAN server vs. web loopback stub). The web/native split from
/// Flutter's conditional import collapses here: no build can host a TCP server
/// from JS, so the loopback stub is used everywhere; backend mode uses the
/// WebSocket client instead.
export function createDisplayRealtime(): DisplayRealtimeService {
  return new StubDisplayRealtime();
}
