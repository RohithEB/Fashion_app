import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_icons.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../models/category.dart';
import '../../models/customer.dart';
import '../../models/product.dart';
import '../../widgets/app_button.dart';
import '../catalog/catalog_controller.dart';
import '../connection/connection_controller.dart';
import '../onboarding/onboarding_controller.dart';
import '../../widgets/initials_avatar.dart' show formatDate;
import 'customer_directory_controller.dart';
import 'widgets/customer_form.dart';

/// The guest's profile for the **current shopping session**. The associate can
/// add or refine details at any time; changes apply immediately and sharpen the
/// recommendations for the rest of the session.
class CustomerProfileScreen extends StatefulWidget {
  const CustomerProfileScreen({super.key});

  @override
  State<CustomerProfileScreen> createState() => _CustomerProfileScreenState();
}

class _CustomerProfileScreenState extends State<CustomerProfileScreen> {
  bool _editing = false;
  bool _savedThisVisit = false;
  late Customer _draft;

  @override
  void initState() {
    super.initState();
    _draft = _current;
  }

  Customer get _current =>
      context.read<OnboardingController>().customer ??
      const Customer(id: 'draft');

  Future<void> _save() async {
    final OnboardingController onboarding = context.read<OnboardingController>();
    // Nothing captured yet this session → persist through the API first so the
    // guest gets a real record; otherwise update the in-session profile.
    if (onboarding.customer == null) {
      final String? sessionId = context
          .read<ConnectionController>()
          .session
          ?.sessionId;
      final bool ok = await onboarding.submit(
        sessionId: sessionId,
        draft: _draft,
      );
      if (!mounted) return;
      if (ok) {
        await context
            .read<CustomerDirectoryController>()
            .save(onboarding.customer ?? _draft);
      }
      if (!mounted) return;
      setState(() {
        _editing = !ok;
        _savedThisVisit = _savedThisVisit || ok;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            ok ? 'Customer profile saved.' : 'Could not save the profile.',
          ),
        ),
      );
      return;
    }
    // Existing guest: PUT a partial update to the backend (only changed fields),
    // then keep the associate's local book in step with the canonical record.
    final String? sessionId = context
        .read<ConnectionController>()
        .session
        ?.sessionId;
    final bool ok = await onboarding.persistProfileUpdate(
      _draft,
      sessionId: sessionId,
    );
    if (!mounted) return;
    final Customer canonical = onboarding.customer ?? _draft;
    await context.read<CustomerDirectoryController>().save(canonical);
    if (!mounted) return;
    setState(() {
      _editing = false;
      _savedThisVisit = true;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          ok
              ? 'Customer profile updated.'
              : 'Saved on device — could not reach the server.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final OnboardingController onboarding = context
        .watch<OnboardingController>();
    final Customer guest = onboarding.customer ?? const Customer(id: 'draft');

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(AppIcons.back, size: 18),
          onPressed: () => context.pop(),
        ),
        title: Text('Customer profile', style: t.titleLarge),
        actions: <Widget>[
          if (!_editing)
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Edit customer details',
              onPressed: () => setState(() {
                _draft = guest;
                _editing = true;
              }),
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.xl,
          AppSpacing.md,
          AppSpacing.xl,
          AppSpacing.xxl,
        ),
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(guest.name ?? 'Guest', style: t.titleLarge),
                    if (guest.mobile != null)
                      Text(
                        guest.mobile!,
                        style: t.bodyMedium?.copyWith(color: c.textSecondary),
                      ),
                  ],
                ),
              ),
              if (guest.isRepeatCustomer)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: c.accent.withValues(alpha: 0.14),
                    borderRadius: AppRadius.brPill,
                    border: Border.all(color: c.accent),
                  ),
                  child: Text(
                    'REPEAT GUEST',
                    style: AppTypography.eyebrow(c.accent),
                  ),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),

          if (_editing) ...<Widget>[
            CustomerForm(
              initial: guest,
              genders: onboarding.options.genders,
              ageRanges: onboarding.options.ageRanges,
              personalities: onboarding.options.personalities,
              brands: _brandsFrom(context.watch<CatalogController>().products),
              categories: context
                  .watch<CatalogController>()
                  .categories
                  .map((Category cat) => cat.name)
                  .toList(),
              onChanged: (Customer v) => _draft = v,
            ),
            // Save/Cancel live in the pinned bottom bar so they stay reachable
            // however long the form gets.
          ] else ...<Widget>[
            // Recommendations are refreshed only when the associate asks — never
            // automatically after an edit.
            if (_savedThisVisit) ...<Widget>[
              AppButton(
                label: 'Update recommendations',
                icon: AppIcons.sparkle,
                expand: true,
                onPressed: () => context.push(AppRoutes.recommendations),
              ),
              const SizedBox(height: AppSpacing.lg),
            ],
            if (guest.isEmpty)
              _Empty(
                onAdd: () => setState(() {
                  _draft = guest;
                  _editing = true;
                }),
              ),
          ],
          if (!_editing && !guest.isEmpty) ...<Widget>[
            _Card(
              title: 'ABOUT',
              rows: <_Row>[
                _Row('Name', guest.name),
                _Row('Mobile', guest.mobile),
                _Row(
                  'Date of birth',
                  guest.dateOfBirth == null
                      ? null
                      : formatDate(guest.dateOfBirth!),
                ),
                _Row('Gender', guest.gender),
                _Row('Age range', guest.ageRange),
                _Row('Occupation', guest.occupation),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            _Card(
              title: 'STYLE PREFERENCES',
              rows: <_Row>[
                _Row('Style personality', guest.personality),
                _Row('Fashion style', _join(guest.fashionStyles)),
                _Row('Favourite colours', _join(guest.favoriteColors)),
                _Row('Preferred fit', guest.preferredFit),
                _Row('Top size', guest.topSize),
                _Row('Bottom size', guest.bottomSize),
                _Row('Shoe size', guest.shoeSize),
                _Row('Preferred brands', _join(guest.preferredBrands)),
                _Row('Budget', guest.budgetRange),
                _Row('Occasion', guest.occasion),
                _Row('Favourite categories', _join(guest.favoriteCategories)),
                _Row('Preferred fabrics', _join(guest.preferredFabrics)),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            _Card(
              title: 'SHOPPING FOR',
              rows: <_Row>[
                _Row('Styling for', guest.shoppingFor),
                _Row('Group size', guest.familySize?.toString()),
                _Row('Family', _join(guest.familyMembers)),
                _Row('Boys', guest.boysCount?.toString()),
                _Row('Girls', guest.girlsCount?.toString()),
                _Row('Children ages', _join(guest.childAgeRanges)),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            _Card(
              title: 'TODAY',
              rows: <_Row>[
                _Row('Current outfit', guest.currentOutfit),
                _Row('Wearing colour', guest.wearingColor),
                _Row('Styling', guest.styling),
                _Row('Notes', guest.notes),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'This profile belongs to the current session and is used to tailor '
              'recommendations.',
              style: t.bodySmall?.copyWith(color: c.textTertiary),
            ),
          ],
        ],
      ),
      // Pinned actions — always reachable, however long the form runs.
      bottomNavigationBar: _editing
          ? SafeArea(
              child: Container(
                color: c.background,
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.xl,
                  AppSpacing.sm,
                  AppSpacing.xl,
                  AppSpacing.sm,
                ),
                child: Row(
                  children: <Widget>[
                    TextButton(
                      onPressed: onboarding.submitting
                          ? null
                          : () => setState(() => _editing = false),
                      child: Text(
                        'Cancel',
                        style: t.bodyMedium?.copyWith(color: c.textSecondary),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: AppButton(
                        label: onboarding.submitting
                            ? 'Saving…'
                            : 'Save changes',
                        expand: true,
                        isLoading: onboarding.submitting,
                        onPressed: onboarding.submitting ? null : _save,
                      ),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }

  static String? _join(List<String> v) => v.isEmpty ? null : v.join(', ');

  static List<String> _brandsFrom(List<Product> products) {
    final Set<String> seen = <String>{};
    for (final Product p in products) {
      if (p.brand.trim().isNotEmpty) seen.add(p.brand.trim());
    }
    final List<String> list = seen.toList()..sort();
    return list;
  }
}

class _Row {
  const _Row(this.label, this.value);
  final String label;
  final String? value;
}

class _Card extends StatelessWidget {
  const _Card({required this.title, required this.rows});

  final String title;
  final List<_Row> rows;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final List<_Row> shown = rows
        .where((_Row r) => r.value != null && r.value!.trim().isNotEmpty)
        .toList();
    if (shown.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadius.brLg,
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(title, style: AppTypography.eyebrow(c.accent)),
          const SizedBox(height: AppSpacing.sm),
          for (final _Row r in shown)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 5),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  SizedBox(
                    width: 132,
                    child: Text(
                      r.label,
                      style: t.bodyMedium?.copyWith(color: c.textSecondary),
                    ),
                  ),
                  Expanded(child: Text(r.value!, style: t.bodyMedium)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty({required this.onAdd});
  final VoidCallback onAdd;

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
          Text(
            'No customer details captured',
            style: t.titleSmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Add a few optional details to sharpen this session’s '
            'recommendations.',
            style: t.bodySmall?.copyWith(color: c.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.md),
          AppButton(label: 'Add customer details', onPressed: onAdd),
        ],
      ),
    );
  }
}
