// Facade that exposes [DisplayRealtimeService] and a platform-appropriate
// [createDisplayRealtime] factory (native LAN server vs. web loopback stub).
export 'display_realtime_base.dart';
export 'display_realtime_stub.dart'
    if (dart.library.io) 'display_realtime_io.dart';
