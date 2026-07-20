import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_icons.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../models/customer.dart';
import '../../models/session.dart';
import '../../widgets/app_button.dart';
import '../../widgets/initials_avatar.dart';
import '../auth/auth_controller.dart';
import '../cart/cart_controller.dart';
import '../connection/connection_controller.dart';
import '../customer/customer_directory_controller.dart';
import '../presentation/presentation_controller.dart';
import '../onboarding/onboarding_controller.dart';

/// The associate's home base: their account details, the book of saved customer
/// profiles (with quick add), and shortcuts to saved outfits / recommendations /
/// sign out.
///
/// There is deliberately **no personal profile** here — the backend exposes only
/// name, title and username for a salesperson, so there is nothing further to
/// edit or store.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final Salesperson? me = context.watch<AuthController>().salesperson;
    final CustomerDirectoryController directory = context
        .watch<CustomerDirectoryController>();
    final OnboardingController onboarding = context
        .watch<OnboardingController>();
    final Customer? active = onboarding.customer;
    final List<Customer> profiles = directory.profiles;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(AppIcons.back, size: 18),
          onPressed: () => context.pop(),
        ),
        title: Text('Profile', style: t.titleLarge),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl,
          AppSpacing.md,
          AppSpacing.xl,
          AppSpacing.xxl,
        ),
        children: <Widget>[
          // ── Who is signed in ─────────────────────────────────────────────
          Row(
            children: <Widget>[
              InitialsAvatar(name: me?.name, radius: 32),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(me?.name ?? 'Associate', style: t.titleLarge),
                    if (me?.username != null)
                      Text(
                        '@${me!.username}',
                        style: t.bodyMedium?.copyWith(color: c.textSecondary),
                      ),
                    if (me?.title != null && me!.title!.isNotEmpty)
                      Text(
                        me.title!,
                        style: t.bodySmall?.copyWith(color: c.accent),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),

          // ── Customer book ────────────────────────────────────────────────
          Row(
            children: <Widget>[
              Text('CUSTOMERS', style: AppTypography.eyebrow(c.accent)),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: Divider(color: c.divider)),
            ],
          ),
          const SizedBox(height: AppSpacing.md),

          if (active != null && !active.isEmpty)
            _ActiveCard(customer: active),

          if (profiles.isEmpty)
            const _EmptyBook()
          else
            ...profiles.map(
              (Customer p) => _CustomerTile(
                customer: p,
                isActive: p.id == active?.id,
                onUse: () {
                  context.read<OnboardingController>().updateProfile(p);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        '${CustomerDirectoryController.labelFor(p)} is now the '
                        'active guest.',
                      ),
                    ),
                  );
                },
                onEdit: () {
                  context.read<OnboardingController>().updateProfile(p);
                  context.push(AppRoutes.customerProfile);
                },
                onDelete: () => _confirmDelete(context, p),
              ),
            ),

          const SizedBox(height: AppSpacing.md),
          AppButton(
            label: 'Add new customer',
            icon: Icons.person_add_alt_1_outlined,
            expand: true,
            onPressed: () {
              // Start a blank profile, then open the editor.
              context.read<OnboardingController>().updateProfile(
                const Customer(id: 'draft'),
              );
              context.push(AppRoutes.customerProfile);
            },
          ),
          const SizedBox(height: AppSpacing.xl),

          // ── Shortcuts ────────────────────────────────────────────────────
          _HubTile(
            icon: AppIcons.cart,
            label: 'Saved outfits',
            subtitle: context.watch<CartController>().cart.count == 0
                ? 'Nothing saved yet'
                : '${context.watch<CartController>().cart.count} item(s) saved',
            onTap: () => context.push(AppRoutes.cart),
          ),
          _HubTile(
            icon: AppIcons.sparkle,
            label: 'Recommendations',
            subtitle: 'Curated picks for the active guest',
            onTap: () => context.push(AppRoutes.recommendations),
          ),
          _HubTile(
            icon: AppIcons.qrCode,
            label: 'Close session',
            subtitle: 'Finish with this guest — the display returns to the QR',
            onTap: () => _confirmCloseSession(context),
          ),
          _HubTile(
            icon: AppIcons.logout,
            label: 'Sign out',
            subtitle: 'Ends the session and signs you out',
            onTap: () => _confirmLogout(context),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, Customer p) async {
    final bool ok =
        await showDialog<bool>(
          context: context,
          builder: (BuildContext ctx) => AlertDialog(
            title: const Text('Delete customer?'),
            content: Text(
              'This removes ${CustomerDirectoryController.labelFor(p)} from your '
              'saved customers.',
            ),
            actions: <Widget>[
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                child: const Text('Delete'),
              ),
            ],
          ),
        ) ??
        false;
    if (!ok || !context.mounted) return;
    await context.read<CustomerDirectoryController>().remove(p.id);
  }
}

