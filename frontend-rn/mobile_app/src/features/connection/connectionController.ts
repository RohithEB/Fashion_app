import { Listenable } from '../../core/listenable';
import { PairingInfo, Salesperson, SessionInfo } from '../../models/session';
import { WsEvent, WsEventType } from '../../models/wsEvent';
import { RealtimeService } from '../../realtime/realtimeService';

export enum ConnectionStatus {
  disconnected = 'disconnected',
  connecting = 'connecting',
  connected = 'connected',
  error = 'error',
}

/// Manages QR pairing to a display and the resulting SessionInfo. Ported 1:1
/// from `ConnectionController`.
export class ConnectionController extends Listenable {
  status = ConnectionStatus.disconnected;
  session: SessionInfo | null = null;
  error: string | null = null;
  liveLink = false;
  idleWarning = false;
  idleSecondsLeft = 0;

  private sub: { cancel: () => void } | null = null;

  constructor(private readonly realtime: RealtimeService) {
    super();
    this.sub = this.realtime.events.listen((e) => this.onEvent(e));
  }

  get isConnected(): boolean {
    return this.status === ConnectionStatus.connected;
  }

  private onEvent(e: WsEvent): void {
    switch (e.type) {
      case WsEventType.sessionWarning:
        this.idleWarning = true;
        this.idleSecondsLeft = e.secondsLeft ?? 0;
        this.notifyListeners();
        break;
      case WsEventType.sessionEnd:
      case WsEventType.sessionTimeout:
        this.reset();
        break;
      default:
        break;
    }
  }

  keepAlive(): void {
    this.idleWarning = false;
    this.realtime.emit(
      new WsEvent({ type: WsEventType.keepAlive, sessionId: this.session?.sessionId, senderRole: 'salesperson' }),
    );
    this.notifyListeners();
  }

  private reset(): void {
    this.idleWarning = false;
    this.liveLink = false;
    this.session = null;
    this.status = ConnectionStatus.disconnected;
    this.notifyListeners();
  }

  async endSession(): Promise<void> {
    this.realtime.emit(
      new WsEvent({ type: WsEventType.hideProduct, sessionId: this.session?.sessionId, senderRole: 'salesperson' }),
    );
    await this.realtime.closeTransport?.();
    this.reset();
  }

  async connectFromQr(raw: string, opts?: { salesperson?: Salesperson }): Promise<void> {
    const info = PairingInfo.tryParse(raw);
    if (info == null) {
      this.error = 'That QR code is not a valid display pairing code.';
      this.status = ConnectionStatus.error;
      this.notifyListeners();
      return;
    }
    await this.connect(info, opts);
  }

  async connect(info: PairingInfo, opts?: { salesperson?: Salesperson }): Promise<void> {
    this.error = null;
    this.status = ConnectionStatus.connecting;
    this.notifyListeners();

    const person = opts?.salesperson ?? new Salesperson({ id: 's0', name: 'Associate' });

    // Attempt a real WebSocket link; fall back to an offline session on failure.
    this.liveLink = (await this.realtime.connect?.(info.wsUrl)) ?? false;

    this.realtime.emit(
      new WsEvent({
        type: WsEventType.pair,
        senderRole: 'salesperson',
        payload: { token: info.token, salespersonId: person.id, salespersonName: person.name },
      }),
    );

    // Brief binding delay (real server acknowledges; fallback simulates).
    await new Promise<void>((r) => setTimeout(r, 700));

    this.session = new SessionInfo({
      sessionId: `sess_${info.token}`,
      displayId: `disp_${info.host}`,
      salesperson: person,
    });
    this.status = ConnectionStatus.connected;
    this.idleWarning = false;

    this.realtime.emit(
      new WsEvent({
        type: WsEventType.connectScreen,
        sessionId: this.session.sessionId,
        senderRole: 'salesperson',
        payload: { salespersonName: person.name },
      }),
    );
    this.notifyListeners();
  }

  disconnect(): void {
    if (this.session != null) {
      this.realtime.emit(
        new WsEvent({ type: WsEventType.disconnectScreen, sessionId: this.session.sessionId, senderRole: 'salesperson' }),
      );
    }
    this.session = null;
    this.status = ConnectionStatus.disconnected;
    this.notifyListeners();
  }

  dispose(): void {
    this.sub?.cancel();
  }
}
