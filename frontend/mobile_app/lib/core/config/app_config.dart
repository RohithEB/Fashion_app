import 'package:shared_preferences/shared_preferences.dart';

/// App configuration and the backend/standalone mode switch.
///
/// Values come from two layers, in order of precedence:
///
/// 1. **Runtime overrides** — set from the in-app *Server settings* sheet and
///    persisted with [SharedPreferences]. Loaded by [load] before `runApp`.
/// 2. **Compile-time `--dart-define`s** — the fallback/default, so a build can
///    still be pinned at build time.
///
/// * **Backend (mandatory):** the Node server on the box owns the catalogue
///   (HTTP) and the realtime channel (`ws://10.0.1.45:3000/ws`). Only the
///   host/port are configurable — the mode itself cannot be switched off.
abstract final class AppConfig {
  // The showcase server runs ON THE BOX, so backend mode + the box's LAN address
  // are the defaults. Relying on --dart-define proved fragile (Flutter does not
  // always invalidate its build cache when a define changes, silently shipping an
  // offline build), so the deployment values live here instead.
  // Pass --dart-define=BACKEND=false for the bundled-catalogue offline mode.
  static const bool _envBackend = bool.fromEnvironment(
    'BACKEND',
    defaultValue: true,
  );

  static const String _envHost = String.fromEnvironment(
    'BACKEND_HOST',
    defaultValue: '10.0.1.45', // the box
  );
  static const int _envPort = int.fromEnvironment(
    'BACKEND_PORT',
    defaultValue: 3000,
  );

  // ── Runtime overrides (from the in-app Server settings, persisted) ───────
  static bool? _backendOverride;
  static String? _hostOverride;
  static int? _portOverride;

  static const String _kBackend = 'cfg.backend';
  static const String _kHost = 'cfg.host';
  static const String _kPort = 'cfg.port';

  /// True when the app talks to the Node backend (HTTP + real WebSocket).
  ///
  /// Backend mode is **mandatory** in this deployment: the showcase server and
  /// the realtime WebSocket both run on the box, so a stored override must never
  /// be able to drop the app into the offline/bundled stack and silently serve a
  /// stale catalogue. Only the host/port stay configurable.
  static bool get backendMode => _envBackend || (_backendOverride ?? false);

  /// Host the backend is reached at (LAN IP of the server box for a device).
  static String get backendHost => _hostOverride ?? _envHost;

  static int get backendPort => _portOverride ?? _envPort;

  /// Load persisted server settings. Call once before `runApp`.
  static Future<void> load() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    if (prefs.containsKey(_kBackend)) {
      _backendOverride = prefs.getBool(_kBackend);
    }
    final String? h = prefs.getString(_kHost);
    if (h != null && h.trim().isNotEmpty) _hostOverride = h.trim();
    if (prefs.containsKey(_kPort)) _portOverride = prefs.getInt(_kPort);
  }

  /// Persist server settings. Takes effect on the next provider rebuild
  /// (the app root is restarted after saving so the repositories re-resolve).
  static Future<void> save({
    required bool backend,
    required String host,
    int? port,
  }) async {
    _backendOverride = backend;
    final String trimmed = host.trim();
    _hostOverride = trimmed.isEmpty ? null : trimmed;
    _portOverride = port;

    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kBackend, backend);
    if (_hostOverride != null) {
      await prefs.setString(_kHost, _hostOverride!);
    } else {
      await prefs.remove(_kHost);
    }
    if (port != null) {
      await prefs.setInt(_kPort, port);
    } else {
      await prefs.remove(_kPort);
    }
  }

  /// Clear all overrides and fall back to the compile-time defaults.
  static Future<void> clear() async {
    _backendOverride = null;
    _hostOverride = null;
    _portOverride = null;
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kBackend);
    await prefs.remove(_kHost);
    await prefs.remove(_kPort);
  }

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
