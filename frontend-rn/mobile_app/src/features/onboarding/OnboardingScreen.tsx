import React, { useMemo, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { eyebrow } from '../../theme/typography';
import { spacing } from '../../theme/tokens';
import { useDeps } from '../../app/providers';
import { useListenable } from '../../core/useListenable';
import { Customer } from '../../models/customer';
import { Product } from '../../models/product';
import { AppButton } from '../../widgets/AppButton';
import { CustomerForm } from '../customer/widgets/CustomerForm';

/// Shown right after the display is paired: the guest's details, so the
/// associate can tailor the session. Everything is optional — Continue saves
/// whatever was entered (or skips if blank); Skip proceeds without saving.
/// Ported 1:1 from the Flutter `OnboardingScreen`.
///
/// On completion (submit or skip) `onboarding.isCompletedFor(sessionId)` flips
/// true and `RootNavigator`'s route guard swaps the stack to the Home group —
/// this screen never navigates manually.
export function OnboardingScreen() {
  const { colors, text } = useTheme();
  const { onboarding, connection, customerDirectory, catalog } = useDeps();
  useListenable(onboarding);
  useListenable(catalog);

  // The in-progress draft. Not state — CustomerForm owns its own internal
  // state and only calls back with the latest value, mirroring the Dart
  // widget's `Customer _draft` field (a plain mutable field, not `setState`).
  const draft = useRef<Customer>(new Customer({ id: 'draft' }));

  const brands = useMemo(() => brandsFrom(catalog.products), [catalog.products]);
  const categories = useMemo(() => catalog.categories.map((c) => c.name), [catalog.categories]);

  const currentSessionId = () => connection.session?.sessionId ?? null;

  const handleContinue = async () => {
    const ok = await onboarding.submit({ sessionId: currentSessionId(), draft: draft.current });
    if (ok) {
      // Keep the associate's saved-customers book in step with the guest we
      // just captured, so they show up under Profile → Customers for future
      // visits.
      const saved = onboarding.customer;
      if (saved != null && !saved.isEmpty) {
        await customerDirectory.save(saved);
      }
    }
  };

  const handleSkip = () => {
    onboarding.skip(currentSessionId());
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right', 'bottom']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
      >
        <Text style={text.titleLarge}>Customer profile</Text>
        <Pressable disabled={onboarding.submitting} onPress={handleSkip} hitSlop={8}>
          <Text style={[text.titleSmall, { color: colors.accent, opacity: onboarding.submitting ? 0.38 : 1 }]}>
            Skip
          </Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing.xl }}>
        <View style={{ height: spacing.md }} />
        <Text style={eyebrow(colors.accent)}>GUEST PROFILE</Text>
        <View style={{ height: spacing.sm }} />
        <Text style={text.displaySmall}>Personalise the session</Text>
        <View style={{ height: spacing.sm }} />
        <Text style={[text.bodyLarge, { color: colors.textSecondary }]}>
          All optional — anything you capture sharpens the recommendations for this guest. Skip
          to start browsing straight away.
        </Text>
        <View style={{ height: spacing.xl }} />
        <CustomerForm
          initial={onboarding.customer ?? new Customer({ id: 'draft' })}
          genders={onboarding.options.genders}
          ageRanges={onboarding.options.ageRanges}
          personalities={onboarding.options.personalities}
          brands={brands}
          categories={categories}
          onChanged={(v) => {
            draft.current = v;
          }}
        />
        {onboarding.error != null && (
          <>
            <View style={{ height: spacing.md }} />
            <Text style={[text.bodySmall, { color: colors.error }]}>{onboarding.error}</Text>
          </>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
        <AppButton
          label={onboarding.submitting ? 'Saving…' : 'Show recommendations'}
          icon="sparkle"
          expand
          isLoading={onboarding.submitting}
          onPress={onboarding.submitting ? null : handleContinue}
        />
        <View style={{ height: spacing.xs }} />
        <AppButton
          label="Skip for now"
          variant="outline"
          expand
          onPress={onboarding.submitting ? null : handleSkip}
        />
      </View>
    </SafeAreaView>
  );
}

/// Distinct catalogue brands, offered as preferred-brand chips.
function brandsFrom(products: Product[]): string[] {
  const seen = new Set<string>();
  for (const p of products) {
    const brand = p.brand.trim();
    if (brand.length > 0) seen.add(brand);
  }
  return Array.from(seen).sort();
}
