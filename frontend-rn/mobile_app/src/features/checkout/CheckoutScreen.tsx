import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { eyebrow } from '../../theme/typography';
import { radius, sizes, spacing } from '../../theme/tokens';
import { Icon } from '../../theme/icons';
import { useDeps } from '../../app/providers';
import { useListenable } from '../../core/useListenable';
import { AppButton } from '../../widgets/AppButton';
import { CustomerDraft, CheckoutException } from '../../data/checkoutRepository';
import { WsEvent, WsEventType } from '../../models/wsEvent';
import { cartPayload } from '../cart/CartScreen';

/// Checkout summary + confirm. Confirming **persists the order** through the
/// backend (`POST /api/cart/:sessionId/checkout`) — cart lines, quantities,
/// totals, and any captured customer — then notifies the display and completes
/// the sale. Ported from `CheckoutScreen`.
export function CheckoutScreen() {
  const { colors, text } = useTheme();
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { cart, realtime, connection, auth, checkoutRepo, onboarding } = useDeps();
  useListenable(cart);

  // Pre-fill the customer fields with whatever was captured during onboarding
  // (name + number) so the associate doesn't re-type it; still fully editable.
  const guest = onboarding.customer;
  const [customerName, setCustomerName] = useState(guest?.name ?? '');
  const [customerMobile, setCustomerMobile] = useState(guest?.mobile ?? '');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mirror the order review onto the display as soon as the associate reaches
  // checkout, so the client follows the purchase through on the big screen.
  useEffect(() => {
    if (cart.cart.isEmpty) return;
    realtime.emit(
      new WsEvent({
        type: WsEventType.checkout,
        sessionId: connection.session?.sessionId,
        payload: cartPayload(cart.cart, { customerName: onboarding.customer?.name }),
      }),
    );
    // Run once on mount only, mirroring the Dart's addPostFrameCallback in initState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirm = async () => {
    if (cart.cart.isEmpty) return;
    const token = auth.token;
    if (token == null) {
      setErrorMessage('Your session expired. Please sign in again.');
      return;
    }

    setProcessing(true);
    setErrorMessage(null);
    const sessionId = connection.session?.sessionId ?? 'no-session';

    try {
      const order = await checkoutRepo.checkout({
        sessionId,
        token,
        cart: cart.cart,
        customer: new CustomerDraft({ name: customerName, mobile: customerMobile }),
      });
      realtime.emit(new WsEvent({ type: WsEventType.paymentSuccess, sessionId }));
      cart.clear();
      nav.navigate('Success', { order });
    } catch (e) {
      setProcessing(false);
      setErrorMessage(e instanceof CheckoutException ? e.message : 'Checkout failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: spacing.xxs }}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12} style={{ padding: spacing.sm }}>
          <Icon name="back" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={text.titleLarge}>Checkout</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={eyebrow(colors.textSecondary)}>ORDER</Text>
          <View style={{ height: spacing.sm }} />
          {cart.cart.items.map((i) => (
            <View key={i.lineId} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs }}>
              <Text style={[text.bodyMedium, { flex: 1 }]}>{`${i.product.name}  ×${i.quantity}`}</Text>
              <Text style={text.bodyMedium}>{i.lineTotal.formatted}</Text>
            </View>
          ))}
          <View style={{ height: spacing.md }} />
          <View style={{ height: 1, backgroundColor: colors.divider }} />
          <View style={{ height: spacing.md }} />
          <SummaryRow label="Subtotal" value={cart.cart.subtotal.formatted} />
          <SummaryRow label="Tax" value={cart.cart.tax.formatted} />
          <View style={{ height: spacing.xs }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={text.titleMedium}>Total</Text>
            <View style={{ flex: 1 }} />
            <Text style={text.titleLarge}>{cart.cart.total.formatted}</Text>
          </View>

          <View style={{ height: spacing.xl }} />
          <Text style={eyebrow(colors.textSecondary)}>CUSTOMER (OPTIONAL)</Text>
          <View style={{ height: spacing.sm }} />
          <Text style={[text.bodySmall, { color: colors.textSecondary }]}>
            Attach the client to this order for their records.
          </Text>
          <View style={{ height: spacing.md }} />
          <Field
            label="Name"
            icon="person"
            value={customerName}
            onChangeText={setCustomerName}
            editable={!processing}
            autoCapitalize="words"
          />
          <View style={{ height: spacing.md }} />
          <Field
            label="Mobile"
            icon="person"
            value={customerMobile}
            onChangeText={setCustomerMobile}
            editable={!processing}
            keyboardType="phone-pad"
          />

          <View style={{ height: spacing.xl }} />
          <Text style={eyebrow(colors.textSecondary)}>PAYMENT</Text>
          <View style={{ height: spacing.sm }} />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: spacing.md,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Icon name="payment" size={sizes.iconSm} color={colors.textSecondary} />
            <View style={{ width: spacing.sm }} />
            <Text style={[text.bodyMedium, { flex: 1 }]}>Store Terminal · Demo Gateway</Text>
            <Icon name="check" size={18} color={colors.success} />
          </View>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={{
          backgroundColor: colors.background,
          padding: spacing.md,
          paddingBottom: insets.bottom + spacing.sm,
        }}
      >
        {errorMessage != null && (
          <>
            <Text style={[text.bodySmall, { color: colors.error }]}>{errorMessage}</Text>
            <View style={{ height: spacing.xs }} />
          </>
        )}
        <AppButton
          label={processing ? 'Placing order…' : `Place order · ${cart.cart.total.formatted}`}
          icon="payment"
          expand
          isLoading={processing}
          onPress={processing || cart.cart.isEmpty ? null : confirm}
        />
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const { colors, text } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 2 }}>
      <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={text.bodyMedium}>{value}</Text>
    </View>
  );
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  editable = true,
  autoCapitalize = 'none',
  keyboardType = 'default',
}: {
  label: string;
  icon: 'person';
  value: string;
  onChangeText: (v: string) => void;
  editable?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'phone-pad';
}) {
  const { colors, text } = useTheme();
  return (
    <View>
      <Text style={[text.bodySmall, { color: colors.textSecondary, marginBottom: spacing.xxs }]}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: sizes.inputMd,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.surface,
          opacity: editable ? 1 : sizes.opacityDisabled,
        }}
      >
        <Icon name={icon} size={sizes.iconSm} color={colors.textSecondary} />
        <View style={{ width: spacing.sm }} />
        <TextInput
          style={[text.bodyLarge, { flex: 1, color: colors.textPrimary, padding: 0 }]}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          placeholderTextColor={colors.textTertiary}
        />
      </View>
    </View>
  );
}
