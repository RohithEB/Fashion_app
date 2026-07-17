import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';

import '../../models/ws_event.dart';
import '../config/app_config.dart';
import 'display_realtime_base.dart';

/// Display-side realtime for **backend mode**: a WebSocket client of the Node
/// server (`ws://<box>:3000/ws?role=display`).
///
/// On connect the server sends `display_registered { pairingToken, controllerUrl,
/// qrDataUrl }` — we render `controllerUrl` as the pairing QR. Relayed controller
/// commands (`show_product`, `show_related`, `zoom`, `clear`, `session_end`) are
/// translated into the app's [WsEvent] vocabulary and fed to the display FSM,
/// so the rest of the display app is unchanged.
class BackendDisplayRealtime extends DisplayRealtimeService {
  final StreamController<WsEvent> _events = StreamController<WsEvent>.broadcast();
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _sub;
  String _pairingUrl = '';
  Completer<void>? _registered;

  @override
  Stream<WsEvent> get events => _events.stream;

  @override
  SenderRole get role => SenderRole.display;

  @override
  String get pairingUrl =>
      _pairingUrl.isEmpty ? 'Connecting to server…' : _pairingUrl;

  @override
  Future<void> start() async {
    _registered = Completer<void>();
    try {
      final WebSocketChannel channel =
          WebSocketChannel.connect(AppConfig.ws('display'));
      await channel.ready.timeout(const Duration(seconds: 5));
      _channel = channel;
      _sub = channel.stream.listen(
        _onData,
        onError: (_) {},
        cancelOnError: false,
      );
      // Wait for the first display_registered so the QR is correct on first paint.
      await _registered!.future.timeout(
        const Duration(seconds: 5),
        onTimeout: () {},
      );
    } catch (_) {
      // Leave a placeholder pairing URL; the idle screen still renders.
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
      case 'display_registered':
        final String? url = payload['controllerUrl'] as String?;
        final String? token = payload['pairingToken'] as String?;
        _pairingUrl = url ??
            (token != null
                ? AppConfig.http('/pair', <String, dynamic>{'token': token}).toString()
                : _pairingUrl);
        if (_registered != null && !_registered!.isCompleted) {
          _registered!.complete();
        }
      case 'paired':
        _push(const WsEvent(
          type: WsEventType.connectScreen,
          payload: <String, dynamic>{'salespersonName': 'your advisor'},
        ));
      case 'show_catalog':
        _push(WsEvent(type: WsEventType.showCatalog, payload: payload));
      case 'show_cart':
        _push(WsEvent(type: WsEventType.showCart, payload: payload));
      case 'show_product':
        _push(WsEvent(type: WsEventType.showProduct, payload: payload));
      case 'show_details':
        _push(WsEvent(type: WsEventType.showDetails, payload: payload));
      case 'show_related':
        _push(WsEvent(type: WsEventType.showRelatedMedia, payload: payload));
      case 'zoom':
        _push(WsEvent(
          type: WsEventType.zoomImage,
          payload: <String, dynamic>{
            'scale': payload['level'],
            'focalX': payload['x'],
            'focalY': payload['y'],
          },
        ));
      case 'clear':
        _push(const WsEvent(type: WsEventType.hideProduct));
      case 'session_end':
        _push(const WsEvent(type: WsEventType.sessionEnd));
      default:
        break;
    }
  }

  void _push(WsEvent event) {
    if (!_events.isClosed) _events.add(event);
  }

  /// The display never sends commands to the controller (the server relays
  /// controller→display), so this is a no-op in backend mode.
  @override
  void emit(WsEvent event) {}

  @override
  void inject(WsEvent event) => _push(event);

  @override
  Future<void> dispose() async {
    await _sub?.cancel();
    await _channel?.sink.close();
    await _events.close();
  }
}