class _ActiveCard extends StatelessWidget {
  const _ActiveCard({required this.customer});
  final Customer customer;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: c.accent.withValues(alpha: 0.10),
        borderRadius: AppRadius.brLg,
        border: Border.all(color: c.accent),
      ),
      child: Row(
        children: <Widget>[
          Icon(AppIcons.connected, size: 18, color: c.accent),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  'ACTIVE THIS SESSION',
                  style: AppTypography.eyebrow(c.accent),
                ),
                const SizedBox(height: 2),
                Text(
                  CustomerDirectoryController.labelFor(customer),
                  style: t.titleSmall,
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () => context.push(AppRoutes.customerProfile),
            child: const Text('Open'),
          ),
        ],
      ),
    );
  }
}

class _CustomerTile extends StatelessWidget {
  const _CustomerTile({
    required this.customer,
    required this.isActive,
    required this.onUse,
    required this.onEdit,
    required this.onDelete,
  });

  final Customer customer;
  final bool isActive;
  final VoidCallback onUse;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadius.brLg,
        border: Border.all(color: isActive ? c.accent : c.border),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        onTap: onEdit,
        leading: InitialsAvatar(
          name: CustomerDirectoryController.labelFor(customer),
          radius: 18,
        ),
        title: Row(
          children: <Widget>[
            Flexible(
              child: Text(
                CustomerDirectoryController.labelFor(customer),
                style: t.titleSmall,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (customer.isRepeatCustomer) ...<Widget>[
              const SizedBox(width: AppSpacing.xs),
              Icon(Icons.star, size: 14, color: c.accent),
            ],
          ],
        ),
        subtitle: Text(
          CustomerDirectoryController.summaryFor(customer),
          style: t.bodySmall?.copyWith(color: c.textSecondary),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (String v) {
            if (v == 'use') onUse();
            if (v == 'edit') onEdit();
            if (v == 'delete') onDelete();
          },
          itemBuilder: (_) => <PopupMenuEntry<String>>[
            if (!isActive)
              const PopupMenuItem<String>(
                value: 'use',
                child: Text('Use for this session'),
              ),
            const PopupMenuItem<String>(value: 'edit', child: Text('Edit')),
            const PopupMenuItem<String>(value: 'delete', child: Text('Delete')),
          ],
        ),
      ),
    );
  }
}

class _EmptyBook extends StatelessWidget {
  const _EmptyBook();

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadius.brLg,
        border: Border.all(color: c.border),
      ),
      child: Column(
        children: <Widget>[
          Text('No saved customers yet', style: t.titleSmall),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Add a customer and they will appear here for future visits.',
            style: t.bodySmall?.copyWith(color: c.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

/// A single navigation row in the profile hub.
class _HubTile extends StatelessWidget {
  const _HubTile({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadius.brLg,
        border: Border.all(color: c.border),
      ),
      child: ListTile(
        onTap: onTap,
        leading: Icon(icon, color: c.accent, size: 22),
        title: Text(label, style: t.titleSmall),
        subtitle: Text(
          subtitle,
          style: t.bodySmall?.copyWith(color: c.textSecondary),
        ),
        trailing: Icon(Icons.chevron_right, color: c.textTertiary),
      ),
    );
  }
}

/// Confirm, end the live session (freeing the display), then sign out.
Future<void> _confirmLogout(BuildContext context) async {
  final bool ok =
      await showDialog<bool>(
        context: context,
        builder: (BuildContext ctx) => AlertDialog(
          title: const Text('Log out?'),
          content: const Text(
            'This ends the current session and signs you out.',
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Log out'),
            ),
          ],
        ),
      ) ??
      false;
  if (!ok || !context.mounted) return;
  context.read<ConnectionController>().disconnect();
  await context.read<AuthController>().logout();
}

/// End the customer session without signing out: the server frees the display,
/// which shows a closing beat and then a fresh pairing QR for the next guest.
Future<void> _confirmCloseSession(BuildContext context) async {
  final bool ok =
      await showDialog<bool>(
        context: context,
        builder: (BuildContext ctx) => AlertDialog(
          title: const Text('Close this session?'),
          content: const Text(
            'The display returns to the pairing QR, ready for the next guest. '
            'You stay signed in.',
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Close session'),
            ),
          ],
        ),
      ) ??
      false;
  if (!ok || !context.mounted) return;
  context.read<PresentationController>().hideProduct();
  await context.read<ConnectionController>().endSession();
}
