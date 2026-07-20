import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../models/customer.dart';
import '../../../widgets/initials_avatar.dart' show formatDate;

/// The guest's profile form, shared by the post-pairing Customer Profile screen
/// and the Customer Profile page. Every field is optional; [onChanged] fires
/// with the full current draft so the parent can save whenever it likes.
///
/// Grouped as Basic information · Fashion preferences · Shopping preferences ·
/// Notes, mirroring how an associate actually interviews a guest.
class CustomerForm extends StatefulWidget {
  const CustomerForm({
    required this.initial,
    required this.onChanged,
    this.genders = const <String>[],
    this.ageRanges = const <String>[],
    this.personalities = const <String>[],
    this.brands = const <String>[],
    this.categories = const <String>[],
    super.key,
  });

  final Customer initial;
  final ValueChanged<Customer> onChanged;

  /// Choice lists served by the backend (`/api/customers/options`).
  final List<String> genders;
  final List<String> ageRanges;
  final List<String> personalities;

  /// Derived from the live catalogue.
  final List<String> brands;
  final List<String> categories;

  @override
  State<CustomerForm> createState() => _CustomerFormState();
}

class _CustomerFormState extends State<CustomerForm> {
  late final TextEditingController _name;
  late final TextEditingController _mobile;
  late final TextEditingController _currentOutfit;
  late final TextEditingController _wearingColor;
  late final TextEditingController _styling;
  late final TextEditingController _notes;

  DateTime? _dob;
  String? _gender;
  String? _ageRange;
  String? _personality;
  String? _occupation;
  String? _fit;
  String? _topSize;
  String? _bottomSize;
  String? _shoeSize;
  String? _occasion;
  String? _budget;
  bool _repeat = false;
  String? _shoppingFor;
  int? _familySize;
  int? _boys;
  int? _girls;
  late List<String> _familyMembers;
  late List<String> _childAges;
  late List<String> _styles;
  late List<String> _colors;
  late List<String> _brands;
  late List<String> _categories;
  late List<String> _fabrics;

  @override
  void initState() {
    super.initState();
    final Customer c = widget.initial;
    _name = TextEditingController(text: c.name ?? '')..addListener(_emit);
    _mobile = TextEditingController(text: c.mobile ?? '')..addListener(_emit);
    _currentOutfit = TextEditingController(text: c.currentOutfit ?? '')
      ..addListener(_emit);
    _wearingColor = TextEditingController(text: c.wearingColor ?? '')
      ..addListener(_emit);
    _styling = TextEditingController(text: c.styling ?? '')
      ..addListener(_emit);
    _notes = TextEditingController(text: c.notes ?? '')..addListener(_emit);
    _dob = c.dateOfBirth;
    _gender = c.gender;
    _ageRange = c.ageRange;
    _personality = c.personality;
    _occupation = c.occupation;
    _fit = c.preferredFit;
    _topSize = c.topSize;
    _bottomSize = c.bottomSize;
    _shoeSize = c.shoeSize;
    _occasion = c.occasion;
    _budget = c.budgetRange;
    _repeat = c.isRepeatCustomer;
    _shoppingFor = c.shoppingFor;
    _familySize = c.familySize;
    _boys = c.boysCount;
    _girls = c.girlsCount;
    _familyMembers = List<String>.of(c.familyMembers);
    _childAges = List<String>.of(c.childAgeRanges);
    _styles = List<String>.of(c.fashionStyles);
    _colors = List<String>.of(c.favoriteColors);
    _brands = List<String>.of(c.preferredBrands);
    _categories = List<String>.of(c.favoriteCategories);
    _fabrics = List<String>.of(c.preferredFabrics);
    WidgetsBinding.instance.addPostFrameCallback((_) => _emit());
  }

  @override
  void dispose() {
    _name.dispose();
    _mobile.dispose();
    _currentOutfit.dispose();
    _wearingColor.dispose();
    _styling.dispose();
    _notes.dispose();
    super.dispose();
  }

