import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { eyebrow } from '../../../theme/typography';
import { radius, spacing } from '../../../theme/tokens';
import { Icon } from '../../../theme/icons';
import { withAlpha } from '../../../theme/colors';
import { formatDate } from '../../../widgets/InitialsAvatar';
import { AppButton } from '../../../widgets/AppButton';
import { Customer, CustomerFields, CustomerOptions } from '../../../models/customer';

/// The guest's profile form, shared by the post-pairing Onboarding screen and
/// the Customer Profile screen. Every field is optional; `onChanged` fires with
/// the full current draft so the parent can save whenever it likes.
///
/// Grouped as Basic information · Shopping for · Fashion preferences · Shopping
/// preferences · Notes, mirroring how an associate actually interviews a guest.
/// Ported 1:1 from the Flutter `CustomerForm`.
export interface CustomerFormProps {
  initial: Customer;
  onChanged: (customer: Customer) => void;

  /// Choice lists served by the backend (`/api/customers/options`).
  genders?: string[];
  ageRanges?: string[];
  personalities?: string[];

  /// Derived from the live catalogue.
  brands?: string[];
  categories?: string[];
}

export function CustomerForm({
  initial,
  onChanged,
  genders = [],
  ageRanges = [],
  personalities = [],
  brands = [],
  categories = [],
}: CustomerFormProps) {
  const { colors, text } = useTheme();

  // Internal draft mirrors the Dart widget's own State (TextEditingControllers +
  // loose fields) — `initial` seeds it once, like Dart's initState; later prop
  // changes do not reset an in-progress edit. Every change re-emits the full
  // customer via `onChanged`, exactly like Dart's `_emit()`.
  const [state, setState] = useState<CustomerFields>(() => ({
    id: initial.id,
    name: initial.name,
    mobile: initial.mobile,
    dateOfBirth: initial.dateOfBirth,
    gender: initial.gender,
    ageRange: initial.ageRange,
    occupation: initial.occupation,
    fashionStyles: [...initial.fashionStyles],
    favoriteColors: [...initial.favoriteColors],
    preferredFit: initial.preferredFit,
    topSize: initial.topSize,
    bottomSize: initial.bottomSize,
    shoeSize: initial.shoeSize,
    preferredBrands: [...initial.preferredBrands],
    budgetRange: initial.budgetRange,
    occasion: initial.occasion,
    favoriteCategories: [...initial.favoriteCategories],
    preferredFabrics: [...initial.preferredFabrics],
    personality: initial.personality,
    isRepeatCustomer: initial.isRepeatCustomer,
    shoppingFor: initial.shoppingFor,
    familySize: initial.familySize,
    familyMembers: [...initial.familyMembers],
    boysCount: initial.boysCount,
    girlsCount: initial.girlsCount,
    childAgeRanges: [...initial.childAgeRanges],
    currentOutfit: initial.currentOutfit,
    styling: initial.styling,
    wearingColor: initial.wearingColor,
    notes: initial.notes,
  }));

  const customer = useMemo(() => new Customer(state), [state]);

  useEffect(() => {
    onChanged(customer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  // Plain object spread (not Customer.copyWith) so a field can be explicitly
  // cleared back to `undefined` — e.g. tapping a selected chip again.
  const patch = (p: Partial<CustomerFields>) => setState((s) => ({ ...s, ...p }));

  const toggleIn = (key: keyof CustomerFields, value: string) => {
    setState((s) => {
      const arr = (s[key] as string[] | undefined) ?? [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...s, [key]: next };
    });
  };

  const trimOrUndef = (v: string): string | undefined => (v.trim().length === 0 ? undefined : v);

  return (
    <View>
      {/* ── Basic information ──────────────────────────────────────────── */}
      <Section title="BASIC INFORMATION" />
      <FormField
        placeholder="Full name (optional)"
        icon="person"
        value={state.name ?? ''}
        onChangeText={(v) => patch({ name: trimOrUndef(v) })}
        autoCapitalize="words"
      />
      <View style={{ height: spacing.md }} />
      <FormField
        placeholder="Mobile (optional)"
        value={state.mobile ?? ''}
        onChangeText={(v) => patch({ mobile: trimOrUndef(v) })}
        keyboardType="phone-pad"
      />
      <View style={{ height: spacing.lg }} />
      <FieldLabel text="DATE OF BIRTH" />
      <DobField
        value={state.dateOfBirth}
        onChange={(iso) => patch({ dateOfBirth: iso })}
      />
      <View style={{ height: spacing.lg }} />
      <SingleSelect
        label="GENDER"
        options={genders}
        selected={state.gender}
        onSelect={(v) => patch({ gender: v })}
      />
      <SingleSelect
        label="AGE RANGE"
        options={ageRanges}
        selected={state.ageRange}
        onSelect={(v) => patch({ ageRange: v })}
      />
      <SingleSelect
        label="OCCUPATION"
        options={CustomerOptions.occupations}
        selected={state.occupation}
        onSelect={(v) => patch({ occupation: v })}
      />

      {/* ── Who they're shopping for ───────────────────────────────────── */}
      <Section title="SHOPPING FOR" />
      <SingleSelect
        label="WHO ARE WE STYLING"
        options={CustomerOptions.shoppingFor}
        selected={state.shoppingFor}
        onSelect={(v) => patch({ shoppingFor: v })}
      />
      {state.shoppingFor === 'Family' && (
        <>
          <Counter
            label="HOW MANY PEOPLE"
            value={state.familySize}
            max={12}
            onChange={(v) => patch({ familySize: v })}
          />
          <MultiSelect
            label="WHO ARE THEY"
            options={CustomerOptions.familyMembers}
            selected={state.familyMembers ?? []}
            onToggle={(v) => toggleIn('familyMembers', v)}
          />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Counter label="BOYS" value={state.boysCount} max={8} onChange={(v) => patch({ boysCount: v })} />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Counter label="GIRLS" value={state.girlsCount} max={8} onChange={(v) => patch({ girlsCount: v })} />
            </View>
          </View>
          <MultiSelect
            label="CHILDREN’S AGES"
            options={CustomerOptions.childAgeRanges}
            selected={state.childAgeRanges ?? []}
            onToggle={(v) => toggleIn('childAgeRanges', v)}
          />
        </>
      )}

      {/* ── Fashion preferences ────────────────────────────────────────── */}
      <Section title="FASHION PREFERENCES" />
      <MultiSelect
        label="FASHION STYLE"
        options={CustomerOptions.fashionStyles}
        selected={state.fashionStyles ?? []}
        onToggle={(v) => toggleIn('fashionStyles', v)}
      />
      <MultiSelect
        label="FAVOURITE COLOURS"
        options={CustomerOptions.colors}
        selected={state.favoriteColors ?? []}
        onToggle={(v) => toggleIn('favoriteColors', v)}
      />
      <SingleSelect
        label="PREFERRED FIT"
        options={CustomerOptions.fits}
        selected={state.preferredFit}
        onSelect={(v) => patch({ preferredFit: v })}
      />
      <SingleSelect
        label="TOP SIZE"
        options={CustomerOptions.topSizes}
        selected={state.topSize}
        onSelect={(v) => patch({ topSize: v })}
      />
      <SingleSelect
        label="BOTTOM SIZE"
        options={CustomerOptions.bottomSizes}
        selected={state.bottomSize}
        onSelect={(v) => patch({ bottomSize: v })}
      />
      <SingleSelect
        label="SHOE SIZE"
        options={CustomerOptions.shoeSizes}
        selected={state.shoeSize}
        onSelect={(v) => patch({ shoeSize: v })}
      />
      <MultiSelect
        label="PREFERRED BRANDS"
        options={brands}
        selected={state.preferredBrands ?? []}
        onToggle={(v) => toggleIn('preferredBrands', v)}
      />
      <SingleSelect
        label="BUDGET RANGE"
        options={CustomerOptions.budgets}
        selected={state.budgetRange}
        onSelect={(v) => patch({ budgetRange: v })}
      />

      {/* ── Shopping preferences ───────────────────────────────────────── */}
      <Section title="SHOPPING PREFERENCES" />
      <SingleSelect
        label="OCCASION"
        options={CustomerOptions.occasions}
        selected={state.occasion}
        onSelect={(v) => patch({ occasion: v })}
      />
      <MultiSelect
        label="FAVOURITE CATEGORIES"
        options={categories}
        selected={state.favoriteCategories ?? []}
        onToggle={(v) => toggleIn('favoriteCategories', v)}
      />
      <MultiSelect
        label="PREFERRED FABRICS"
        options={CustomerOptions.fabrics}
        selected={state.preferredFabrics ?? []}
        onToggle={(v) => toggleIn('preferredFabrics', v)}
      />
      <SingleSelect
        label="PERSONALITY"
        options={personalities}
        selected={state.personality}
        onSelect={(v) => patch({ personality: v })}
      />
      <Pressable
        onPress={() => patch({ isRepeatCustomer: !state.isRepeatCustomer })}
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: state.isRepeatCustomer ? colors.accent : colors.border,
          padding: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: radius.sm,
            borderWidth: 1.5,
            borderColor: state.isRepeatCustomer ? colors.accent : colors.border,
            backgroundColor: state.isRepeatCustomer ? colors.accent : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {state.isRepeatCustomer && <Icon name="check" size={16} color={colors.onAccent} />}
        </View>
        <View style={{ width: spacing.sm }} />
        <View style={{ flex: 1 }}>
          <Text style={text.titleSmall}>Repeat customer</Text>
          <Text style={[text.bodySmall, { color: colors.textSecondary }]}>
            They have shopped with us before
          </Text>
        </View>
      </Pressable>
      <View style={{ height: spacing.lg }} />
      <FieldLabel text="WHAT THEY’RE WEARING TODAY" />
      <FormField
        placeholder="Current outfit (optional)"
        value={state.currentOutfit ?? ''}
        onChangeText={(v) => patch({ currentOutfit: trimOrUndef(v) })}
      />
      <View style={{ height: spacing.md }} />
      <FormField
        placeholder="Colour they’re wearing (optional)"
        value={state.wearingColor ?? ''}
        onChangeText={(v) => patch({ wearingColor: trimOrUndef(v) })}
      />
      <View style={{ height: spacing.md }} />
      <FormField
        placeholder="How they’re styling it (optional)"
        value={state.styling ?? ''}
        onChangeText={(v) => patch({ styling: trimOrUndef(v) })}
      />

      {/* ── Notes ───────────────────────────────────────────────────────── */}
      <Section title="NOTES" />
      <Text style={[text.bodySmall, { color: colors.textSecondary }]}>
        Preferences, special requests, dislikes, sizing notes — anything worth remembering for
        this guest.
      </Text>
      <View style={{ height: spacing.sm }} />
      <FormField
        placeholder="e.g. Prefers muted tones, dislikes synthetic fabrics, needs a longer inseam, shopping for a March wedding…"
        value={state.notes ?? ''}
        onChangeText={(v) => patch({ notes: trimOrUndef(v) })}
        autoCapitalize="sentences"
        multiline
        numberOfLines={6}
      />
    </View>
  );
}

/// A titled divider between the form's logical groups.
function Section({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.md }}>
      <Text style={eyebrow(colors.accent)}>{title}</Text>
      <View style={{ width: spacing.sm }} />
      <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
    </View>
  );
}

function FieldLabel({ text: label }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingBottom: spacing.sm }}>
      <Text style={eyebrow(colors.textSecondary)}>{label}</Text>
    </View>
  );
}

