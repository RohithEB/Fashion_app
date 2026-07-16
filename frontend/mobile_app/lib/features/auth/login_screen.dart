import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../models/session.dart';
import '../connection/connection_controller.dart';

/// Boutique sign-in. For the POC the associate is chosen from a short roster
/// (mock auth); replacing [_mockRoster] with a real AuthRepository is a
/// drop-in change.
class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  static const List<Salesperson> _mockRoster = <Salesperson>[
    Salesperson(id: 's1', name: 'Éléonore', title: 'Senior Style Advisor'),
    Salesperson(id: 's2', name: 'Marcus', title: 'Client Advisor'),
    Salesperson(id: 's3', name: 'Sofia', title: 'Atelier Specialist'),
  ];

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const Spacer(flex: 2),
              Text('ATELIER', style: AppTypography.eyebrow(c.accent)),
              const SizedBox(height: AppSpacing.sm),
              Text('Maison Ébani', style: t.displaySmall),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Sign in to begin a personal showroom session.',
                style: t.bodyLarge?.copyWith(color: c.textSecondary),
              ),
              const Spacer(),
              Text(
                'SELECT ASSOCIATE',
                style: AppTypography.eyebrow(c.textTertiary),
              ),
              const SizedBox(height: AppSpacing.md),
              ..._mockRoster.map(
                (Salesperson p) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: _AssociateTile(person: p),
                ),
              ),
              const Spacer(flex: 3),
            ],
          ),
        ),
      ),
    );
  }
}

class _AssociateTile extends StatelessWidget {
  const _AssociateTile({required this.person});

  final Salesperson person;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Material(
      color: c.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: c.border),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.read<ConnectionController>().login(person),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: <Widget>[
              CircleAvatar(
                radius: 24,
                backgroundColor: c.accent.withValues(alpha: 0.16),
                child: Text(
                  person.name.characters.first,
                  style: t.titleMedium?.copyWith(color: c.accent),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(person.name, style: t.titleMedium),
                    if (person.title != null)
                      Text(
                        person.title!,
                        style: t.bodySmall?.copyWith(color: c.textSecondary),
                      ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 16,
                color: c.textTertiary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
