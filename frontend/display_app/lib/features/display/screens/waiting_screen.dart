import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../core/config/app_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../widgets/welcome_video.dart';
import '../display_controller.dart';

/// The idle pairing screen. The **backend model video** is the primary content;
/// the welcome text + pairing QR sit alongside it in a clean, balanced panel.
/// Tapping anywhere starts a hands-free demo session (POC only).
class WaitingScreen extends StatelessWidget {
  const WaitingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final DisplayController ctrl = context.read<DisplayController>();
    // The backend Video API (served over the LAN) — not a static/placeholder.
    final String videoUrl = AppConfig.media('/media/samples/model-360.mp4');

    return GestureDetector(
      onTap: ctrl.startDemoSession,
      child: ColoredBox(
        color: c.background,
        child: LayoutBuilder(
          builder: (BuildContext context, BoxConstraints constraints) {
            final bool portrait = constraints.maxHeight > constraints.maxWidth;
            final double pad = portrait ? AppSpacing.lg : AppSpacing.giant;

            final Widget video = ClipRRect(
              borderRadius: AppRadius.brXl,
              child: Stack(
                fit: StackFit.expand,
                children: <Widget>[
                  WelcomeVideo(url: videoUrl),
                  // Subtle scrim at the bottom for depth/legibility.
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: <Color>[Colors.transparent, Colors.black26],
                        stops: <double>[0.7, 1],
                      ),
                    ),
                  ),
                  Positioned(
                    left: AppSpacing.lg,
                    top: AppSpacing.lg,
                    child: Text(
                      'EBANI',
                      style: AppTypography.eyebrow(Colors.white),
                    ),
                  ),
                ],
              ),
            );

            final Widget panel = _PairPanel(
              url: ctrl.pairingUrl,
              portrait: portrait,
            );

            return Padding(
              padding: EdgeInsets.all(pad),
              child: portrait
                  ? Column(
                      children: <Widget>[
                        Expanded(flex: 7, child: video),
                        const SizedBox(height: AppSpacing.xl),
                        Expanded(flex: 3, child: panel),
                      ],
                    )
                  : Row(
                      children: <Widget>[
                        Expanded(flex: 6, child: video),
                        const SizedBox(width: AppSpacing.giant),
                        Expanded(flex: 4, child: panel),
                      ],
                    ),
            );
          },
        ),
      ),
    );
  }
}

/// Welcome text on one side, the pairing QR on the other — balanced for both
/// portrait (row) and landscape (column).
class _PairPanel extends StatelessWidget {
  const _PairPanel({required this.url, required this.portrait});

  final String url;
  final bool portrait;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;

    final Widget text = Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment:
          portrait ? CrossAxisAlignment.start : CrossAxisAlignment.center,
      children: <Widget>[
        Text('WELCOME', style: AppTypography.eyebrow(c.accent)),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'A private\nshowroom, for you.',
          textAlign: portrait ? TextAlign.start : TextAlign.center,
          style: AppTypography.displayHero(
            c.textPrimary,
          ).copyWith(fontSize: portrait ? 40 : 52),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'A style advisor will pair their device to begin.',
          textAlign: portrait ? TextAlign.start : TextAlign.center,
          style: t.titleSmall?.copyWith(
            color: c.textSecondary,
            fontWeight: FontWeight.w400,
          ),
        ),
      ],
    );

    final Widget qr = _QrCard(url: url, size: portrait ? 150 : 190);

    if (portrait) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: <Widget>[
          Expanded(child: text),
          const SizedBox(width: AppSpacing.xl),
          qr,
        ],
      );
    }
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: <Widget>[
        text,
        const SizedBox(height: AppSpacing.xl),
        qr,
      ],
    );
  }
}

class _QrCard extends StatelessWidget {
  const _QrCard({required this.url, required this.size});

  final String url;
  final double size;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadius.brXl,
        border: Border.all(color: c.border),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: AppRadius.brLg,
            ),
            child: QrImageView(
              data: url,
              version: QrVersions.auto,
              size: size,
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
          const SizedBox(height: AppSpacing.sm),
          Text('SCAN TO CONNECT', style: AppTypography.eyebrow(c.textSecondary)),
        ],
      ),
    );
  }
}
