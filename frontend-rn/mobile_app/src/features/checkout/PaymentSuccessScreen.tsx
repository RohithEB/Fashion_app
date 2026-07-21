import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { Icon } from '../../theme/icons';
import { motion, spacing } from '../../theme/tokens';
import { useDeps } from '../../app/providers';
import { AppButton } from '../../widgets/AppButton';
import { Order } from '../../models/order';

/// Payment confirmation. The display simultaneously shows its Thank-You screen
/// (driven by the `paymentSuccess` event). When an order is provided, its
/// reference and total are shown as proof the sale was recorded. Ported from
/// `PaymentSuccessScreen`.
export function PaymentSuccessScreen() {
  const { colors, text } = useTheme();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { presentation, connection } = useDeps();
  const order: Order | undefined = route.params?.order;

  const scale = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.timing(scale, { toValue: 1, duration: motion.slow, useNativeDriver: true }).start();
  }, [scale]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: spacing.xl, alignItems: 'center' }}>
        <View style={{ flex: 2 }} />
        <Animated.View style={{ transform: [{ scale }] }}>
          <Icon name="success" size={88} color={colors.success} />
        </Animated.View>
        <View style={{ height: spacing.xl }} />
        <Text style={[text.displaySmall, { textAlign: 'center' }]}>Thank you</Text>
        <View style={{ height: spacing.sm }} />
        <Text style={[text.bodyLarge, { color: colors.textSecondary, textAlign: 'center' }]}>
          The order is complete and the client display is showing a thank-you message.
        </Text>

        {order != null && (
          <>
            <View style={{ height: spacing.xl }} />
            <View
              style={{
                width: '100%',
                padding: spacing.lg,
                backgroundColor: colors.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <DetailRow label="Order" value={`#${order.id}`} />
              <View style={{ height: spacing.xs }} />
              <DetailRow label="Items" value={`${order.itemCount}`} />
              {order.customerName != null && (
                <>
                  <View style={{ height: spacing.xs }} />
                  <DetailRow label="Customer" value={order.customerName} />
                </>
              )}
              <View style={{ height: spacing.xs }} />
              <DetailRow label="Total" value={order.total.formatted} emphasize />
            </View>
          </>
        )}

        <View style={{ flex: 3 }} />
        <AppButton
          label="Go to QR screen"
          icon="qrCode"
          expand
          onPress={() => {
            presentation.hideProduct();
            void connection.endSession();
          }}
        />
        <View style={{ height: spacing.sm }} />
        <AppButton
          label="Save profile changes"
          icon="person"
          variant="outline"
          expand
          onPress={() => nav.navigate('Profile')}
        />
        <View style={{ height: spacing.sm }} />
        <Pressable
          onPress={() => {
            presentation.hideProduct();
            nav.navigate('Home');
          }}
        >
          <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>Continue with this guest</Text>
        </Pressable>
        <View style={{ height: spacing.xl }} />
      </View>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  const { colors, text } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={[emphasize ? text.titleMedium : text.bodyMedium, { color: emphasize ? undefined : colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
}
