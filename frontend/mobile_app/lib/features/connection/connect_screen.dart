import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_icons.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../widgets/app_button.dart';
import 'connection_controller.dart';

/// Pairing entry point: scan the QR shown on a display to connect over WiFi.
/// A "demo display" shortcut connects with a synthetic pairing code so the flow
/// is always demoable without a physical screen.
class ConnectScreen extends StatelessWidget {
  const ConnectScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final ConnectionController conn = context.watch<ConnectionController>();
    final bool connecting = conn.status == ConnectionStatus.connecting;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const SizedBox(height: AppSpacing.xl),
              Text('PAIR A DISPLAY', style: AppTypography.eyebrow(c.accent)),
              const SizedBox(height: AppSpacing.sm),
              Text('Connect to a screen', style: t.headlineMedium),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Scan the QR code shown on the showroom display to begin a '
                'synchronized session with your client.',
                style: t.bodyLarge?.copyWith(color: c.textSecondary),
              ),
              const Spacer(),
              Center(
                child: Container(
                  width: 168,
                  height: 168,
                  decoration: BoxDecoration(
                    color: c.surface,
                    borderRadius: AppRadius.brXl,
                    border: Border.all(color: c.border),
                  ),
                  child: Icon(AppIcons.qrScan, size: 72, color: c.accent),
                ),
              ),
              const Spacer(),
              if (conn.status == ConnectionStatus.error && conn.error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: Text(
                    conn.error!,
                    style: t.bodySmall?.copyWith(color: c.error),
                  ),
                ),
              AppButton(
                label: connecting ? 'Connecting…' : 'Scan display QR',
                icon: AppIcons.qrScan,
                expand: true,
                isLoading: connecting,
                onPressed: connecting ? null : () => _scan(context),
              ),
              const SizedBox(height: AppSpacing.sm),
              AppButton(
                label: 'Connect to demo display',
                variant: AppButtonVariant.outline,
                expand: true,
                onPressed: connecting
                    ? null
                    : () => context.read<ConnectionController>().connectFromQr(
                          'http://192.168.1.42:8080/pair?token=DEMO-8421',
                        ),
              ),
              const SizedBox(height: AppSpacing.xl),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _scan(BuildContext context) async {
    final ConnectionController conn = context.read<ConnectionController>();
    final String? code = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _ScannerSheet(),
    );
    if (code != null) await conn.connectFromQr(code);
  }
}

class _ScannerSheet extends StatelessWidget {
  const _ScannerSheet();

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.7,
      child: Column(
        children: <Widget>[
          const SizedBox(height: AppSpacing.md),
          Text('Scan display QR', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: AppSpacing.md),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: ClipRRect(
                borderRadius: AppRadius.brLg,
                child: MobileScanner(
                  onDetect: (BarcodeCapture capture) {
                    final String? value =
                        capture.barcodes.firstOrNull?.rawValue;
                    if (value != null && value.isNotEmpty) {
                      Navigator.of(context).pop(value);
                    }
                  },
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Text(
              'Point the camera at the code on the screen',
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: c.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}
