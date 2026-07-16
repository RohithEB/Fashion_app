import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_motion.dart';
import '../core/theme/app_radius.dart';
import '../core/theme/app_sizes.dart';
import '../core/theme/app_spacing.dart';

enum AppButtonVariant { primary, secondary, outline, ghost }

enum AppButtonSize { small, medium, large }

/// The canonical button for the whole app: loading state, optional leading
/// icon, full-width layout, and a subtle press-scale micro-interaction.
class AppButton extends StatefulWidget {
  const AppButton({
    required this.label,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.medium,
    this.icon,
    this.isLoading = false,
    this.expand = false,
    super.key,
  });

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final IconData? icon;
  final bool isLoading;
  final bool expand;

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> {
  bool _pressed = false;

  double get _height => switch (widget.size) {
    AppButtonSize.small => AppSizes.buttonSm,
    AppButtonSize.medium => AppSizes.buttonMd,
    AppButtonSize.large => AppSizes.buttonLg,
  };

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final bool enabled = widget.onPressed != null && !widget.isLoading;
    final TextStyle labelStyle =
        Theme.of(context).textTheme.labelLarge ?? const TextStyle();

    final (Color bg, Color fg, BoxBorder? border) = switch (widget.variant) {
      AppButtonVariant.primary => (c.primary, c.onPrimary, null),
      AppButtonVariant.secondary => (
        c.surface,
        c.textPrimary,
        Border.all(color: c.border),
      ),
      AppButtonVariant.outline => (
        Colors.transparent,
        c.textPrimary,
        Border.all(color: c.border),
      ),
      AppButtonVariant.ghost => (Colors.transparent, c.textPrimary, null),
    };

    return Semantics(
      button: true,
      enabled: enabled,
      label: widget.label,
      child: AnimatedScale(
        scale: _pressed && enabled ? 0.97 : 1,
        duration: AppMotion.instant,
        curve: AppMotion.standard,
        child: GestureDetector(
          onTapDown: enabled ? (_) => setState(() => _pressed = true) : null,
          onTapUp: enabled ? (_) => setState(() => _pressed = false) : null,
          onTapCancel: enabled ? () => setState(() => _pressed = false) : null,
          onTap: enabled ? widget.onPressed : null,
          child: AnimatedOpacity(
            opacity: enabled ? 1 : AppSizes.opacityDisabled,
            duration: AppMotion.fast,
            child: Container(
              height: _height,
              width: widget.expand ? double.infinity : null,
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
              decoration: BoxDecoration(
                color: bg,
                borderRadius: AppRadius.brMd,
                border: border,
              ),
              child: Row(
                mainAxisSize: widget.expand
                    ? MainAxisSize.max
                    : MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  if (widget.isLoading)
                    SizedBox(
                      width: AppSizes.iconSm,
                      height: AppSizes.iconSm,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(fg),
                      ),
                    )
                  else ...<Widget>[
                    if (widget.icon != null) ...<Widget>[
                      Icon(widget.icon, size: AppSizes.iconSm, color: fg),
                      const SizedBox(width: AppSpacing.xs),
                    ],
                    Flexible(
                      child: Text(
                        widget.label,
                        overflow: TextOverflow.ellipsis,
                        style: labelStyle.copyWith(color: fg),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
