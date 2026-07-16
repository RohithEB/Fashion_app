import 'dart:async';

import '../../models/ws_event.dart';

/// Transport-agnostic realtime channel.
///
/// The apps depend only on this interface. [MockRealtimeService] powers offline
/// demos (in-app loopback); the mobile [ControllerRealtimeService] and the
/// display's LAN server talk to a real WebSocket — swapping one for another
/// needs no UI change.
abstract class RealtimeService {
  /// Inbound events (from the peer/server).
  Stream<WsEvent> get events;

  /// Role this endpoint plays on the channel.
  SenderRole get role;

  /// Send an event to the peer/server.
  void emit(WsEvent event);

  /// Open a real transport to [url]. Returns true if connected. Default is a
  /// no-op (used by the offline mock), so callers can attempt a real connection
  /// and gracefully fall back.
  Future<bool> connect(Uri url) async => false;

  Future<void> dispose();
}

/// In-memory realtime used for offline demos.
///
/// * [emit] echoes on [events] when [loopback] is set, so an in-app preview can
///   mirror what the display would render.
/// * [inject] simulates an inbound event from the server/peer.
class MockRealtimeService extends RealtimeService {
  MockRealtimeService({
    this.role = SenderRole.salesperson,
    this.loopback = true,
  });

  @override
  final SenderRole role;

  final bool loopback;

  final StreamController<WsEvent> _controller =
      StreamController<WsEvent>.broadcast();

  @override
  Stream<WsEvent> get events => _controller.stream;

  @override
  void emit(WsEvent event) {
    if (loopback && !_controller.isClosed) _controller.add(event);
  }

  /// Simulate an event arriving from the server/peer.
  void inject(WsEvent event) {
    if (!_controller.isClosed) _controller.add(event);
  }

  @override
  Future<void> dispose() async {
    await _controller.close();
  }
}