  String? _trim(TextEditingController c) {
    final String v = c.text.trim();
    return v.isEmpty ? null : v;
  }

  void _emit() {
    widget.onChanged(
      Customer(
        id: widget.initial.id,
        name: _trim(_name),
        mobile: _trim(_mobile),
        gender: _gender,
        ageRange: _ageRange,
        personality: _personality,
        currentOutfit: _trim(_currentOutfit),
        wearingColor: _trim(_wearingColor),
        styling: _trim(_styling),
        occasion: _occasion,
        dateOfBirth: _dob,
        occupation: _occupation,
        fashionStyles: _styles,
        favoriteColors: _colors,
        preferredFit: _fit,
        topSize: _topSize,
        bottomSize: _bottomSize,
        shoeSize: _shoeSize,
        budgetRange: _budget,
        preferredBrands: _brands,
        favoriteCategories: _categories,
        preferredFabrics: _fabrics,
        notes: _trim(_notes),
        isRepeatCustomer: _repeat,
        shoppingFor: _shoppingFor,
        familySize: _familySize,
        familyMembers: _familyMembers,
        boysCount: _boys,
        girlsCount: _girls,
        childAgeRanges: _childAges,
      ),
    );
  }

  void _set(VoidCallback change) {
    setState(change);
    _emit();
  }

