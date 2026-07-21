/// App configuration and the box-as-server / backend mode switch.
///
/// All values are compile-time `--dart-define`s so the same binary can run in
/// either mode:
///
/// * **Backend (DEFAULT):** the Node server on the box owns the catalogue (HTTP)
///   and the realtime channel (`ws://10.0.1.45:3000/ws`). This is the deployed
///   topology — the box is the server.
/// * **Box-as-server (opt-in):** `--dart-define=BACKEND=false` falls back to the
///   bundled catalogue snapshot and the display-hosted LAN socket.
abstract final class AppConfig {
  // The showcase server runs ON THE BOX, so backend mode + the box's LAN address
  // are the defaults. Relying on --dart-define proved fragile (Flutter does not
  // always invalidate its build cache when a define changes, silently shipping an
  // offline build), so the deployment values live here instead.
  // Pass --dart-define=BACKEND=false for the bundled-catalogue offline mode.
  static const bool backendMode = bool.fromEnvironment(
    'BACKEND',
    defaultValue: true,
  );

  static const String backendHost = String.fromEnvironment(
    'BACKEND_HOST',
    defaultValue: '10.0.1.45', // the box
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
