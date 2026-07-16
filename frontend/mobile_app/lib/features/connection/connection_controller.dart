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
  ConnectionController(this._realtime);

  final RealtimeService _realtime;

  ConnectionStatus status = ConnectionStatus.disconnected;
  Salesperson? salesperson;
  SessionInfo? session;
  String? error;

  bool get isConnected => status == ConnectionStatus.connected;

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

    _realtime.emit(
      WsEvent(
        type: WsEventType.pair,
        senderRole: SenderRole.salesperson,
        payload: <String, dynamic>{'token': info.token},
      ),
    );

    // Simulated server binding latency.
    await Future<void>.delayed(const Duration(milliseconds: 900));

    session = SessionInfo(
      sessionId: 'sess_${info.token}',
      displayId: 'disp_${info.host}',
      salesperson: person,
    );
    status = ConnectionStatus.connected;

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
}
