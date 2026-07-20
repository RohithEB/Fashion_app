import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';

import '../../models/ws_event.dart';
import '../config/app_config.dart';
import 'realtime_service.dart';

/// Controller-side realtime for **backend mode**: a WebSocket client of the Node
/// server (`ws://<box>:3000/ws?role=controller`) speaking the frozen
/// `PROTOCOL.md` contract (`{type, sessionId, payload}`, snake_case).
///
/// It translates the app's rich [WsEvent] vocabulary down to the contract's
/// command set (`show_product`, `show_related`, `zoom`, `clear`, `keep_alive`)
/// and translates inbound lifecycle messages back. Events outside the contract
/// (pan, AI-toggle, gallery, video transport) stay controller-local and simply
/// aren't sent — the mobile preview still reflects them.
class BackendControllerRealtime extends RealtimeService {
  BackendControllerRealtime({this.role = SenderRole.salesperson});

  @override
  final SenderRole role;

  final StreamController<WsEvent> _events =
      StreamController<WsEvent>.broadcast();
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _sub;
  String? _sessionId;
  // Full presented state, so colour/size/image changes re-send the complete
  // show_product and the display mirrors every field (the frozen protocol only
  // relays show_product, not per-field deltas).
  String? _currentProductId;
  String? _currentVariantId;
  String? _currentSize;
  int _currentImageIndex = 0;
  bool _connected = false;

  @override
  Stream<WsEvent> get events => _events.stream;

  @override
  Future<bool> connect(Uri url) async {
    // Ignore the QR's path; connect to the backend WS on the scanned host.
    final Uri wsUrl = AppConfig.ws('controller').replace(host: url.host);
    try {
      final WebSocketChannel channel = WebSocketChannel.connect(wsUrl);
      await channel.ready.timeout(const Duration(seconds: 5));
      _channel = channel;
      _connected = true;
      _sub = channel.stream.listen(
        _onData,
        onDone: () => _connected = false,
        onError: (_) => _connected = false,
        cancelOnError: false,
      );
      return true;
    } catch (_) {
      _connected = false;
      return false;
    }
  }

  void _onData(dynamic data) {
    if (data is! String || _events.isClosed) return;
    final Map<String, dynamic> msg;
    try {
      msg = jsonDecode(data) as Map<String, dynamic>;
    } catch (_) {
      return;
    }
    final String type = msg['type'] as String? ?? '';
    final Map<String, dynamic> payload =
        (msg['payload'] as Map<String, dynamic>?) ?? const <String, dynamic>{};
    switch (type) {
      case 'paired':
        _sessionId =
            payload['sessionId'] as String? ?? msg['sessionId'] as String?;
        _events.add(WsEvent(type: WsEventType.paired, payload: payload));
      case 'session_warning':
        _events.add(
          WsEvent(type: WsEventType.sessionWarning, payload: payload),
        );
      case 'session_end':
        _events.add(WsEvent(type: WsEventType.sessionEnd, payload: payload));
      default:
        break;
    }
  }

  void _send(String type, Map<String, dynamic> payload) {
    if (!_connected || _channel == null) return;
    _channel!.sink.add(
      jsonEncode(<String, dynamic>{
        'type': type,
        if (_sessionId != null) 'sessionId': _sessionId,
        'payload': payload,
      }),
    );
  }

  /// Send the complete current product state so the display mirrors the exact
  /// colour, size and image the salesperson is showing.
  void _sendShowProduct() {
    if (_currentProductId == null) return;
    _send('show_product', <String, dynamic>{
      'productId': _currentProductId,
      if (_currentVariantId != null) 'variantId': _currentVariantId,
      if (_currentSize != null) 'size': _currentSize,
      'imageIndex': _currentImageIndex,
    });
  }

  @override
  void emit(WsEvent event) {
    switch (event.type) {
      case WsEventType.pair:
        _send('pair', <String, dynamic>{
          'pairingToken': event.payload['token'],
          if (event.payload['salespersonId'] != null)
            'salespersonId': event.payload['salespersonId'],
          // Sent so the display can greet by name even if this box's DB has no
          // record for the id (e.g. signed in against another backend).
          if (event.payload['salespersonName'] != null)
            'salespersonName': event.payload['salespersonName'],
        });
      case WsEventType.showCatalog:
        _currentProductId = null;
        _send('show_catalog', event.payload);
      case WsEventType.showCart:
        _currentProductId = null;
        _send('show_cart', event.payload);
      case WsEventType.showRecommendations:
        _currentProductId = null;
        _send('show_recommendations', <String, dynamic>{
          'productIds': event.productIds,
        });
      case WsEventType.scrollSync:
        _send('scroll', <String, dynamic>{'fraction': event.fraction ?? 0});
      case WsEventType.showProduct:
        _currentProductId = event.productId ?? _currentProductId;
        _currentVariantId = event.variantId ?? _currentVariantId;
        _currentSize = event.size ?? _currentSize;
        _currentImageIndex = event.imageIndex ?? 0;
        _sendShowProduct();
      case WsEventType.changeColor:
        _currentVariantId = event.variantId ?? _currentVariantId;
        _currentImageIndex = 0; // new colour → first image
        _sendShowProduct();
      case WsEventType.changeSize:
        _currentSize = event.size ?? _currentSize;
        _sendShowProduct();
      case WsEventType.changeImage:
        _currentImageIndex = event.imageIndex ?? _currentImageIndex;
        _sendShowProduct();
      case WsEventType.fullscreen:
        _send('fullscreen', event.payload);
      case WsEventType.zoomImage:
        _send('zoom', <String, dynamic>{
          'assetId': _currentProductId,
          'level': event.scale ?? 1,
          'x': event.focalX ?? 0,
          'y': event.focalY ?? 0,
        });
      case WsEventType.resetZoom:
        _send('zoom', <String, dynamic>{
          'assetId': _currentProductId,
          'level': 1,
          'x': 0,
          'y': 0,
        });
      case WsEventType.showDetails:
        _send('show_details', event.payload);
      case WsEventType.showRelatedMedia:
        _send('show_related', <String, dynamic>{
          'productId': _currentProductId,
          'mediaId': event.mediaId,
        });
      case WsEventType.hideProduct:
        _send('clear', const <String, dynamic>{});
      case WsEventType.keepAlive:
        _send('keep_alive', const <String, dynamic>{});
      // Not in the frozen contract — stay controller-local (no send):
      // connectScreen, changeImage, panImage, showAIHighlights, playVideo,
      // pauseVideo, seekVideo, muteVideo, heartbeat, disconnectScreen.
      default:
        break;
    }
  }

  @override
  Future<void> closeTransport() async {
    _sessionId = null;
    await _teardown();
  }

  Future<void> _teardown() async {
    await _sub?.cancel();
    _sub = null;
    await _channel?.sink.close();
    _channel = null;
    _connected = false;
  }

  @override
  Future<void> dispose() async {
    await _teardown();
    await _events.close();
  }
}
