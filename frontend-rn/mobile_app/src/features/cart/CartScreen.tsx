import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { Icon } from '../../theme/icons';
import { radius, spacing } from '../../theme/tokens';
import { useDeps } from '../../app/providers';
import { useListenable } from '../../core/useListenable';
import { AppButton } from '../../widgets/AppButton';
import { NetworkPhoto } from '../../widgets/NetworkPhoto';
import { EmptyStateView } from '../../widgets/StateViews';
import { Cart, CartItem } from '../../models/cart';
import { LivePreviewModal } from '../presentation/widgets/LivePreview';

/// Serialise the cart into a display-friendly payload (formatted strings so the
/// display renders it read-only without any Money logic). Ported 1:1 from the
/// Dart `cartPayload` helper (also imported by CheckoutScreen).
export function cartPayload(cart: Cart, opts?: { customerName?: string | null }): Record<string, any> {
  const payload: Record<string, any> = {
    items: cart.items.map((i: CartItem) => ({
      name: i.product.name,
      brand: i.product.brand,
      color: i.variant.colorName,
      size: i.size,
      quantity: i.quantity,
      lineTotal: i.lineTotal.formatted,
      image: i.variant.images[0]?.url,
    })),
    count: cart.count,
    subtotal: cart.subtotal.formatted,
    tax: cart.tax.formatted,
    total: cart.total.formatted,
  };
  if (opts?.customerName != null && opts.customerName.length > 0) payload.customerName = opts.customerName;
  return payload;
}

/// The cart doubles as the salesperson's **shortlist and on-screen selector**:
/// each line can be pushed to the display with one tap ("Present"), so the
/// associate can help a client compare shortlisted looks live. Ported from
/// `CartScreen`.
export function CartScreen() {
  const { colors, text } = useTheme();
  const nav = useNavigation<any>();
  const { cart, presentation, connection, onboarding } = useDeps();
  useListenable(cart);
  useListenable(presentation);
  useListenable(connection);

  const data = cart.cart;
  const connected = connection.liveLink;
  const customerName = onboarding.customer?.name;

  // While the cart is mirrored on the display, re-sync on every change
  // (quantity edits, deletions).
  useEffect(() => {
    if (presentation.cartOnScreen) {
      presentation.syncCart(cartPayload(data, { customerName }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, presentation.cartOnScreen, customerName]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: spacing.xxs }}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12} style={{ padding: spacing.sm }}>
          <Icon name="back" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={text.titleLarge}>Saved outfits</Text>
      </View>

      {data.isEmpty ? (
        <EmptyStateView
          title="No saved outfits yet"
          message="Save pieces to compare them live on the display."
          icon="cart"
        />
      ) : (
        <FlatList
          data={data.items}
          keyExtractor={(i) => i.lineId}
          contentContainerStyle={{ padding: spacing.md }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => <CartTile item={item} />}
        />
      )}

      {!data.isEmpty && (
        <Summary
          cart={data}
          connected={connected}
          showing={presentation.cartOnScreen}
          onShowOnScreen={() => presentation.showCart(cartPayload(data, { customerName }))}
        />
      )}
    </SafeAreaView>
  );
}

