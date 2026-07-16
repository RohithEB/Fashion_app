import '../../models/ws_event.dart';
import 'realtime_service.dart';

/// A [RealtimeService] that additionally **hosts** the session: it exposes the
/// pairing URL to encode in the QR, starts the transport, and can inject events
/// locally (used by the standalone demo driver).
abstract class DisplayRealtimeService extends RealtimeService {
  /// The pairing link to render as a QR: `http://<box-ip>:<port>/pair?token=…`.
  String get pairingUrl;

  /// Start the transport (bind the LAN server on device; no-op on web).
  Future<void> start();

  /// Feed an event into the inbound stream (demo/testing).
  void inject(WsEvent event);
}
