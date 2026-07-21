import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { eyebrow } from '../../theme/typography';
import { radius, spacing } from '../../theme/tokens';
import { withAlpha } from '../../theme/colors';
import { Icon } from '../../theme/icons';
import { useDeps } from '../../app/providers';
import { useListenable } from '../../core/useListenable';
import { Customer } from '../../models/customer';
import { Product } from '../../models/product';
import { AppButton } from '../../widgets/AppButton';
import { formatDate } from '../../widgets/InitialsAvatar';
import { CustomerForm } from './widgets/CustomerForm';

/// The guest's profile for the **current shopping session**. The associate can
/// add or refine details at any time; changes apply immediately and sharpen the
/// recommendations for the rest of the session. Ported 1:1 from the Flutter
/// `CustomerProfileScreen`.
///
/// Note: the associate's saved-customers *book* (list all saved profiles,
/// switch the active guest to one of them) lives on the separate Profile
/// screen in the Dart source (`profile_screen.dart`) — not in this file. Here
/// `customerDirectory` is only used to keep that book in step, exactly as the
/// Dart `CustomerProfileScreen` does (`.save(...)` after a successful submit
/// or update).
export function CustomerProfileScreen() {
  const { colors, text } = useTheme();
  const nav = useNavigation<any>();
  const { onboarding, connection, customerDirectory, catalog } = useDeps();
  useListenable(onboarding);
  useListenable(catalog);

  const [editing, setEditing] = useState(false);
  const [savedThisVisit, setSavedThisVisit] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const guest = onboarding.customer ?? new Customer({ id: 'draft' });
  const draftRef = useRef<Customer>(guest);

  useEffect(() => {
    if (toast == null) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const brands = useMemo(() => brandsFrom(catalog.products), [catalog.products]);
  const categories = useMemo(() => catalog.categories.map((c) => c.name), [catalog.categories]);

  const startEditing = () => {
    draftRef.current = guest;
    setEditing(true);
  };

  const handleSave = async () => {
    // Nothing captured yet this session → persist through the API first so the
    // guest gets a real record; otherwise update the in-session profile.
    if (onboarding.customer == null) {
      const sessionId = connection.session?.sessionId ?? null;
      const ok = await onboarding.submit({ sessionId, draft: draftRef.current });
      if (ok) {
        await customerDirectory.save(onboarding.customer ?? draftRef.current);
      }
      setEditing(!ok);
      setSavedThisVisit((prev) => prev || ok);
      setToast(ok ? 'Customer profile saved.' : 'Could not save the profile.');
      return;
    }
    // Existing guest: PUT a partial update to the backend (only changed
    // fields), then keep the associate's local book in step with the
    // canonical record.
    const sessionId = connection.session?.sessionId ?? null;
    const ok = await onboarding.persistProfileUpdate(draftRef.current, { sessionId: sessionId ?? undefined });
    const canonical = onboarding.customer ?? draftRef.current;
    await customerDirectory.save(canonical);
    setEditing(false);
    setSavedThisVisit(true);
    setToast(ok ? 'Customer profile updated.' : 'Saved on device — could not reach the server.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right', 'bottom']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
      >
        <Pressable onPress={() => nav.goBack()} hitSlop={8} style={{ padding: spacing.xxs }}>
          <Icon name="back" size={18} color={colors.textPrimary} />
        </Pressable>
        <View style={{ width: spacing.sm }} />
        <Text style={[text.titleLarge, { flex: 1 }]}>Customer profile</Text>
        {!editing && (
          <Pressable onPress={startEditing} hitSlop={8}>
            <Text style={[text.titleSmall, { color: colors.accent }]}>Edit</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxl,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={text.titleLarge}>{guest.name ?? 'Guest'}</Text>
            {guest.mobile != null && (
              <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>{guest.mobile}</Text>
            )}
          </View>
          {guest.isRepeatCustomer && (
            <View
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: 6,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.accent,
                backgroundColor: withAlpha(colors.accent, 0.14),
              }}
            >
              <Text style={eyebrow(colors.accent)}>REPEAT GUEST</Text>
            </View>
          )}
        </View>
        <View style={{ height: spacing.lg }} />

        {editing ? (
          <CustomerForm
            initial={guest}
            genders={onboarding.options.genders}
            ageRanges={onboarding.options.ageRanges}
            personalities={onboarding.options.personalities}
            brands={brands}
            categories={categories}
            onChanged={(v) => {
              draftRef.current = v;
            }}
          />
        ) : (
          <>
            {/* Recommendations are refreshed only when the associate asks —
                never automatically after an edit. */}
            {savedThisVisit && (
              <>
                <AppButton
                  label="Update recommendations"
                  icon="sparkle"
                  expand
                  onPress={() => nav.navigate('Recommendations')}
                />
                <View style={{ height: spacing.lg }} />
              </>
            )}
            {guest.isEmpty && <Empty onAdd={startEditing} />}
          </>
        )}

        {!editing && !guest.isEmpty && (
          <>
            <Card
              title="ABOUT"
              rows={[
                { label: 'Name', value: guest.name },
                { label: 'Mobile', value: guest.mobile },
                { label: 'Date of birth', value: guest.dateOfBirth == null ? undefined : formatDate(guest.dateOfBirth) },
                { label: 'Gender', value: guest.gender },
                { label: 'Age range', value: guest.ageRange },
                { label: 'Occupation', value: guest.occupation },
              ]}
            />
            <View style={{ height: spacing.lg }} />
            <Card
              title="STYLE PREFERENCES"
              rows={[
                { label: 'Style personality', value: guest.personality },
                { label: 'Fashion style', value: join(guest.fashionStyles) },
                { label: 'Favourite colours', value: join(guest.favoriteColors) },
                { label: 'Preferred fit', value: guest.preferredFit },
                { label: 'Top size', value: guest.topSize },
                { label: 'Bottom size', value: guest.bottomSize },
                { label: 'Shoe size', value: guest.shoeSize },
                { label: 'Preferred brands', value: join(guest.preferredBrands) },
                { label: 'Budget', value: guest.budgetRange },
                { label: 'Occasion', value: guest.occasion },
                { label: 'Favourite categories', value: join(guest.favoriteCategories) },
                { label: 'Preferred fabrics', value: join(guest.preferredFabrics) },
              ]}
            />
            <View style={{ height: spacing.lg }} />
            <Card
              title="SHOPPING FOR"
              rows={[
                { label: 'Styling for', value: guest.shoppingFor },
                { label: 'Group size', value: guest.familySize?.toString() },
                { label: 'Family', value: join(guest.familyMembers) },
                { label: 'Boys', value: guest.boysCount?.toString() },
                { label: 'Girls', value: guest.girlsCount?.toString() },
                { label: 'Children ages', value: join(guest.childAgeRanges) },
              ]}
            />
            <View style={{ height: spacing.lg }} />
            <Card
              title="TODAY"
              rows={[
                { label: 'Current outfit', value: guest.currentOutfit },
                { label: 'Wearing colour', value: guest.wearingColor },
                { label: 'Styling', value: guest.styling },
                { label: 'Notes', value: guest.notes },
              ]}
            />
            <View style={{ height: spacing.lg }} />
            <Text style={[text.bodySmall, { color: colors.textTertiary }]}>
              This profile belongs to the current session and is used to tailor recommendations.
            </Text>
          </>
        )}
      </ScrollView>

      {/* Pinned actions — always reachable, however long the form runs. */}
      {editing && (
        <View
          style={{
            backgroundColor: colors.background,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Pressable
            disabled={onboarding.submitting}
            onPress={() => setEditing(false)}
            style={{ padding: spacing.sm, opacity: onboarding.submitting ? 0.38 : 1 }}
          >
            <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
          <View style={{ width: spacing.sm }} />
          <View style={{ flex: 1 }}>
            <AppButton
              label={onboarding.submitting ? 'Saving…' : 'Save changes'}
              expand
              isLoading={onboarding.submitting}
              onPress={onboarding.submitting ? null : handleSave}
            />
          </View>
        </View>
      )}

      {toast != null && (
        <View
          style={{
            position: 'absolute',
            left: spacing.lg,
            right: spacing.lg,
            bottom: editing ? 88 : spacing.lg,
            backgroundColor: colors.primary,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        >
          <Text style={[text.bodyMedium, { color: colors.onPrimary }]}>{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function join(values: string[]): string | undefined {
  return values.length === 0 ? undefined : values.join(', ');
}

function brandsFrom(products: Product[]): string[] {
  const seen = new Set<string>();
  for (const p of products) {
    const brand = p.brand.trim();
    if (brand.length > 0) seen.add(brand);
  }
  return Array.from(seen).sort();
}

interface RowData {
  label: string;
  value?: string;
}

function Card({ title, rows }: { title: string; rows: RowData[] }) {
  const { colors, text } = useTheme();
  const shown = rows.filter((r) => r.value != null && r.value.trim().length > 0);
  if (shown.length === 0) return null;
  return (
    <View
      style={{
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={eyebrow(colors.accent)}>{title}</Text>
      <View style={{ height: spacing.sm }} />
      {shown.map((r) => (
        <View key={r.label} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5 }}>
          <Text style={[text.bodyMedium, { width: 132, color: colors.textSecondary }]}>{r.label}</Text>
          <Text style={[text.bodyMedium, { flex: 1, color: colors.textPrimary }]}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

function Empty({ onAdd }: { onAdd: () => void }) {
  const { colors, text } = useTheme();
  return (
    <View
      style={{
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
      }}
    >
      <Text style={[text.titleSmall, { textAlign: 'center' }]}>No customer details captured</Text>
      <View style={{ height: spacing.xxs }} />
      <Text style={[text.bodySmall, { color: colors.textSecondary, textAlign: 'center' }]}>
        Add a few optional details to sharpen this session’s recommendations.
      </Text>
      <View style={{ height: spacing.md }} />
      <AppButton label="Add customer details" onPress={onAdd} />
    </View>
  );
}
