import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_icons.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../models/category.dart';
import '../../models/customer.dart';
import '../../models/product.dart';
import '../../widgets/app_button.dart';
import '../catalog/catalog_controller.dart';
import '../connection/connection_controller.dart';
import '../customer/widgets/customer_form.dart';
import '../presentation/presentation_controller.dart';
import 'onboarding_controller.dart';

/// Shown right after the display is paired: the guest's details, so the
/// associate can tailor the session. Everything is optional — Continue saves
/// whatever was entered (or skips if blank); Skip proceeds without saving.
/// On completion the catalogue is pushed to the display and the associate lands
/// on the curated recommendations.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  Customer _draft = const Customer(id: 'draft');

  Future<void> _continue() async {
    final OnboardingController onboarding = context
        .read<OnboardingController>();
    final String? sessionId = context
        .read<ConnectionController>()
        .session
        ?.sessionId;
    final bool ok = await onboarding.submit(
      sessionId: sessionId,
      draft: _draft,
    );
    if (ok && mounted) {
      _revealCatalogue();
      // A profile was captured → open the curated picks tailored to the guest.
      context.go(AppRoutes.recommendations);
    }
  }

  void _skip() {
    final String? sessionId = context
        .read<ConnectionController>()
        .session
        ?.sessionId;
    context.read<OnboardingController>().skip(sessionId);
    _revealCatalogue();
  }

  /// Push the catalogue to the display; the router guard then advances the
  /// associate to the browsing home now that onboarding is complete.
  void _revealCatalogue() {
    context.read<PresentationController>().showCatalog();
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    final OnboardingController onboarding = context
        .watch<OnboardingController>();
    final CatalogController catalog = context.watch<CatalogController>();
    final List<String> brands = _brandsFrom(catalog.products);
    final List<String> categories = catalog.categories
        .map((Category c) => c.name)
        .toList();

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Text('Customer profile', style: t.titleLarge),
        actions: <Widget>[
          TextButton(
            onPressed: onboarding.submitting ? null : _skip,
            child: Text(
              'Skip',
              style: t.titleSmall?.copyWith(color: c.accent),
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: <Widget>[
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    const SizedBox(height: AppSpacing.md),
                    Text('GUEST PROFILE', style: AppTypography.eyebrow(c.accent)),
                    const SizedBox(height: AppSpacing.sm),
                    Text('Personalise the session', style: t.displaySmall),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      'All optional — anything you capture sharpens the '
                      'recommendations for this guest. Skip to start browsing '
                      'straight away.',
                      style: t.bodyLarge?.copyWith(color: c.textSecondary),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    CustomerForm(
                      initial: onboarding.customer ?? const Customer(id: 'draft'),
                      genders: onboarding.options.genders,
                      ageRanges: onboarding.options.ageRanges,
                      personalities: onboarding.options.personalities,
                      brands: brands,
                      categories: categories,
                      onChanged: (Customer v) => _draft = v,
                    ),
                    if (onboarding.error != null) ...<Widget>[
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        onboarding.error!,
                        style: t.bodySmall?.copyWith(color: c.error),
                      ),
                    ],
                    const SizedBox(height: AppSpacing.xl),
                  ],
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(
                AppSpacing.xl,
                AppSpacing.sm,
                AppSpacing.xl,
                MediaQuery.of(context).padding.bottom + AppSpacing.md,
              ),
              child: Column(
                children: <Widget>[
                  AppButton(
                    label: onboarding.submitting
                        ? 'Saving…'
                        : 'Show recommendations',
                    icon: AppIcons.sparkle,
                    expand: true,
                    isLoading: onboarding.submitting,
                    onPressed: onboarding.submitting ? null : _continue,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  AppButton(
                    label: 'Skip for now',
                    variant: AppButtonVariant.outline,
                    expand: true,
                    onPressed: onboarding.submitting ? null : _skip,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Distinct catalogue brands, offered as preferred-brand chips.
  static List<String> _brandsFrom(List<Product> products) {
    final Set<String> seen = <String>{};
    for (final Product p in products) {
      if (p.brand.trim().isNotEmpty) seen.add(p.brand.trim());
    }
    final List<String> list = seen.toList()..sort();
    return list;
  }
}