function CartTile({ item }: { item: CartItem }) {
  const { colors, text } = useTheme();
  const { presentation, connection, cart } = useDeps();
  useListenable(presentation);
  useListenable(connection);
  const [previewOpen, setPreviewOpen] = useState(false);

  const connected = connection.liveLink;
  const presenting =
    presentation.presentation?.productId === item.product.id &&
    presentation.presentation?.variantId === item.variantId;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: spacing.xs,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: presenting ? colors.accent : colors.border,
      }}
    >
      <View style={{ width: 72, height: 92, borderRadius: radius.md, overflow: 'hidden' }}>
        <NetworkPhoto url={item.variant.images[0]?.url} />
      </View>
      <View style={{ width: spacing.sm }} />
      <View style={{ flex: 1 }}>
        <View style={{ height: spacing.xxs }} />
        <Text numberOfLines={1} style={text.titleSmall}>
          {item.product.name}
        </Text>
        <View style={{ height: 2 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text numberOfLines={1} style={[text.bodySmall, { color: colors.textSecondary, flexShrink: 1 }]}>
            {item.variant.colorName}
          </Text>
          <View style={{ width: spacing.xs }} />
          <SizePicker item={item} />
        </View>
        <View style={{ height: spacing.xs }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Stepper item={item} />
          <View style={{ flex: 1 }} />
          <Text style={text.titleSmall}>{item.lineTotal.formatted}</Text>
        </View>
        <View style={{ height: spacing.xs }} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <AppButton
              label={presenting ? 'On screen' : connected ? 'Present' : 'Offline'}
              icon={presenting ? 'connected' : connected ? 'showOnScreen' : 'disconnect'}
              size="small"
              variant={presenting ? 'secondary' : 'primary'}
              onPress={
                presenting
                  ? () => setPreviewOpen(true)
                  : !connected
                    ? null
                    : () => {
                        presentation.showProduct(item.product, { variantId: item.variantId, size: item.size });
                        setPreviewOpen(true);
                      }
              }
            />
          </View>
          <Pressable onPress={() => cart.removeItem(item.lineId)} hitSlop={8} style={{ padding: spacing.xs }}>
            <Icon name="delete" size={20} color={colors.textTertiary} />
          </Pressable>
        </View>
      </View>
      <LivePreviewModal visible={previewOpen} onClose={() => setPreviewOpen(false)} />
    </View>
  );
}

/// Compact size selector for a cart line. Picking a size re-sizes the line via
/// `CartController.setSize`; while the cart is mirrored, the change re-syncs to
/// the display automatically on the next render.
function SizePicker({ item }: { item: CartItem }) {
  const { colors, text } = useTheme();
  const { cart } = useDeps();
  const [open, setOpen] = useState(false);
  const sizesList = item.variant.sizes;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.xs,
          paddingVertical: 2,
        }}
      >
        <Text style={[text.bodySmall, { color: colors.textSecondary }]}>{`Size ${item.size}`}</Text>
        <Icon name="chevronDown" size={16} color={colors.textTertiary} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={() => setOpen(false)}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Pressable
              style={{
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.lg,
                paddingVertical: spacing.xs,
                minWidth: 160,
              }}
            >
              {sizesList.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    cart.setSize(item.lineId, s);
                    setOpen(false);
                  }}
                  style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}
                >
                  <Text style={text.bodyMedium}>{`Size ${s}`}</Text>
                </Pressable>
              ))}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function Stepper({ item }: { item: CartItem }) {
  const { colors, text } = useTheme();
  const { cart } = useDeps();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.pill,
      }}
    >
      <StepButton icon="remove" onPress={() => cart.setQuantity(item.lineId, item.quantity - 1)} />
      <Text style={text.titleSmall}>{`${item.quantity}`}</Text>
      <StepButton icon="add" onPress={() => cart.setQuantity(item.lineId, item.quantity + 1)} />
    </View>
  );
}

function StepButton({ icon, onPress }: { icon: 'add' | 'remove'; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ padding: spacing.xs }}>
      <Icon name={icon} size={16} color={colors.textPrimary} />
    </Pressable>
  );
}

function Summary({
  cart,
  connected,
  showing,
  onShowOnScreen,
}: {
  cart: Cart;
  connected: boolean;
  showing: boolean;
  onShowOnScreen: () => void;
}) {
  const { colors, text } = useTheme();
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        padding: spacing.md,
        paddingBottom: insets.bottom + spacing.md,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <SummaryRow label="Subtotal" value={cart.subtotal.formatted} />
      {cart.discountRate > 0 && <SummaryRow label="Discount" value={`-${cart.discount.formatted}`} />}
      <SummaryRow label="Tax" value={cart.tax.formatted} />
      <View style={{ height: spacing.xs }} />
      <View style={{ height: 1, backgroundColor: colors.divider }} />
      <View style={{ height: spacing.xs }} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={text.titleMedium}>Total</Text>
        <View style={{ flex: 1 }} />
        <Text style={text.titleLarge}>{cart.total.formatted}</Text>
      </View>
      <View style={{ height: spacing.md }} />
      {connected && (
        <>
          <AppButton
            label={showing ? 'Outfits on screen' : 'Show saved outfits on screen'}
            icon={showing ? 'connected' : 'showOnScreen'}
            variant="secondary"
            expand
            onPress={onShowOnScreen}
          />
          <View style={{ height: spacing.sm }} />
        </>
      )}
      <AppButton label="Checkout" icon="checkout" expand onPress={() => nav.navigate('Checkout')} />
    </View>
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
