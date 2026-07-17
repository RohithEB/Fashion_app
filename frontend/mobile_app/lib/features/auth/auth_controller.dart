import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../data/auth_repository.dart';
import '../../models/session.dart';

/// Single source of truth for salesperson authentication. Login gates the whole
/// app (see the router guard). The bearer [token] + [salesperson] are persisted
/// so the associate stays signed in across app restarts until they log out.
class AuthController extends ChangeNotifier {
  AuthController(this._repo) {
    _restore();
  }

  final AuthRepository _repo;

  static const String _kToken = 'auth.token';
  static const String _kSalesperson = 'auth.salesperson';

  Salesperson? _salesperson;
  String? _token;
  bool _busy = false;
  bool _bootstrapped = false;
  String? _error;

  Salesperson? get salesperson => _salesperson;
  String? get token => _token;
  bool get isBusy => _busy;
  String? get error => _error;

  /// True once the persisted session (if any) has been loaded. The UI shows a
  /// splash until this flips, avoiding a login-screen flicker on cold start.
  bool get bootstrapped => _bootstrapped;

  bool get isAuthenticated => _salesperson != null && _token != null;

  Future<void> _restore() async {
    try {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      final String? token = prefs.getString(_kToken);
      final String? spJson = prefs.getString(_kSalesperson);
      if (token != null && spJson != null) {
        _token = token;
        _salesperson = Salesperson.fromJson(
          jsonDecode(spJson) as Map<String, dynamic>,
        );
      }
    } catch (_) {
      // Corrupt/unavailable storage → start signed out.
    } finally {
      _bootstrapped = true;
      notifyListeners();
    }
  }

  Future<void> _persist() async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    if (_token != null && _salesperson != null) {
      await prefs.setString(_kToken, _token!);
      await prefs.setString(_kSalesperson, jsonEncode(_salesperson!.toJson()));
    } else {
      await prefs.remove(_kToken);
      await prefs.remove(_kSalesperson);
    }
  }

  Future<bool> login({required String username, required String password}) =>
      _run(() => _repo.login(username: username, password: password));

  Future<bool> register({
    required String name,
    String? title,
    required String username,
    required String password,
  }) => _run(
    () => _repo.register(
      name: name,
      title: title,
      username: username,
      password: password,
    ),
  );

  /// Runs an auth request, applying the result and persisting on success.
  /// Returns true on success; on failure sets [error] and returns false.
  Future<bool> _run(Future<AuthResult> Function() request) async {
    _busy = true;
    _error = null;
    notifyListeners();
    try {
      final AuthResult result = await request();
      _salesperson = result.salesperson;
      _token = result.token;
      await _persist();
      _busy = false;
      notifyListeners();
      return true;
    } on AuthException catch (e) {
      _error = e.message;
      _busy = false;
      notifyListeners();
      return false;
    } catch (_) {
      _error = 'Something went wrong. Please try again.';
      _busy = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    final String? token = _token;
    _salesperson = null;
    _token = null;
    _error = null;
    await _persist();
    notifyListeners();
    if (token != null) await _repo.logout(token);
  }

  void clearError() {
    if (_error == null) return;
    _error = null;
    notifyListeners();
  }
}
