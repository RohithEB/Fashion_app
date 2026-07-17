/// App configuration and the backend/standalone mode switch.
///
/// All values are compile-time `--dart-define`s so the same binary can run in
/// either mode:
///
/// * **Standalone (default):** in-app mock catalog + the display-hosted LAN
///   WebSocket server. No backend required — the offline demo.
/// * **Backend:** the Node server owns the catalog (HTTP) and the realtime
///   channel (`ws://<box>:3000/ws`). Enable with
///   `--dart-define=BACKEND=true --dart-define=BACKEND_HOST=10.0.1.12`.
abstract final class AppConfig {
  // Backend mode is the DEFAULT now (real Node server + SQLite). Pass
  // --dart-define=BACKEND=false only to run the offline mock demo.
  static const bool backendMode = bool.fromEnvironment(
    'BACKEND',
    defaultValue: true,
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
