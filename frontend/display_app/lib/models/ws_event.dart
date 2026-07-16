import 'dart:convert';

/// Who emitted an event.
enum SenderRole { salesperson, display, server }

/// The full realtime event vocabulary shared by the mobile and display apps.
///
/// Session/pairing events establish the link; presentation + interaction events
/// implement **Live Presentation Synchronization** (event-based, never screen
/// mirroring). See REQUIREMENTS.md §7A.
enum WsEventType {
  // Pairing / session
  pair,
  paired,
  connectScreen,
  disconnectScreen,
  keepAlive,
  sessionWarning,
  sessionTimeout,
  sessionEnd,
  heartbeat,
  ack,

  // Presentation gating
  showProduct,
  hideProduct,

  // Image interaction sync
  zoomImage,
  panImage,
  resetZoom,
  changeImage,

  // Variant sync
  changeColor,
  changeSize,
  rotateProduct,

  // Video sync
  playVideo,
  pauseVideo,
  seekVideo,
  muteVideo,

  // Enrichment
  showAIHighlights,
  showRelatedMedia,

  // Commerce
  updateCart,
  checkout,
  paymentSuccess;

  static WsEventType fromName(String name) => WsEventType.values.firstWhere(
    (WsEventType t) => t.name == name,
    orElse: () => WsEventType.heartbeat,
  );
}

/// The wire envelope for every realtime message.
class WsEvent {
  const WsEvent({
    required this.type,
    this.id = '',
    this.sessionId,
    this.senderRole = SenderRole.salesperson,
    this.payload = const <String, dynamic>{},
    this.ts,
    this.seq,
  });

  factory WsEvent.fromJson(Map<String, dynamic> json) => WsEvent(
    id: json['id'] as String? ?? '',
    type: WsEventType.fromName(json['type'] as String),
    sessionId: json['sessionId'] as String?,
    senderRole: SenderRole.values.byName(
      json['senderRole'] as String? ?? 'salesperson',
    ),
    payload:
        (json['payload'] as Map<String, dynamic>?) ?? const <String, dynamic>{},
    ts: (json['ts'] as num?)?.toInt(),
    seq: (json['seq'] as num?)?.toInt(),
  );

  /// Decode from a raw socket frame.
  factory WsEvent.decode(String raw) =>
      WsEvent.fromJson(jsonDecode(raw) as Map<String, dynamic>);

  final String id;
  final WsEventType type;
  final String? sessionId;
  final SenderRole senderRole;
  final Map<String, dynamic> payload;
  final int? ts;
  final int? seq;

  Map<String, dynamic> toJson() => <String, dynamic>{
    'id': id,
    'type': type.name,
    if (sessionId != null) 'sessionId': sessionId,
    'senderRole': senderRole.name,
    'payload': payload,
    if (ts != null) 'ts': ts,
    if (seq != null) 'seq': seq,
  };

  /// Encode to a raw socket frame.
  String encode() => jsonEncode(toJson());

  // Typed payload accessors used across the apps.
  String? get productId => payload['productId'] as String?;
  String? get variantId => payload['variantId'] as String?;
  String? get mediaId => payload['mediaId'] as String?;
  int? get imageIndex => (payload['imageIndex'] as num?)?.toInt();
  double? get scale => (payload['scale'] as num?)?.toDouble();
  double? get focalX => (payload['focalX'] as num?)?.toDouble();
  double? get focalY => (payload['focalY'] as num?)?.toDouble();
  double? get offsetX => (payload['offsetX'] as num?)?.toDouble();
  double? get offsetY => (payload['offsetY'] as num?)?.toDouble();
  int? get positionMs => (payload['positionMs'] as num?)?.toInt();
  int? get secondsLeft => (payload['secondsLeft'] as num?)?.toInt();
}
