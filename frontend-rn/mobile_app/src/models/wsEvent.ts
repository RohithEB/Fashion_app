/// Who emitted an event.
export type SenderRole = 'salesperson' | 'display' | 'server';

/// The full realtime event vocabulary shared by the mobile and display apps.
/// Values equal the Dart enum `.name`s so the wire format is identical.
export enum WsEventType {
  // Pairing / session
  pair = 'pair',
  paired = 'paired',
  connectScreen = 'connectScreen',
  disconnectScreen = 'disconnectScreen',
  keepAlive = 'keepAlive',
  sessionWarning = 'sessionWarning',
  sessionTimeout = 'sessionTimeout',
  sessionEnd = 'sessionEnd',
  heartbeat = 'heartbeat',
  ack = 'ack',
  // Presentation gating
  showCatalog = 'showCatalog',
  showCart = 'showCart',
  showProduct = 'showProduct',
  showRecommendations = 'showRecommendations',
  hideProduct = 'hideProduct',
  // Scroll sync
  scrollSync = 'scrollSync',
  // Image interaction sync
  fullscreen = 'fullscreen',
  zoomImage = 'zoomImage',
  panImage = 'panImage',
  resetZoom = 'resetZoom',
  changeImage = 'changeImage',
  // Variant sync
  changeColor = 'changeColor',
  changeSize = 'changeSize',
  rotateProduct = 'rotateProduct',
  // Video sync
  playVideo = 'playVideo',
  pauseVideo = 'pauseVideo',
  seekVideo = 'seekVideo',
  muteVideo = 'muteVideo',
  // Enrichment
  showAIHighlights = 'showAIHighlights',
  showDetails = 'showDetails',
  showRelatedMedia = 'showRelatedMedia',
  // Commerce
  updateCart = 'updateCart',
  checkout = 'checkout',
  paymentSuccess = 'paymentSuccess',
}

export function wsEventTypeFromName(name: string): WsEventType {
  return (Object.values(WsEventType) as string[]).includes(name)
    ? (name as WsEventType)
    : WsEventType.heartbeat;
}

/// The wire envelope for every realtime message.
export class WsEvent {
  readonly id: string;
  readonly type: WsEventType;
  readonly sessionId?: string;
  readonly senderRole: SenderRole;
  readonly payload: Record<string, any>;
  readonly ts?: number;
  readonly seq?: number;

  constructor(init: {
    type: WsEventType;
    id?: string;
    sessionId?: string;
    senderRole?: SenderRole;
    payload?: Record<string, any>;
    ts?: number;
    seq?: number;
  }) {
    this.type = init.type;
    this.id = init.id ?? '';
    this.sessionId = init.sessionId;
    this.senderRole = init.senderRole ?? 'salesperson';
    this.payload = init.payload ?? {};
    this.ts = init.ts;
    this.seq = init.seq;
  }

  static fromJson(json: any): WsEvent {
    return new WsEvent({
      id: (json.id as string) ?? '',
      type: wsEventTypeFromName(json.type as string),
      sessionId: json.sessionId as string | undefined,
      senderRole: (json.senderRole as SenderRole) ?? 'salesperson',
      payload: (json.payload as Record<string, any>) ?? {},
      ts: json.ts != null ? Math.trunc(json.ts) : undefined,
      seq: json.seq != null ? Math.trunc(json.seq) : undefined,
    });
  }

  static decode(raw: string): WsEvent {
    return WsEvent.fromJson(JSON.parse(raw));
  }

  toJson(): Record<string, any> {
    const out: Record<string, any> = {
      id: this.id,
      type: this.type,
      senderRole: this.senderRole,
      payload: this.payload,
    };
    if (this.sessionId != null) out.sessionId = this.sessionId;
    if (this.ts != null) out.ts = this.ts;
    if (this.seq != null) out.seq = this.seq;
    return out;
  }

  encode(): string {
    return JSON.stringify(this.toJson());
  }

  // Typed payload accessors used across the apps.
  get productId(): string | undefined {
    return this.payload.productId as string | undefined;
  }
  get variantId(): string | undefined {
    return this.payload.variantId as string | undefined;
  }
  get size(): string | undefined {
    return this.payload.size as string | undefined;
  }
  get mediaId(): string | undefined {
    return this.payload.mediaId as string | undefined;
  }
  get imageIndex(): number | undefined {
    return this.payload.imageIndex != null ? Math.trunc(this.payload.imageIndex) : undefined;
  }
  get scale(): number | undefined {
    return this.payload.scale != null ? Number(this.payload.scale) : undefined;
  }
  get focalX(): number | undefined {
    return this.payload.focalX != null ? Number(this.payload.focalX) : undefined;
  }
  get focalY(): number | undefined {
    return this.payload.focalY != null ? Number(this.payload.focalY) : undefined;
  }
  get offsetX(): number | undefined {
    return this.payload.offsetX != null ? Number(this.payload.offsetX) : undefined;
  }
  get offsetY(): number | undefined {
    return this.payload.offsetY != null ? Number(this.payload.offsetY) : undefined;
  }
  get positionMs(): number | undefined {
    return this.payload.positionMs != null ? Math.trunc(this.payload.positionMs) : undefined;
  }
  get secondsLeft(): number | undefined {
    return this.payload.secondsLeft != null ? Math.trunc(this.payload.secondsLeft) : undefined;
  }
  get isFullscreen(): boolean | undefined {
    return this.payload.fullscreen as boolean | undefined;
  }
  get fraction(): number | undefined {
    return this.payload.fraction != null ? Number(this.payload.fraction) : undefined;
  }
  get productIds(): string[] {
    return ((this.payload.productIds as any[] | undefined) ?? []).map((e) => `${e}`);
  }
  get salespersonName(): string | undefined {
    return this.payload.salespersonName as string | undefined;
  }
}
