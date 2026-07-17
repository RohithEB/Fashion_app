import 'package:flutter/widgets.dart';

/// Rebuilds the entire widget subtree below it on demand by swapping a key.
/// Used to re-resolve dependency injection after the server settings change so
/// the repositories (mock vs backend) are recreated without an OS-level restart.
class RestartWidget extends StatefulWidget {
  const RestartWidget({required this.child, super.key});

  final Widget child;

  /// Restart the app from anywhere below a [RestartWidget].
  static void restart(BuildContext context) {
    context.findAncestorStateOfType<_RestartWidgetState>()?.restart();
  }

  @override
  State<RestartWidget> createState() => _RestartWidgetState();
}

class _RestartWidgetState extends State<RestartWidget> {
  Key _key = UniqueKey();

  void restart() => setState(() => _key = UniqueKey());

  @override
  Widget build(BuildContext context) =>
      KeyedSubtree(key: _key, child: widget.child);
}
