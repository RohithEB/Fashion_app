import 'package:flutter/material.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../widgets/app_button.dart';

/// In-app server configuration: switch between the offline/mock stack and the
/// Node backend, and set the backend host/port at runtime (persisted). Returns
/// `true` when settings were saved so the caller can restart the app root.
class ServerSettingsSheet extends StatefulWidget {
  const ServerSettingsSheet({super.key});

  static Future<bool?> show(BuildContext context) => showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    builder: (_) => const ServerSettingsSheet(),
  );

  @override
  State<ServerSettingsSheet> createState() => _ServerSettingsSheetState();
}

class _ServerSettingsSheetState extends State<ServerSettingsSheet> {
  late bool _backend = AppConfig.backendMode;
  late final TextEditingController _host = TextEditingController(
    text: AppConfig.backendHost,
  );
  late final TextEditingController _port = TextEditingController(
    text: AppConfig.backendPort.toString(),
  );

  @override
  void dispose() {
    _host.dispose();
    _port.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    await AppConfig.save(
      backend: _backend,
      host: _host.text,
      port: int.tryParse(_port.text.trim()),
    );
    if (mounted) Navigator.of(context).pop(true);
  }

  Future<void> _reset() async {
    await AppConfig.clear();
    if (mounted) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.xl,
        AppSpacing.lg,
        AppSpacing.xl,
        MediaQuery.of(context).viewInsets.bottom + AppSpacing.xl,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text('SERVER', style: AppTypography.eyebrow(c.accent)),
          const SizedBox(height: AppSpacing.xs),
          Text('Connection settings', style: t.titleLarge),
          const SizedBox(height: AppSpacing.md),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text('Use backend server', style: t.titleMedium),
            subtitle: Text(
              _backend
                  ? 'Live catalog, accounts, orders & realtime.'
                  : 'Offline demo (in-app mock data).',
              style: t.bodySmall?.copyWith(color: c.textSecondary),
            ),
            value: _backend,
            onChanged: (bool v) => setState(() => _backend = v),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _host,
            enabled: _backend,
            keyboardType: TextInputType.url,
            autocorrect: false,
            decoration: const InputDecoration(
              labelText: 'Host (server IP)',
              hintText: 'e.g. 192.168.1.5',
              prefixIcon: Icon(Icons.dns_outlined),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: _port,
            enabled: _backend,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Port',
              hintText: '3000',
              prefixIcon: Icon(Icons.tag),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'On a real device use the server PC\'s LAN IP (from ipconfig) — '
            'not localhost. Saving restarts the app to apply.',
            style: t.bodySmall?.copyWith(color: c.textSecondary),
          ),
          const SizedBox(height: AppSpacing.lg),
          AppButton(label: 'Save & apply', expand: true, onPressed: _save),
          const SizedBox(height: AppSpacing.sm),
          Center(
            child: TextButton(
              onPressed: _reset,
              child: Text(
                'Reset to defaults',
                style: t.bodyMedium?.copyWith(color: c.textSecondary),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
