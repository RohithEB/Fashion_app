import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/config/app_config.dart';
import '../models/session.dart';

/// A thrown auth failure carrying a human-readable message from the backend
/// (e.g. "That username is already taken", "Invalid username or password").
class AuthException implements Exception {
  const AuthException(this.message);
  final String message;
  @override
  String toString() => message;
}

/// The result of a successful register/login: the signed-in associate plus the
/// bearer token used to authenticate subsequent calls (e.g. checkout).
class AuthResult {
  const AuthResult({required this.salesperson, required this.token});

  factory AuthResult.fromJson(Map<String, dynamic> json) => AuthResult(
    salesperson:
        Salesperson.fromJson(json['salesperson'] as Map<String, dynamic>),
    token: json['token'] as String,
  );

  final Salesperson salesperson;
  final String token;
}

/// Salesperson authentication. Swapped for [MockAuthRepository] in standalone
/// mode so the offline demo still works without a backend.
abstract interface class AuthRepository {
  Future<AuthResult> register({
    required String name,
    String? title,
    required String username,
    required String password,
  });

  Future<AuthResult> login({
    required String username,
    required String password,
  });

  /// Best-effort server-side token revocation. Never throws.
  Future<void> logout(String token);
}

/// [AuthRepository] backed by the Node backend (`/api/auth/*`).
class HttpAuthRepository implements AuthRepository {
  HttpAuthRepository({http.Client? client})
    : _client = client ?? http.Client();

  final http.Client _client;
  static const Duration _timeout = Duration(seconds: 8);

  @override
  Future<AuthResult> register({
    required String name,
    String? title,
    required String username,
    required String password,
  }) => _post('/api/auth/register', <String, dynamic>{
    'name': name,
    if (title != null && title.trim().isNotEmpty) 'title': title.trim(),
    'username': username,
    'password': password,
  });

  @override
  Future<AuthResult> login({
    required String username,
    required String password,
  }) => _post('/api/auth/login', <String, dynamic>{
    'username': username,
    'password': password,
  });

  @override
  Future<void> logout(String token) async {
    try {
      await _client
          .post(
            AppConfig.http('/api/auth/logout'),
            headers: <String, String>{'authorization': 'Bearer $token'},
          )
          .timeout(_timeout);
    } catch (_) {
      // Logout is best-effort; the client clears local state regardless.
    }
  }

  Future<AuthResult> _post(String path, Map<String, dynamic> body) async {
    late final http.Response res;
    try {
      res = await _client
          .post(
            AppConfig.http(path),
            headers: <String, String>{'content-type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(_timeout);
    } catch (_) {
      throw const AuthException('Could not reach the server. Check the connection.');
    }
    final Map<String, dynamic> json =
        jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode == 200 || res.statusCode == 201) {
      return AuthResult.fromJson(json);
    }
    final Object? err = json['error'];
    final String message = err is Map<String, dynamic>
        ? (err['message'] as String? ?? 'Authentication failed')
        : 'Authentication failed';
    throw AuthException(message);
  }
}

/// Offline/demo auth: accepts any credentials and returns a synthetic associate.
class MockAuthRepository implements AuthRepository {
  const MockAuthRepository();

  @override
  Future<AuthResult> register({
    required String name,
    String? title,
    required String username,
    required String password,
  }) async => AuthResult(
    salesperson: Salesperson(id: 'mock_$username', name: name, title: title),
    token: 'mock-token-$username',
  );

  @override
  Future<AuthResult> login({
    required String username,
    required String password,
  }) async => AuthResult(
    salesperson: Salesperson(
      id: 'mock_$username',
      name: username.isEmpty ? 'Associate' : username,
      title: 'Studio Associate',
    ),
    token: 'mock-token-$username',
  );

  @override
  Future<void> logout(String token) async {}
}
