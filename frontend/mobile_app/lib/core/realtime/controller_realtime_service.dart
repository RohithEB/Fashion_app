import 'dart:async';

import 'package:web_socket_channel/web_socket_channel.dart';

import '../../models/ws_event.dart';
import 'realtime_service.dart';

/// Real WebSocket client used by the salesperson app to talk to the display's
/// LAN server (the Android box). Works across mobile and web.
///
/// If [connect] fails (e.g. a demo with no real display), the service stays
/// unconnected and [emit] becomes a no-op — the mobile UI and its local preview
/// keep working from the [PresentationController]'s own state, so demos never
/// break.
class ControllerRealtimeService extends RealtimeService {
  ControllerRealtimeService({this.role = SenderRole.salesperson});

  @override
  final SenderRole role;

  final StreamController<WsEvent> _events = StreamController<WsEvent>.broadcast();
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _sub;
  bool _connected = false;

  bool get isConnected => _connected;

  @override
  Stream<WsEvent> get events => _events.stream;

  @override
  Future<bool> connect(Uri url) async {
    await _teardown();
    try {
      final WebSocketChannel channel = WebSocketChannel.connect(url);
      await channel.ready.timeout(const Duration(seconds: 4));
      _channel = channel;
      _connected = true;
      _sub = channel.stream.listen(
        (dynamic data) {
          if (data is String && !_events.isClosed) {
            _events.add(WsEvent.decode(data));
          }
        },
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

  @override
  void emit(WsEvent event) {
    if (_connected && _channel != null) {
      _channel!.sink.add(event.encode());
    }
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
