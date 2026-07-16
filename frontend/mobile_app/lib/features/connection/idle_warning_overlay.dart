import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_icons.dart';
import '../../core/theme/app_motion.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../widgets/app_button.dart';
import 'connection_controller.dart';

/// Global overlay that surfaces the display's idle-timeout warning to the
/// associate with a live countdown and a one-tap "keep session" action.
class IdleWarningOverlay extends StatelessWidget {
  const IdleWarningOverlay({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final bool warning =
        context.select<ConnectionController, bool>((ConnectionController c) => c.idleWarning);
    final int seconds =
        context.select<ConnectionController, int>((ConnectionController c) => c.idleSecondsLeft);
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;

    return Stack(
      children: <Widget>[
        child,
        Positioned(
          left: AppSpacing.md,
          right: AppSpacing.md,
          bottom: AppSpacing.md,
          child: AnimatedSlide(
            duration: AppMotion.base,
            curve: AppMotion.emphasized,
            offset: warning ? Offset.zero : const Offset(0, 2),
            child: AnimatedOpacity(
              duration: AppMotion.base,
              opacity: warning ? 1 : 0,
              child: IgnorePointer(
                ignoring: !warning,
                child: SafeArea(
                  child: Material(
                    color: c.primary,
                    borderRadius: AppRadius.brLg,
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      child: Row(
                        children: <Widget>[
                          Icon(AppIcons.warning, color: c.accent),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: <Widget>[
                                Text('SESSION IDLE', style: AppTypography.eyebrow(c.accent)),
                                const SizedBox(height: 2),
                                Text(
                                  'Ending in ${seconds}s',
                                  style: t.titleSmall?.copyWith(color: c.onPrimary),
                                ),
                              ],
                            ),
                          ),
                          AppButton(
                            label: "I'm still here",
                            size: AppButtonSize.small,
                            onPressed: () =>
                                context.read<ConnectionController>().keepAlive(),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
