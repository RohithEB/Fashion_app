import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../core/theme/app_colors.dart';

/// Plays a looping, muted, auto-playing video from the backend Video API
/// (`/media/...`), scaled to cover its box. Falls back to a calm skeleton while
/// it loads or if it can't play, so the screen is never blank.
class WelcomeVideo extends StatefulWidget {
  const WelcomeVideo({required this.url, super.key});

  final String url;

  @override
  State<WelcomeVideo> createState() => _WelcomeVideoState();
}

class _WelcomeVideoState extends State<WelcomeVideo> {
  VideoPlayerController? _controller;
  bool _ready = false;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      final VideoPlayerController c = VideoPlayerController.networkUrl(
        Uri.parse(widget.url),
      );
      _controller = c;
      await c.initialize();
      await c.setLooping(true);
      await c.setVolume(0);
      await c.play();
      if (mounted) setState(() => _ready = true);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    if (!_ready || _controller == null || _failed) {
      return ColoredBox(color: c.surface);
    }
    final VideoPlayerController ctrl = _controller!;
    return ClipRect(
      child: FittedBox(
        fit: BoxFit.cover,
        clipBehavior: Clip.hardEdge,
        child: SizedBox(
          width: ctrl.value.size.width,
          height: ctrl.value.size.height,
          child: VideoPlayer(ctrl),
        ),
      ),
    );
  }
}