  Future<void> _pickDob() async {
    final DateTime now = DateTime.now();
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _dob ?? DateTime(now.year - 28),
      firstDate: DateTime(now.year - 90),
      lastDate: now,
      helpText: 'Date of birth',
    );
    if (picked != null) _set(() => _dob = picked);
  }

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        // ── Basic information ────────────────────────────────────────────
        _Section(title: 'BASIC INFORMATION'),
        TextField(
          controller: _name,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            labelText: 'Full name (optional)',
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
        _Label(text: 'DATE OF BIRTH'),
        InkWell(
          onTap: _pickDob,
          borderRadius: AppRadius.brLg,
          child: Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              border: Border.all(color: c.border),
              borderRadius: AppRadius.brLg,
            ),
            child: Row(
              children: <Widget>[
                Icon(Icons.cake_outlined, size: 20, color: c.textSecondary),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  _dob == null ? 'Select a date' : formatDate(_dob!),
                  style: t.bodyLarge?.copyWith(
                    color: _dob == null ? c.textTertiary : c.textPrimary,
                  ),
                ),
                const Spacer(),
                if (_dob != null)
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    tooltip: 'Clear',
                    onPressed: () => _set(() => _dob = null),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        _Single(
          label: 'GENDER',
          options: widget.genders,
          selected: _gender,
          onSelect: (String? v) => _set(() => _gender = v),
        ),
        _Single(
          label: 'AGE RANGE',
          options: widget.ageRanges,
          selected: _ageRange,
          onSelect: (String? v) => _set(() => _ageRange = v),
        ),
        _Single(
          label: 'OCCUPATION',
          options: CustomerOptions.occupations,
          selected: _occupation,
          onSelect: (String? v) => _set(() => _occupation = v),
        ),

        // ── Who they're shopping for ─────────────────────────────────────
        _Section(title: 'SHOPPING FOR'),
        _Single(
          label: 'WHO ARE WE STYLING',
          options: CustomerOptions.shoppingFor,
          selected: _shoppingFor,
          onSelect: (String? v) => _set(() => _shoppingFor = v),
        ),
        // Family details unfold only when shopping for a family.
        if (_shoppingFor == 'Family') ...<Widget>[
          _Counter(
            label: 'HOW MANY PEOPLE',
            value: _familySize,
            max: 12,
            onChanged: (int? v) => _set(() => _familySize = v),
          ),
          _Multi(
            label: 'WHO ARE THEY',
            options: CustomerOptions.familyMembers,
            selected: _familyMembers,
            onToggle: (String v) => _set(
              () => _familyMembers.contains(v)
                  ? _familyMembers.remove(v)
                  : _familyMembers.add(v),
            ),
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                child: _Counter(
                  label: 'BOYS',
                  value: _boys,
                  max: 8,
                  onChanged: (int? v) => _set(() => _boys = v),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: _Counter(
                  label: 'GIRLS',
                  value: _girls,
                  max: 8,
                  onChanged: (int? v) => _set(() => _girls = v),
                ),
              ),
            ],
          ),
          _Multi(
            label: 'CHILDREN’S AGES',
            options: CustomerOptions.childAgeRanges,
            selected: _childAges,
            onToggle: (String v) => _set(
              () => _childAges.contains(v)
                  ? _childAges.remove(v)
                  : _childAges.add(v),
            ),
          ),
        ],

        // ── Fashion preferences ──────────────────────────────────────────
        _Section(title: 'FASHION PREFERENCES'),
        _Multi(
          label: 'FASHION STYLE',
          options: CustomerOptions.fashionStyles,
          selected: _styles,
          onToggle: (String v) => _set(
            () => _styles.contains(v) ? _styles.remove(v) : _styles.add(v),
          ),
        ),
        _Multi(
          label: 'FAVOURITE COLOURS',
          options: CustomerOptions.colors,
          selected: _colors,
          onToggle: (String v) => _set(
            () => _colors.contains(v) ? _colors.remove(v) : _colors.add(v),
          ),
        ),
        _Single(
          label: 'PREFERRED FIT',
          options: CustomerOptions.fits,
          selected: _fit,
          onSelect: (String? v) => _set(() => _fit = v),
        ),
        _Single(
          label: 'TOP SIZE',
          options: CustomerOptions.topSizes,
          selected: _topSize,
          onSelect: (String? v) => _set(() => _topSize = v),
        ),
        _Single(
          label: 'BOTTOM SIZE',
          options: CustomerOptions.bottomSizes,
          selected: _bottomSize,
          onSelect: (String? v) => _set(() => _bottomSize = v),
        ),
        _Single(
          label: 'SHOE SIZE',
          options: CustomerOptions.shoeSizes,
          selected: _shoeSize,
          onSelect: (String? v) => _set(() => _shoeSize = v),
        ),
        _Multi(
          label: 'PREFERRED BRANDS',
          options: widget.brands,
          selected: _brands,
          onToggle: (String v) => _set(
            () => _brands.contains(v) ? _brands.remove(v) : _brands.add(v),
          ),
        ),
        _Single(
          label: 'BUDGET RANGE',
          options: CustomerOptions.budgets,
          selected: _budget,
          onSelect: (String? v) => _set(() => _budget = v),
        ),

        // ── Shopping preferences ─────────────────────────────────────────
        _Section(title: 'SHOPPING PREFERENCES'),
        _Single(
          label: 'OCCASION',
          options: CustomerOptions.occasions,
          selected: _occasion,
          onSelect: (String? v) => _set(() => _occasion = v),
        ),
        _Multi(
          label: 'FAVOURITE CATEGORIES',
          options: widget.categories,
          selected: _categories,
          onToggle: (String v) => _set(
            () => _categories.contains(v)
                ? _categories.remove(v)
                : _categories.add(v),
          ),
        ),
        _Multi(
          label: 'PREFERRED FABRICS',
          options: CustomerOptions.fabrics,
          selected: _fabrics,
          onToggle: (String v) => _set(
            () => _fabrics.contains(v) ? _fabrics.remove(v) : _fabrics.add(v),
          ),
        ),
        _Single(
          label: 'PERSONALITY',
          options: widget.personalities,
          selected: _personality,
          onSelect: (String? v) => _set(() => _personality = v),
        ),
        Container(
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: AppRadius.brLg,
            border: Border.all(color: _repeat ? c.accent : c.border),
          ),
          child: CheckboxListTile(
            value: _repeat,
            onChanged: (bool? v) => _set(() => _repeat = v ?? false),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.sm,
            ),
            title: Text('Repeat customer', style: t.titleSmall),
            subtitle: Text(
              'They have shopped with us before',
              style: t.bodySmall?.copyWith(color: c.textSecondary),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        _Label(text: 'WHAT THEY’RE WEARING TODAY'),
        TextField(
          controller: _currentOutfit,
          decoration: const InputDecoration(
            labelText: 'Current outfit (optional)',
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        TextField(
          controller: _wearingColor,
          decoration: const InputDecoration(
            labelText: 'Colour they’re wearing (optional)',
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        TextField(
          controller: _styling,
          decoration: const InputDecoration(
            labelText: 'How they’re styling it (optional)',
          ),
        ),

        // ── Notes ────────────────────────────────────────────────────────
        _Section(title: 'NOTES'),
        Text(
          'Preferences, special requests, dislikes, sizing notes — anything '
          'worth remembering for this guest.',
          style: t.bodySmall?.copyWith(color: c.textSecondary),
        ),
        const SizedBox(height: AppSpacing.sm),
        TextField(
          controller: _notes,
          maxLines: 8,
          minLines: 6,
          textCapitalization: TextCapitalization.sentences,
          decoration: const InputDecoration(
            hintText:
                'e.g. Prefers muted tones, dislikes synthetic fabrics, needs a '
                'longer inseam, shopping for a March wedding…',
            alignLabelWithHint: true,
          ),
        ),
      ],
    );
  }
}

/// A titled divider between the form's logical groups.
class _Section extends StatelessWidget {
  const _Section({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.only(
        top: AppSpacing.lg,
        bottom: AppSpacing.md,
      ),
      child: Row(
        children: <Widget>[
          Text(title, style: AppTypography.eyebrow(c.accent)),
          const SizedBox(width: AppSpacing.sm),
          Expanded(child: Divider(color: c.divider)),
        ],
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Text(text, style: AppTypography.eyebrow(c.textSecondary)),
    );
  }
}

class _Single extends StatelessWidget {
  const _Single({
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
    if (options.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          _Label(text: label),
          Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: options.map((String o) {
              final bool isSelected = o == selected;
              return ChoiceChip(
                label: Text(o),
                selected: isSelected,
                showCheckmark: false,
                // Tapping the selected chip clears it (all fields optional).
                onSelected: (_) => onSelect(isSelected ? null : o),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _Multi extends StatelessWidget {
  const _Multi({
    required this.label,
    required this.options,
    required this.selected,
    required this.onToggle,
  });

  final String label;
  final List<String> options;
  final List<String> selected;
  final ValueChanged<String> onToggle;

  @override
  Widget build(BuildContext context) {
    if (options.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          _Label(text: label),
          Wrap(
            spacing: AppSpacing.xs,
            runSpacing: AppSpacing.xs,
            children: options
                .map(
                  (String o) => FilterChip(
                    label: Text(o),
                    selected: selected.contains(o),
                    showCheckmark: false,
                    onSelected: (_) => onToggle(o),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

/// A compact 0..[max] stepper for family counts. Tapping the value clears it,
/// keeping every field optional.
class _Counter extends StatelessWidget {
  const _Counter({
    required this.label,
    required this.value,
    required this.max,
    required this.onChanged,
  });

  final String label;
  final int? value;
  final int max;
  final ValueChanged<int?> onChanged;

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    final TextTheme t = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          _Label(text: label),
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: c.border),
              borderRadius: AppRadius.brLg,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                IconButton(
                  icon: const Icon(Icons.remove, size: 18),
                  tooltip: 'Fewer',
                  onPressed: (value ?? 0) <= 0
                      ? null
                      : () => onChanged(value == 1 ? null : (value! - 1)),
                ),
                SizedBox(
                  width: 44,
                  child: Text(
                    value?.toString() ?? '–',
                    textAlign: TextAlign.center,
                    style: t.titleMedium?.copyWith(
                      color: value == null ? c.textTertiary : c.textPrimary,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add, size: 18),
                  tooltip: 'More',
                  onPressed: (value ?? 0) >= max
                      ? null
                      : () => onChanged((value ?? 0) + 1),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
