import 'dart:async';

import '../../models/ws_event.dart';
import 'display_realtime_base.dart';

/// Web fallback: a browser tab cannot host a TCP server, so this behaves like an
/// in-app loopback with a placeholder pairing URL. The scripted demo still works
/// via [inject]; real LAN hosting runs on the Android device build.
class StubDisplayRealtime extends DisplayRealtimeService {
  final StreamController<WsEvent> _events = StreamController<WsEvent>.broadcast();

  @override
  Stream<WsEvent> get events => _events.stream;

  @override
  SenderRole get role => SenderRole.display;

  @override
  String get pairingUrl => 'http://192.168.1.42:8080/pair?token=DEMO-8421';

  @override
  Future<void> start() async {}

  @override
  void emit(WsEvent event) {}

  @override
  void inject(WsEvent event) {
    if (!_events.isClosed) _events.add(event);
  }

  @override
  Future<void> dispose() async {
    await _events.close();
  }
}

/// Factory selected by conditional import on web.
DisplayRealtimeService createDisplayRealtime() => StubDisplayRealtime();
