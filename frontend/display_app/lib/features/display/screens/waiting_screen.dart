import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../display_controller.dart';

/// The idle pairing screen: an elegant invitation on the left, the pairing QR
/// on the right. A salesperson scans the code to open a synchronized session.
/// Tapping anywhere starts a hands-free demo session (POC only).
class WaitingScreen extends StatelessWidget {
  const WaitingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final DisplayController ctrl = context.read<DisplayController>();

    return GestureDetector(
      onTap: ctrl.startDemoSession,
      child: ColoredBox(
        color: c.background,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.giant),
          child: Row(
            children: <Widget>[
              Expanded(
                flex: 3,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      'MAISON ÉBANI',
                      style: AppTypography.eyebrow(c.accent),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      'A private\nshowroom,\nfor you.',
                      style: AppTypography.displayHero(
                        c.textPrimary,
                      ).copyWith(fontSize: 80),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    Text(
                      'A style advisor will pair their device to begin your\n'
                      'personal session.',
                      style: t.titleMedium?.copyWith(
                        color: c.textSecondary,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.giant),
              Expanded(flex: 2, child: _QrCard(url: ctrl.pairingUrl)),
            ],
          ),
        ),
      ),
    );
  }
}

class _QrCard extends StatelessWidget {
  const _QrCard({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Center(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: AppRadius.brXl,
          border: Border.all(color: c.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: AppRadius.brLg,
              ),
              child: QrImageView(
                data: url,
                version: QrVersions.auto,
                size: 220,
                gapless: false,
                eyeStyle: const QrEyeStyle(
                  eyeShape: QrEyeShape.square,
                  color: Color(0xFF141210),
                ),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.square,
                  color: Color(0xFF141210),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'SCAN TO CONNECT',
              style: AppTypography.eyebrow(c.textSecondary),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Open the associate app and\nscan this code',
              textAlign: TextAlign.center,
              style: t.bodyMedium?.copyWith(color: c.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
