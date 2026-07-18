import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_icons.dart';
import '../core/theme/app_motion.dart';

/// A network image with a tasteful skeleton placeholder and graceful error
/// fallback. Renders **SVG** sources too (the backend serves SVG placeholder
/// media at `/media/ph`), which `Image.network` cannot do on its own.
class NetworkPhoto extends StatelessWidget {
  const NetworkPhoto({
    required this.url,
    this.fit = BoxFit.cover,
    this.borderRadius = BorderRadius.zero,
    super.key,
  });

  final String? url;
  final BoxFit fit;
  final BorderRadius borderRadius;

  bool get _isSvg {
    final String u = url ?? '';
    return u.toLowerCase().endsWith('.svg') || u.contains('image/svg');
  }

  /// Query params of a backend `/media/ph` placeholder URL, if this is one. These
  /// are rendered fully on-device (no network), so the seeded catalog shows its
  /// exact labelled placeholders even offline / in box-as-server mode.
  Map<String, String>? get _placeholderParams {
    final String u = url ?? '';
    if (!u.contains('/media/ph')) return null;
    try {
      return Uri.parse(u).queryParameters;
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    Widget child;
    final Map<String, String>? ph = _placeholderParams;
    if (url == null || url!.isEmpty) {
      child = _placeholder(c, broken: true);
    } else if (ph != null) {
      child = _MediaPlaceholder(
        bg: _hexColor(ph['bg'], 0xFF1C1C1C),
        fg: _hexColor(ph['fg'], 0xFFFFFFFF),
        text: ph['text'] ?? 'Fashion',
      );
    } else if (_isSvg) {
      child = SvgPicture.network(
        url!,
        fit: fit,
        placeholderBuilder: (_) => _placeholder(c),
      );
    } else {
      child = Image.network(
        url!,
        fit: fit,
        loadingBuilder: (BuildContext ctx, Widget img, ImageChunkEvent? p) {
          if (p == null) return img;
          return _placeholder(c);
        },
        errorBuilder: (_, _, _) => _placeholder(c, broken: true),
        frameBuilder: (_, Widget img, int? frame, bool wasSync) {
          if (wasSync) return img;
          return AnimatedOpacity(
            opacity: frame == null ? 0 : 1,
            duration: AppMotion.slow,
            curve: AppMotion.decelerate,
            child: img,
          );
        },
      );
    }
    return ClipRRect(
      borderRadius: borderRadius,
      child: SizedBox.expand(child: child),
    );
  }

  Widget _placeholder(AppColors c, {bool broken = false}) => ColoredBox(
    color: c.skeleton,
    child: broken
        ? Center(child: Icon(AppIcons.gallery, color: c.textTertiary))
        : null,
  );

  static Color _hexColor(String? h, int fallback) {
    final String s = (h ?? '').replaceFirst('#', '');
    if (RegExp(r'^[0-9a-fA-F]{6}$').hasMatch(s)) {
      return Color(int.parse('FF$s', radix: 16));
    }
    if (RegExp(r'^[0-9a-fA-F]{3}$').hasMatch(s)) {
      final String r = s[0], g = s[1], b = s[2];
      return Color(int.parse('FF$r$r$g$g$b$b', radix: 16));
    }
    return Color(fallback);
  }
}

/// On-device render of the backend's `/media/ph` SVG placeholder: a vertical
/// gradient, an inset hairline frame and the two-line centred serif label —
/// visually matching the server output, but with no network dependency.
class _MediaPlaceholder extends StatelessWidget {
  const _MediaPlaceholder({
    required this.bg,
    required this.fg,
    required this.text,
  });

  final Color bg;
  final Color fg;
  final String text;

  @override
  Widget build(BuildContext context) {
    final List<String> words = text.split(' ');
    final int mid = (words.length / 2).ceil();
    final String label = <String>[
      words.take(mid).join(' '),
      words.skip(mid).join(' '),
    ].where((String s) => s.isNotEmpty).join('\n');

    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        final double w = constraints.maxWidth.isFinite
            ? constraints.maxWidth
            : 300;
        final double fontSize = (w / 12).clamp(12.0, 34.0);
        final double inset = (w * 0.035).clamp(6.0, 24.0);
        return DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: <Color>[bg, bg.withValues(alpha: 0.75)],
            ),
          ),
          child: Padding(
            padding: EdgeInsets.all(inset),
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: fg.withValues(alpha: 0.35), width: 2),
              ),
              child: Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: inset),
                  child: Text(
                    label,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: fg,
                      fontFamily: 'Georgia',
                      fontSize: fontSize,
                      height: 1.25,
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
