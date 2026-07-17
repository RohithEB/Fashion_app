import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/config/app_config.dart';
import '../../core/restart_widget.dart';
import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../widgets/app_button.dart';
import '../settings/server_settings_sheet.dart';
import 'auth_controller.dart';

/// Boutique sign-in. Login gates the whole app — a successful sign-in lets the
/// associate through to pair a display. New associates register first.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _username = TextEditingController();
  final TextEditingController _password = TextEditingController();

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    final AuthController auth = context.read<AuthController>();
    await auth.login(username: _username.text.trim(), password: _password.text);
    // On success the router guard redirects to the connect screen automatically.
  }

  Future<void> _openSettings() async {
    final bool? saved = await ServerSettingsSheet.show(context);
    // Rebuild the app root so the repositories re-resolve (mock <-> backend).
    if (saved == true && mounted) RestartWidget.restart(context);
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final AuthController auth = context.watch<AuthController>();

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const SizedBox(height: AppSpacing.lg),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton.icon(
                    onPressed: _openSettings,
                    icon: const Icon(Icons.settings_outlined, size: 18),
                    label: Text(
                      AppConfig.backendMode
                          ? 'Server: ${AppConfig.backendHost}'
                          : 'Offline mode',
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                Text('THE STUDIO', style: AppTypography.eyebrow(c.accent)),
                const SizedBox(height: AppSpacing.sm),
                Text('Ebani', style: t.displaySmall),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Sign in to begin a personal showroom session.',
                  style: t.bodyLarge?.copyWith(color: c.textSecondary),
                ),
                const SizedBox(height: AppSpacing.xxl),
                TextFormField(
                  controller: _username,
                  autocorrect: false,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Username',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (String? v) => (v == null || v.trim().isEmpty)
                      ? 'Enter your username'
                      : null,
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _password,
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                  validator: (String? v) =>
                      (v == null || v.isEmpty) ? 'Enter your password' : null,
                ),
                if (auth.error != null) ...<Widget>[
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    auth.error!,
                    style: t.bodySmall?.copyWith(color: c.error),
                  ),
                ],
                const SizedBox(height: AppSpacing.xl),
                AppButton(
                  label: auth.isBusy ? 'Signing in…' : 'Sign in',
                  expand: true,
                  isLoading: auth.isBusy,
                  onPressed: auth.isBusy ? null : _submit,
                ),
                const SizedBox(height: AppSpacing.md),
                Center(
                  child: TextButton(
                    onPressed: auth.isBusy
                        ? null
                        : () {
                            context.read<AuthController>().clearError();
                            context.push(AppRoutes.register);
                          },
                    child: Text(
                      'New associate? Create an account',
                      style: t.bodyMedium?.copyWith(color: c.accent),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
