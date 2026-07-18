import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../widgets/app_button.dart';
import '../connection/connection_controller.dart';
import '../presentation/presentation_controller.dart';
import 'onboarding_controller.dart';

/// Shown right after the display is paired: a light guest profile so the
/// associate can tailor the session. Everything is optional — Continue saves
/// whatever was entered (or skips if blank); Skip proceeds without saving.
/// On completion the catalogue is pushed to the display and the associate lands
/// on the browsing home.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final TextEditingController _name = TextEditingController();
  final TextEditingController _mobile = TextEditingController();
  final TextEditingController _currentOutfit = TextEditingController();
  final TextEditingController _styling = TextEditingController();
  final TextEditingController _wearingColor = TextEditingController();
  final TextEditingController _occasion = TextEditingController();
  String? _gender;
  String? _ageRange;
  String? _personality;

  @override
  void dispose() {
    _name.dispose();
    _mobile.dispose();
    _currentOutfit.dispose();
    _styling.dispose();
    _wearingColor.dispose();
    _occasion.dispose();
    super.dispose();
  }

  Future<void> _continue() async {
    final OnboardingController onboarding = context
        .read<OnboardingController>();
    final String? sessionId = context
        .read<ConnectionController>()
        .session
        ?.sessionId;
    final bool ok = await onboarding.submit(
      sessionId: sessionId,
      name: _name.text,
      mobile: _mobile.text,
      gender: _gender,
      ageRange: _ageRange,
      personality: _personality,
      currentOutfit: _currentOutfit.text,
      styling: _styling.text,
      wearingColor: _wearingColor.text,
      occasion: _occasion.text,
    );
    if (ok && mounted) {
      _revealCatalogue();
      // A profile was captured → open the curated top-6 recommendations first,
      // so the associate leads with picks tailored to the guest.
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

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: <Widget>[
            Expanded(
              child: SingleChildScrollView(
                // Extra bottom padding equal to the keyboard inset so a focused
                // field is never hidden behind the keyboard.
                padding: EdgeInsets.fromLTRB(
                  AppSpacing.xl,
                  0,
                  AppSpacing.xl,
                  AppSpacing.xl + MediaQuery.viewInsetsOf(context).bottom,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    const SizedBox(height: AppSpacing.xl),
                    Text(
                      'GUEST PROFILE',
                      style: AppTypography.eyebrow(c.accent),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text('Personalise the session', style: t.displaySmall),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      'Capture a few optional details to tailor the showing. '
                      'You can skip any of this.',
                      style: t.titleMedium?.copyWith(
                        color: c.textSecondary,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    TextField(
                      controller: _name,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(
                        labelText: 'Name (optional)',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    TextField(
                      controller: _mobile,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Mobile (optional)',
                        prefixIcon: Icon(Icons.phone_outlined),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    _ChipGroup(
                      label: 'GENDER',
                      options: onboarding.options.genders,
                      selected: _gender,
                      onSelect: (String? v) => setState(() => _gender = v),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    _ChipGroup(
                      label: 'AGE RANGE',
                      options: onboarding.options.ageRanges,
                      selected: _ageRange,
                      onSelect: (String? v) => setState(() => _ageRange = v),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    _ChipGroup(
                      label: 'STYLE PERSONALITY',
                      options: onboarding.options.personalities,
                      selected: _personality,
                      onSelect: (String? v) => setState(() => _personality = v),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      'WHAT ARE THEY WEARING?',
                      style: AppTypography.eyebrow(c.textSecondary),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    TextField(
                      controller: _currentOutfit,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: const InputDecoration(
                        labelText: 'Current outfit (optional)',
                        prefixIcon: Icon(Icons.checkroom_outlined),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    TextField(
                      controller: _wearingColor,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(
                        labelText: 'Colour they’re wearing (optional)',
                        prefixIcon: Icon(Icons.palette_outlined),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    TextField(
                      controller: _styling,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: const InputDecoration(
                        labelText: 'How they’re styling it (optional)',
                        prefixIcon: Icon(Icons.auto_awesome_outlined),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    TextField(
                      controller: _occasion,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: const InputDecoration(
                        labelText: 'Occasion / looking for (optional)',
                        prefixIcon: Icon(Icons.event_outlined),
                      ),
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
                        : 'Continue to collection',
                    expand: true,
                    isLoading: onboarding.submitting,
                    onPressed: onboarding.submitting ? null : _continue,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  TextButton(
                    onPressed: onboarding.submitting ? null : _skip,
                    child: Text(
                      'Skip for now',
                      style: t.bodyMedium?.copyWith(color: c.textSecondary),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChipGroup extends StatelessWidget {
  const _ChipGroup({
    required this.label,
    required this.options,
    required this.selected,
    required this.onSelect,
  });

  final String label;
  final List<String> options;
  final String? selected;
  final ValueChanged<String?> onSelect;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    if (options.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(label, style: AppTypography.eyebrow(c.textSecondary)),
        const SizedBox(height: AppSpacing.sm),
        Wrap(
          spacing: AppSpacing.xs,
          runSpacing: AppSpacing.xs,
          children: options.map((String option) {
            final bool isSelected = option == selected;
            return ChoiceChip(
              label: Text(option),
              selected: isSelected,
              showCheckmark: false,
              // Tapping the selected chip clears it (all optional).
              onSelected: (_) => onSelect(isSelected ? null : option),
            );
          }).toList(),
        ),
      ],
    );
  }
}
