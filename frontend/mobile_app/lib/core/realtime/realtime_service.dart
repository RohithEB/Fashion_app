import 'dart:async';

import '../../models/ws_event.dart';

/// Transport-agnostic realtime channel.
///
/// The apps depend only on this interface. [MockRealtimeService] powers the POC
/// (in-app loopback, no server); [WsRealtimeService] talks to the real
/// Android-hosted LAN server when it exists — swapping one for the other needs
/// no UI changes.
abstract class RealtimeService {
  /// Inbound events (from the peer/server).
  Stream<WsEvent> get events;

  /// Role this endpoint plays on the channel.
  SenderRole get role;

  /// Send an event to the peer/server.
  void emit(WsEvent event);

  Future<void> dispose();
}

/// In-memory realtime used for the POC.
///
/// * [emit] both forwards to any real transport (none in mock) AND echoes back
///   on [events] as a loopback, so an in-app live preview can mirror exactly
///   what the display would render.
/// * [inject] simulates an inbound event from the server/peer (used to script
///   pairing and demo flows).
class MockRealtimeService implements RealtimeService {
  MockRealtimeService({this.role = SenderRole.salesperson, this.loopback = true});

  @override
  final SenderRole role;

  /// When true, [emit]ted events are echoed on [events].
  final bool loopback;

  final StreamController<WsEvent> _controller =
      StreamController<WsEvent>.broadcast();

  @override
  Stream<WsEvent> get events => _controller.stream;

  @override
  void emit(WsEvent event) {
    if (loopback && !_controller.isClosed) {
      _controller.add(event);
    }
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
