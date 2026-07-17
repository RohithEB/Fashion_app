import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_icons.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../widgets/app_button.dart';
import 'auth_controller.dart';

/// Create a salesperson account. On success the associate is signed in
/// immediately (a token is issued) and the router advances to pairing.
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _name = TextEditingController();
  final TextEditingController _title = TextEditingController();
  final TextEditingController _username = TextEditingController();
  final TextEditingController _password = TextEditingController();
  final TextEditingController _confirm = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _title.dispose();
    _username.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    final AuthController auth = context.read<AuthController>();
    final bool ok = await auth.register(
      name: _name.text.trim(),
      title: _title.text.trim(),
      username: _username.text.trim(),
      password: _password.text,
    );
    // On success the router guard advances to the connect screen; pop this
    // route so it isn't left underneath in the back stack.
    if (ok && mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final AuthController auth = context.watch<AuthController>();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(AppIcons.back, size: 18),
          onPressed: () {
            context.read<AuthController>().clearError();
            context.pop();
          },
        ),
        title: Text('Create account', style: t.titleLarge),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const SizedBox(height: AppSpacing.lg),
                Text('NEW ASSOCIATE', style: AppTypography.eyebrow(c.accent)),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Set up your studio profile to start showing collections.',
                  style: t.bodyLarge?.copyWith(color: c.textSecondary),
                ),
                const SizedBox(height: AppSpacing.xl),
                TextFormField(
                  controller: _name,
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Full name',
                    prefixIcon: Icon(Icons.badge_outlined),
                  ),
                  validator: (String? v) => (v == null || v.trim().isEmpty)
                      ? 'Enter your name'
                      : null,
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _title,
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Title (optional)',
                    hintText: 'e.g. Senior Style Advisor',
                    prefixIcon: Icon(Icons.workspace_premium_outlined),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _username,
                  autocorrect: false,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Username',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (String? v) {
                    final String value = v?.trim() ?? '';
                    if (value.isEmpty) return 'Choose a username';
                    if (value.length < 3) return 'At least 3 characters';
                    return null;
                  },
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _password,
                  obscureText: true,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                  validator: (String? v) => (v == null || v.length < 4)
                      ? 'At least 4 characters'
                      : null,
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _confirm,
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: const InputDecoration(
                    labelText: 'Confirm password',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                  validator: (String? v) =>
                      (v != _password.text) ? 'Passwords do not match' : null,
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
                  label: auth.isBusy ? 'Creating account…' : 'Create account',
                  expand: true,
                  isLoading: auth.isBusy,
                  onPressed: auth.isBusy ? null : _submit,
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
