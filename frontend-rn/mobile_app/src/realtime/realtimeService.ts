import { SenderRole, WsEvent } from '../models/wsEvent';

/// Minimal broadcast stream (stand-in for Dart's Stream<WsEvent>.broadcast()).
export class EventStream<T> {
  private listeners = new Set<(value: T) => void>();
  private closed = false;

  listen(cb: (value: T) => void): { cancel: () => void } {
    this.listeners.add(cb);
    return { cancel: () => this.listeners.delete(cb) };
  }

  add(value: T): void {
    if (this.closed) return;
    for (const cb of Array.from(this.listeners)) cb(value);
  }

  get isClosed(): boolean {
    return this.closed;
  }

  close(): void {
    this.closed = true;
    this.listeners.clear();
  }
}

/// Transport-agnostic realtime channel. Ported from the Flutter `RealtimeService`.
export interface RealtimeService {
  /// Inbound events (from the peer/server).
  readonly events: EventStream<WsEvent>;
  /// Role this endpoint plays on the channel.
  readonly role: SenderRole;
  /// Send an event to the peer/server.
  emit(event: WsEvent): void;
  /// Open a real transport. Default no-op returns false (offline mock).
  connect?(url: string): Promise<boolean>;
  /// Close the live transport but keep the service reusable.
  closeTransport?(): Promise<void>;
  dispose(): Promise<void>;
}

/// In-memory realtime used for offline demos. Ported from `MockRealtimeService`.
export class MockRealtimeService implements RealtimeService {
  readonly role: SenderRole;
  readonly loopback: boolean;
  readonly events = new EventStream<WsEvent>();

  constructor(init?: { role?: SenderRole; loopback?: boolean }) {
    this.role = init?.role ?? 'salesperson';
    this.loopback = init?.loopback ?? true;
  }

  emit(event: WsEvent): void {
    if (this.loopback && !this.events.isClosed) this.events.add(event);
  }

  /// Simulate an event arriving from the server/peer.
  inject(event: WsEvent): void {
    if (!this.events.isClosed) this.events.add(event);
  }

  async connect(): Promise<boolean> {
    return false;
  }

  async closeTransport(): Promise<void> {}

  async dispose(): Promise<void> {
    this.events.close();
  }
}