/// A bordered text input box, the RN stand-in for Dart's Material floating-label
/// `TextField` (RN has no native floating label, so the label doubles as the
/// placeholder — it is visible only while the field is empty).
function FormField({
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType,
  autoCapitalize,
  multiline,
  numberOfLines,
}: {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  icon?: 'person';
  keyboardType?: 'phone-pad' | 'default';
  autoCapitalize?: 'words' | 'sentences' | 'none';
  multiline?: boolean;
  numberOfLines?: number;
}) {
  const { colors, text } = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: multiline ? spacing.sm : spacing.xs,
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
      }}
    >
      {icon != null && (
        <>
          <Icon name={icon} size={20} color={colors.textSecondary} />
          <View style={{ width: spacing.sm }} />
        </>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          text.bodyLarge,
          { color: colors.textPrimary, flex: 1, paddingVertical: spacing.xs, minHeight: multiline ? 110 : undefined },
        ]}
      />
    </View>
  );
}

/// Single-select chip row (Dart `ChoiceChip`). Tapping the selected chip clears
/// it — every field stays optional.
function SingleSelect({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected?: string;
  onSelect: (v: string | undefined) => void;
}) {
  const { colors, text } = useTheme();
  if (options.length === 0) return null;
  return (
    <View style={{ paddingBottom: spacing.lg }}>
      <FieldLabel text={label} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {options.map((o) => {
          const isSelected = o === selected;
          return (
            <Pressable key={o} onPress={() => onSelect(isSelected ? undefined : o)}>
              <View
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.accent : colors.border,
                  backgroundColor: isSelected ? withAlpha(colors.accent, 0.14) : colors.surface,
                }}
              >
                <Text style={[text.labelLarge, { color: isSelected ? colors.accent : colors.textPrimary, letterSpacing: 0 }]}>
                  {o}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/// Multi-select chip row (Dart `FilterChip`).
function MultiSelect({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  const { colors, text } = useTheme();
  if (options.length === 0) return null;
  return (
    <View style={{ paddingBottom: spacing.lg }}>
      <FieldLabel text={label} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {options.map((o) => {
          const isSelected = selected.includes(o);
          return (
            <Pressable key={o} onPress={() => onToggle(o)}>
              <View
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.accent : colors.border,
                  backgroundColor: isSelected ? withAlpha(colors.accent, 0.14) : colors.surface,
                }}
              >
                <Text style={[text.labelLarge, { color: isSelected ? colors.accent : colors.textPrimary, letterSpacing: 0 }]}>
                  {o}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/// A compact 0..max stepper for family counts. Tapping the value down to 0
/// clears it, keeping the field optional — matches Dart's `_Counter`.
function Counter({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value?: number;
  max: number;
  onChange: (v: number | undefined) => void;
}) {
  const { colors, text } = useTheme();
  const canDec = (value ?? 0) > 0;
  const canInc = (value ?? 0) < max;
  return (
    <View style={{ paddingBottom: spacing.lg }}>
      <FieldLabel text={label} />
      <View
        style={{
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
        }}
      >
        <Pressable
          disabled={!canDec}
          onPress={() => onChange(value === 1 ? undefined : (value ?? 0) - 1)}
          style={{ padding: spacing.sm, opacity: canDec ? 1 : 0.38 }}
          hitSlop={8}
        >
          <Icon name="remove" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={[text.titleMedium, { width: 44, textAlign: 'center', color: value == null ? colors.textTertiary : colors.textPrimary }]}>
          {value?.toString() ?? '–'}
        </Text>
        <Pressable
          disabled={!canInc}
          onPress={() => onChange((value ?? 0) + 1)}
          style={{ padding: spacing.sm, opacity: canInc ? 1 : 0.38 }}
          hitSlop={8}
        >
          <Icon name="add" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/// Date-of-birth picker. RN has no bundled native date picker, so this ports
/// Dart's `showDatePicker` as a self-contained bottom-sheet with three bounded
/// steppers (day / month / year) — same interaction family as the family-size
/// counters above, no extra dependency required.
function DobField({ value, onChange }: { value?: string; onChange: (iso: string | undefined) => void }) {
  const { colors, text } = useTheme();
  const [open, setOpen] = useState(false);
  const now = new Date();
  const minYear = now.getFullYear() - 90;
  const maxYear = now.getFullYear();

  const parsed = useMemo(() => {
    if (value == null) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }, [value]);

  const [day, setDay] = useState(parsed?.day ?? 1);
  const [month, setMonth] = useState(parsed?.month ?? 1);
  const [year, setYear] = useState(parsed?.year ?? now.getFullYear() - 28);

  const openPicker = () => {
    setDay(parsed?.day ?? 1);
    setMonth(parsed?.month ?? 1);
    setYear(parsed?.year ?? now.getFullYear() - 28);
    setOpen(true);
  };

  const confirm = () => {
    const clampedDay = Math.min(day, daysInMonth(year, month));
    onChange(new Date(year, month - 1, clampedDay).toISOString());
    setOpen(false);
  };

  return (
    <>
      <Pressable onPress={openPicker}>
        <View
          style={{
            padding: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={[text.bodyLarge, { color: value == null ? colors.textTertiary : colors.textPrimary }]}>
            {value == null ? 'Select a date' : formatDate(value)}
          </Text>
          <View style={{ flex: 1 }} />
          {value != null && (
            <Pressable onPress={() => onChange(undefined)} hitSlop={8}>
              <Icon name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: colors.overlay }}
          onPress={() => setOpen(false)}
        >
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surfaceElevated,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              padding: spacing.xl,
            }}
          >
            <Text style={eyebrow(colors.textSecondary)}>DATE OF BIRTH</Text>
            <View style={{ height: spacing.lg }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Stepper
                label="DAY"
                display={String(day)}
                onDec={() => setDay((d) => Math.max(1, d - 1))}
                onInc={() => setDay((d) => Math.min(daysInMonth(year, month), d + 1))}
                decDisabled={day <= 1}
                incDisabled={day >= daysInMonth(year, month)}
              />
              <Stepper
                label="MONTH"
                display={MONTH_NAMES[month - 1]}
                onDec={() => setMonth((m) => Math.max(1, m - 1))}
                onInc={() => setMonth((m) => Math.min(12, m + 1))}
                decDisabled={month <= 1}
                incDisabled={month >= 12}
              />
              <Stepper
                label="YEAR"
                display={String(year)}
                onDec={() => setYear((y) => Math.max(minYear, y - 1))}
                onInc={() => setYear((y) => Math.min(maxYear, y + 1))}
                decDisabled={year <= minYear}
                incDisabled={year >= maxYear}
              />
            </View>
            <View style={{ height: spacing.xl }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => setOpen(false)} style={{ padding: spacing.sm }}>
                <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <View style={{ width: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <AppButton label="Set date" onPress={confirm} expand />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function Stepper({
  label,
  display,
  onDec,
  onInc,
  decDisabled,
  incDisabled,
}: {
  label: string;
  display: string;
  onDec: () => void;
  onInc: () => void;
  decDisabled: boolean;
  incDisabled: boolean;
}) {
  const { colors, text } = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={eyebrow(colors.textTertiary)}>{label}</Text>
      <View style={{ height: spacing.sm }} />
      <Pressable disabled={incDisabled} onPress={onInc} style={{ padding: spacing.xs, opacity: incDisabled ? 0.38 : 1 }} hitSlop={8}>
        <Icon name="add" size={20} color={colors.textPrimary} />
      </Pressable>
      <Text style={[text.titleMedium, { minWidth: 48, textAlign: 'center' }]}>{display}</Text>
      <Pressable disabled={decDisabled} onPress={onDec} style={{ padding: spacing.xs, opacity: decDisabled ? 0.38 : 1 }} hitSlop={8}>
        <Icon name="remove" size={20} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}
