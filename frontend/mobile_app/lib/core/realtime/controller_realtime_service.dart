import 'dart:async';

import 'package:web_socket_channel/web_socket_channel.dart';

import '../../models/ws_event.dart';
import 'realtime_service.dart';

/// Real WebSocket client used by the salesperson app to talk to the display's
/// LAN server (the Android box). Works across mobile and web.
///
/// Adds a periodic heartbeat (liveness) and automatic reconnection with
/// backoff. If the initial [connect] fails (e.g. a demo with no real display),
/// the service stays unconnected and [emit] becomes a no-op — the mobile UI and
/// its local preview keep working from the controllers' own state, so demos
/// never break.
class ControllerRealtimeService extends RealtimeService {
  ControllerRealtimeService({this.role = SenderRole.salesperson});

  @override
  final SenderRole role;

  static const Duration _heartbeatInterval = Duration(seconds: 20);
  static const int _maxRetries = 5;

  final StreamController<WsEvent> _events =
      StreamController<WsEvent>.broadcast();
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _sub;
  Timer? _heartbeat;
  Timer? _reconnect;
  Uri? _url;
  bool _connected = false;
  bool _disposed = false;
  int _retries = 0;

  bool get isConnected => _connected;

  @override
  Stream<WsEvent> get events => _events.stream;

  @override
  Future<bool> connect(Uri url) async {
    _url = url;
    _retries = 0;
    return _open();
  }

  Future<bool> _open() async {
    await _closeChannel();
    if (_disposed || _url == null) return false;
    try {
      final WebSocketChannel channel = WebSocketChannel.connect(_url!);
      await channel.ready.timeout(const Duration(seconds: 4));
      _channel = channel;
      _connected = true;
      _retries = 0;
      _sub = channel.stream.listen(
        (dynamic data) {
          if (data is String && !_events.isClosed) {
            _events.add(WsEvent.decode(data));
          }
        },
        onDone: _handleDrop,
        onError: (_) => _handleDrop(),
        cancelOnError: false,
      );
      _startHeartbeat();
      return true;
    } catch (_) {
      _connected = false;
      return false;
    }
  }

  void _handleDrop() {
    _connected = false;
    _heartbeat?.cancel();
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (_disposed || _url == null || _retries >= _maxRetries) return;
    _retries++;
    // Exponential backoff capped at 8s.
    final Duration delay = Duration(
      milliseconds: (500 * (1 << (_retries - 1))).clamp(500, 8000),
    );
    _reconnect?.cancel();
    _reconnect = Timer(delay, _open);
  }

  void _startHeartbeat() {
    _heartbeat?.cancel();
    _heartbeat = Timer.periodic(_heartbeatInterval, (_) {
      if (_connected && _channel != null) {
        _channel!.sink.add(
          WsEvent(type: WsEventType.heartbeat, senderRole: role).encode(),
        );
      }
    });
  }

  @override
  void emit(WsEvent event) {
    if (_connected && _channel != null) {
      _channel!.sink.add(event.encode());
    }
  }

  @override
  Future<void> closeTransport() async {
    _url = null; // prevent reconnect
    _reconnect?.cancel();
    _heartbeat?.cancel();
    await _closeChannel();
  }

  Future<void> _closeChannel() async {
    await _sub?.cancel();
    _sub = null;
    await _channel?.sink.close();
    _channel = null;
    _connected = false;
  }

  @override
  Future<void> dispose() async {
    _disposed = true;
    _heartbeat?.cancel();
    _reconnect?.cancel();
    await _closeChannel();
    await _events.close();
  }
}
