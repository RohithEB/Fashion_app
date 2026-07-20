import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'connection_controller.dart';

/// Ends the session after [idleTimeout] of no touch input on the controller.
/// On timeout it closes the session (the display returns to idle + QR) and the
/// associate is dropped back to the connect screen.
class IdleSessionWatcher extends StatefulWidget {
  const IdleSessionWatcher({required this.child, super.key});

  final Widget child;

  static const Duration idleTimeout = Duration(minutes: 1);

  @override
  State<IdleSessionWatcher> createState() => _IdleSessionWatcherState();
}

class _IdleSessionWatcherState extends State<IdleSessionWatcher> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _restart();
  }

  void _restart() {
    _timer?.cancel();
    _timer = Timer(IdleSessionWatcher.idleTimeout, _onIdle);
  }

  void _onIdle() {
    final ConnectionController conn = context.read<ConnectionController>();
    if (conn.isConnected) {
      conn.endSession();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      behavior: HitTestBehavior.translucent,
      onPointerDown: (_) => _restart(),
      child: widget.child,
    );
  }
}
