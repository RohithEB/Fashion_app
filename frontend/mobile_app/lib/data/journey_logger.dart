import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/config/app_config.dart';

/// Fire-and-forget salesperson clickstream logger (backend mode only). Records
/// controller-side actions that don't pass through the WS relay — add-to-cart,
/// opening recommendations, etc. — so the CMS activity log is a complete journey.
class JourneyLogger {
  JourneyLogger({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  void log({
    required String eventType,
    required String? token,
    String? sessionId,
    String? refId,
    Map<String, dynamic>? meta,
  }) {
    if (!AppConfig.backendMode || token == null || token.isEmpty) return;
    unawaited(
      _client
          .post(
            AppConfig.http('/api/journey'),
            headers: <String, String>{
              'content-type': 'application/json',
              'authorization': 'Bearer $token',
            },
            body: jsonEncode(<String, dynamic>{
              'eventType': eventType,
              'sessionId': ?sessionId,
              'refId': ?refId,
              'meta': ?meta,
            }),
          )
          .timeout(const Duration(seconds: 5))
          .catchError((Object _) => http.Response('', 599)), // best-effort
    );
  }
}
