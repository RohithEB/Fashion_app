import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';

/// A circular avatar showing the initials of [name] (max two letters).
/// Used for the associate in the app bar and on the profile page.
class InitialsAvatar extends StatelessWidget {
  const InitialsAvatar({required this.name, this.radius = 22, super.key});

  final String? name;
  final double radius;

  String get _initials {
    final String source = (name ?? '').trim();
    if (source.isEmpty) return '?';
    final List<String> parts = source
        .split(RegExp(r'\s+'))
        .where((String p) => p.isNotEmpty)
        .toList();
    if (parts.length == 1) {
      final String p = parts.first;
      return (p.length >= 2 ? p.substring(0, 2) : p.substring(0, 1))
          .toUpperCase();
    }
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return Container(
      width: radius * 2,
      height: radius * 2,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: c.accent.withValues(alpha: 0.14),
        border: Border.all(color: c.accent, width: 1.5),
      ),
      child: Text(
        _initials,
        style: TextStyle(
          color: c.accent,
          fontSize: radius * 0.72,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

/// Formats a date as `12 Mar 1995` (no intl dependency).
String formatDate(DateTime d) {
  const List<String> months = <String>[
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${d.day} ${months[d.month - 1]} ${d.year}';
}
