import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../core/realtime/realtime_service.dart';
import '../../models/session.dart';
import '../../models/ws_event.dart';

enum ConnectionStatus { disconnected, connecting, connected, error }

/// Manages login + QR pairing to a display and the resulting [SessionInfo].
///
/// Flow (mirrors REQUIREMENTS §5/§7): scan QR → parse [PairingInfo] → emit
/// `pair {token}` → (server binds) → `paired {sessionId, displayId}`. In the POC
/// the "server" is simulated locally; swapping [RealtimeService] for the real
/// LAN client makes this real with no UI change.
class ConnectionController extends ChangeNotifier {
  ConnectionController(this._realtime) {
    _sub = _realtime.events.listen(_onEvent);
  }

  final RealtimeService _realtime;
  StreamSubscription<WsEvent>? _sub;

  ConnectionStatus status = ConnectionStatus.disconnected;
  Salesperson? salesperson;
  SessionInfo? session;
  String? error;

  /// True when a real WebSocket link to the display was established (vs. an
  /// offline demo fallback).
  bool liveLink = false;

  /// Idle-timeout warning surfaced from the display; prompts the associate to
  /// keep the session alive.
  bool idleWarning = false;
  int idleSecondsLeft = 0;

  bool get isConnected => status == ConnectionStatus.connected;

  void _onEvent(WsEvent e) {
    switch (e.type) {
      case WsEventType.sessionWarning:
        idleWarning = true;
        idleSecondsLeft = e.secondsLeft ?? 0;
        notifyListeners();
      case WsEventType.sessionEnd:
      case WsEventType.sessionTimeout:
        _reset();
      default:
        break;
    }
  }

  /// Associate confirms they are still present; cancels the idle warning.
  void keepAlive() {
    idleWarning = false;
    _realtime.emit(WsEvent(
      type: WsEventType.keepAlive,
      sessionId: session?.sessionId,
      senderRole: SenderRole.salesperson,
    ));
    notifyListeners();
  }

  void _reset() {
    idleWarning = false;
    session = null;
    status = ConnectionStatus.disconnected;
    notifyListeners();
  }

  void login(Salesperson person) {
    salesperson = person;
    notifyListeners();
  }

  Future<void> connectFromQr(String raw) async {
    final PairingInfo? info = PairingInfo.tryParse(raw);
    if (info == null) {
      error = 'That QR code is not a valid display pairing code.';
      status = ConnectionStatus.error;
      notifyListeners();
      return;
    }
    await connect(info);
  }

  Future<void> connect(PairingInfo info) async {
    error = null;
    status = ConnectionStatus.connecting;
    notifyListeners();

    final Salesperson person =
        salesperson ?? const Salesperson(id: 's0', name: 'Associate');

    // Attempt a real WebSocket link to the display's LAN server. If it fails
    // (e.g. the demo display), we fall back to an offline session so the app
    // stays fully usable.
    liveLink = await _realtime.connect(info.wsUri);

    _realtime.emit(
      WsEvent(
        type: WsEventType.pair,
        senderRole: SenderRole.salesperson,
        payload: <String, dynamic>{'token': info.token},
      ),
    );

    // Brief binding delay (real server acknowledges; fallback simulates).
    await Future<void>.delayed(const Duration(milliseconds: 700));

    session = SessionInfo(
      sessionId: 'sess_${info.token}',
      displayId: 'disp_${info.host}',
      salesperson: person,
    );
    status = ConnectionStatus.connected;
    idleWarning = false;

    _realtime.emit(
      WsEvent(
        type: WsEventType.connectScreen,
        sessionId: session!.sessionId,
        senderRole: SenderRole.salesperson,
        payload: <String, dynamic>{'salespersonName': person.name},
      ),
    );
    notifyListeners();
  }

  void disconnect() {
    if (session != null) {
      _realtime.emit(
        WsEvent(
          type: WsEventType.disconnectScreen,
          sessionId: session!.sessionId,
          senderRole: SenderRole.salesperson,
        ),
      );
    }
    session = null;
    status = ConnectionStatus.disconnected;
    notifyListeners();
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
