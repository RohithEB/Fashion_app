/// App configuration and the box-as-server / backend mode switch.
///
/// All values are compile-time `--dart-define`s so the same binary can run in
/// either mode:
///
/// * **Box-as-server (DEFAULT):** the display box hosts the LAN WebSocket server
///   and both apps read a bundled real-catalog snapshot. Runs fully offline over
///   WiFi — no internet, no laptop, no Node/CMS.
/// * **Backend:** the Node server owns the catalog (HTTP) and the realtime
///   channel (`ws://<box>:3000/ws`). Enable with
///   `--dart-define=BACKEND=true --dart-define=BACKEND_HOST=10.0.1.12`.
abstract final class AppConfig {
  // Box-as-server (offline) is the DEFAULT. Pass --dart-define=BACKEND=true to
  // run against the Node backend instead.
  static const bool backendMode = bool.fromEnvironment(
    'BACKEND',
    defaultValue: false,
  );

  static const String backendHost = String.fromEnvironment(
    'BACKEND_HOST',
    defaultValue: '10.0.1.12',
  );

  static const int backendPort = int.fromEnvironment(
    'BACKEND_PORT',
    defaultValue: 3000,
  );

  /// Build an HTTP URL against the backend.
  static Uri http(String path, [Map<String, dynamic>? query]) => Uri(
    scheme: 'http',
    host: backendHost,
    port: backendPort,
    path: path,
    queryParameters: query?.map(
      (String k, dynamic v) => MapEntry<String, String>(k, '$v'),
    ),
  );

  /// The realtime endpoint for a given role.
  static Uri ws(String role) => Uri(
    scheme: 'ws',
    host: backendHost,
    port: backendPort,
    path: '/ws',
    queryParameters: <String, String>{'role': role},
  );

  /// Absolutize a possibly-relative media path (`/media/...`) served by the
  /// backend so it can be loaded with `Image.network`.
  static String media(String pathOrUrl, {String? host}) {
    if (pathOrUrl.startsWith('http')) return pathOrUrl;
    final String h = host ?? backendHost;
    return 'http://$h:$backendPort$pathOrUrl';
  }
}
