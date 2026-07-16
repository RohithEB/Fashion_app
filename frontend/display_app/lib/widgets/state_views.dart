import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_icons.dart';
import '../core/theme/app_sizes.dart';
import '../core/theme/app_spacing.dart';
import 'app_button.dart';

/// Centralized empty / error / loading presentations.

class EmptyStateView extends StatelessWidget {
  const EmptyStateView({
    required this.title,
    this.message,
    this.icon = AppIcons.empty,
    this.action,
    super.key,
  });

  final String title;
  final String? message;
  final IconData icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(icon, size: AppSizes.iconXl, color: c.textTertiary),
            const SizedBox(height: AppSpacing.md),
            Text(title, style: t.titleMedium, textAlign: TextAlign.center),
            if (message != null) ...<Widget>[
              const SizedBox(height: AppSpacing.xs),
              Text(
                message!,
                style: t.bodyMedium?.copyWith(color: c.textSecondary),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...<Widget>[
              const SizedBox(height: AppSpacing.lg),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

class ErrorStateView extends StatelessWidget {
  const ErrorStateView({
    required this.message,
    this.title = 'Something went wrong',
    this.onRetry,
    super.key,
  });

  final String message;
  final String title;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(AppIcons.error, size: AppSizes.iconXl, color: c.error),
            const SizedBox(height: AppSpacing.md),
            Text(title, style: t.titleMedium, textAlign: TextAlign.center),
            const SizedBox(height: AppSpacing.xs),
            Text(
              message,
              style: t.bodyMedium?.copyWith(color: c.textSecondary),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...<Widget>[
              const SizedBox(height: AppSpacing.lg),
              AppButton(
                label: 'Try again',
                variant: AppButtonVariant.outline,
                onPressed: onRetry,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class LoadingView extends StatelessWidget {
  const LoadingView({this.label, super.key});

  final String? label;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          SizedBox(
            width: AppSizes.iconMd,
            height: AppSizes.iconMd,
            child: CircularProgressIndicator(strokeWidth: 2, color: c.accent),
          ),
          if (label != null) ...<Widget>[
            const SizedBox(height: AppSpacing.md),
            Text(label!, style: t.bodySmall?.copyWith(color: c.textSecondary)),
          ],
        ],
      ),
    );
  }
}
