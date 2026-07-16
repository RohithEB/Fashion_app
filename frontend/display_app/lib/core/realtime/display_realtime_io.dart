import 'dart:async';
import 'dart:io';
import 'dart:math';

import '../../models/ws_event.dart';
import 'display_realtime_base.dart';

/// Native (Android / desktop) implementation: the display **hosts** a WebSocket
/// server on the LAN. Salesperson apps connect to `ws://<box-ip>:<port>/ws`.
/// The device IP + a fresh token are encoded in the pairing QR.
class IoDisplayRealtime extends DisplayRealtimeService {
  IoDisplayRealtime({this.port = 8080});

  final int port;
  final String _token = _generateToken();

  final StreamController<WsEvent> _events = StreamController<WsEvent>.broadcast();
  final List<WebSocket> _clients = <WebSocket>[];
  HttpServer? _server;
  String _pairingUrl = '';

  @override
  Stream<WsEvent> get events => _events.stream;

  @override
  SenderRole get role => SenderRole.display;

  @override
  String get pairingUrl => _pairingUrl.isEmpty
      ? 'http://0.0.0.0:$port/pair?token=$_token'
      : _pairingUrl;

  @override
  Future<void> start() async {
    final String ip = await _lanIp();
    _pairingUrl = 'http://$ip:$port/pair?token=$_token';
    try {
      _server = await HttpServer.bind(InternetAddress.anyIPv4, port, shared: true);
      unawaited(_serve(_server!));
    } catch (_) {
      // Port busy / not permitted — the QR still renders; a retry can be added.
    }
  }

  Future<void> _serve(HttpServer server) async {
    await for (final HttpRequest request in server) {
      if (request.uri.path == '/ws' &&
          WebSocketTransformer.isUpgradeRequest(request)) {
        try {
          final WebSocket ws = await WebSocketTransformer.upgrade(request);
          _clients.add(ws);
          ws.listen(
            (dynamic data) {
              if (data is String) {
                try {
                  _events.add(WsEvent.decode(data));
                } catch (_) {}
              }
            },
            onDone: () => _clients.remove(ws),
            onError: (_) => _clients.remove(ws),
            cancelOnError: false,
          );
        } catch (_) {}
      } else if (request.uri.path == '/pair') {
        request.response
          ..statusCode = HttpStatus.ok
          ..headers.contentType = ContentType.html
          ..write('<!doctype html><meta name="viewport" content="width=device-width,'
              'initial-scale=1"><body style="font-family:sans-serif;text-align:'
              'center;padding:48px"><h2>Maison &Eacute;bani</h2><p>Open the '
              'associate app and scan this code to pair.</p></body>');
        await request.response.close();
      } else {
        request.response.statusCode = HttpStatus.notFound;
        await request.response.close();
      }
    }
  }

  @override
  void emit(WsEvent event) {
    final String data = event.encode();
    for (final WebSocket ws in List<WebSocket>.of(_clients)) {
      try {
        ws.add(data);
      } catch (_) {}
    }
  }

  @override
  void inject(WsEvent event) {
    if (!_events.isClosed) _events.add(event);
  }

  @override
  Future<void> dispose() async {
    for (final WebSocket ws in List<WebSocket>.of(_clients)) {
      await ws.close();
    }
    _clients.clear();
    await _server?.close(force: true);
    await _events.close();
  }

  static Future<String> _lanIp() async {
    try {
      final List<NetworkInterface> interfaces = await NetworkInterface.list(
        type: InternetAddressType.IPv4,
        includeLoopback: false,
      );
      for (final NetworkInterface iface in interfaces) {
        for (final InternetAddress addr in iface.addresses) {
          if (!addr.isLoopback) return addr.address;
        }
      }
    } catch (_) {}
    return '127.0.0.1';
  }

  static String _generateToken() {
    final Random r = Random();
    return List<int>.generate(6, (_) => r.nextInt(10)).join();
  }
}

/// Factory selected by conditional import on native platforms.
DisplayRealtimeService createDisplayRealtime() => IoDisplayRealtime();
