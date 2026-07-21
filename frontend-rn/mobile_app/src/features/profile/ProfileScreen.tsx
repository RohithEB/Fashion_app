import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { eyebrow } from '../../theme/typography';
import { radius, spacing } from '../../theme/tokens';
import { withAlpha } from '../../theme/colors';
import { AppIconName, Icon } from '../../theme/icons';
import { AppButton } from '../../widgets/AppButton';
import { InitialsAvatar } from '../../widgets/InitialsAvatar';
import { useListenable } from '../../core/useListenable';
import { useDeps } from '../../app/providers';
import { Customer } from '../../models/customer';
import { CustomerDirectoryController } from '../customer/customerDirectoryController';

/// The associate's home base: their account details, the book of saved customer
/// profiles (with quick add), and shortcuts to saved outfits / recommendations /
/// sign out. There is deliberately no personal profile editor here — the backend
/// exposes only name, title and username for a salesperson. Ported from
/// `ProfileScreen` (profile_screen.dart).
export function ProfileScreen() {
  const { colors, text } = useTheme();
  const nav = useNavigation<any>();
  const { auth, cart, connection, onboarding, customerDirectory, presentation } = useDeps();
  useListenable(auth);
  useListenable(cart);
  useListenable(onboarding);
  useListenable(customerDirectory);

  const me = auth.salesperson;
  const active = onboarding.customer;
  const profiles = customerDirectory.profiles;

  const [menuCustomer, setMenuCustomer] = useState<Customer | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast == null) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const useCustomer = (c: Customer) => {
    onboarding.updateProfile(c);
    setToast(`${CustomerDirectoryController.labelFor(c)} is now the active guest.`);
  };

  const editCustomer = (c: Customer) => {
    onboarding.updateProfile(c);
    nav.navigate('CustomerProfile');
  };

  const confirmDelete = (c: Customer) => {
    Alert.alert(
      'Delete customer?',
      `This removes ${CustomerDirectoryController.labelFor(c)} from your saved customers.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void customerDirectory.remove(c.id) },
      ],
    );
  };

  const confirmLogout = () => {
    Alert.alert(
      'Log out?',
      'This ends the current session and signs you out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          onPress: () => {
            connection.disconnect();
            void auth.logout();
          },
        },
      ],
    );
  };

  const confirmCloseSession = () => {
    Alert.alert(
      'Close this session?',
      'The display returns to the pairing QR, ready for the next guest. You stay signed in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close session',
          onPress: () => {
            presentation.hideProduct();
            void connection.endSession();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: spacing.md }}>
        <Pressable onPress={() => nav.goBack()} hitSlop={8} style={{ padding: spacing.xs }}>
          <Icon name="back" size={18} color={colors.textPrimary} />
        </Pressable>
        <View style={{ width: spacing.sm }} />
        <Text style={text.titleLarge}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxl,
        }}
      >
        {/* Who is signed in */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <InitialsAvatar name={me?.name} radius={32} />
          <View style={{ width: spacing.md }} />
          <View style={{ flex: 1 }}>
            <Text style={text.titleLarge}>{me?.name ?? 'Associate'}</Text>
            {me?.username != null && (
              <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>{`@${me.username}`}</Text>
            )}
            {me?.title != null && me.title.length > 0 && (
              <Text style={[text.bodySmall, { color: colors.accent }]}>{me.title}</Text>
            )}
          </View>
        </View>
        <View style={{ height: spacing.xl }} />

        {/* Customer book */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={eyebrow(colors.accent)}>CUSTOMERS</Text>
          <View style={{ width: spacing.sm }} />
          <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
        </View>
        <View style={{ height: spacing.md }} />

        {active != null && !active.isEmpty && (
          <ActiveCard customer={active} onOpen={() => nav.navigate('CustomerProfile')} />
        )}

        {profiles.length === 0 ? (
          <EmptyBook />
        ) : (
          profiles.map((p) => (
            <CustomerTile
              key={p.id}
              customer={p}
              isActive={p.id === active?.id}
              onEdit={() => editCustomer(p)}
              onMenu={() => setMenuCustomer(p)}
            />
          ))
        )}

        <View style={{ height: spacing.md }} />
        <AppButton
          label="Add new customer"
          icon="add"
          expand
          onPress={() => {
            // Start a blank profile, then open the editor.
            onboarding.updateProfile(new Customer({ id: 'draft' }));
            nav.navigate('CustomerProfile');
          }}
        />
        <View style={{ height: spacing.xl }} />

        {/* Shortcuts */}
        <HubTile
          icon="cart"
          label="Saved outfits"
          subtitle={cart.cart.count === 0 ? 'Nothing saved yet' : `${cart.cart.count} item(s) saved`}
          onTap={() => nav.navigate('Cart')}
        />
        <HubTile
          icon="sparkle"
          label="Recommendations"
          subtitle="Curated picks for the active guest"
          onTap={() => nav.navigate('Recommendations')}
        />
        <HubTile
          icon="qrCode"
          label="Close session"
          subtitle="Finish with this guest — the display returns to the QR"
          onTap={confirmCloseSession}
        />
        <HubTile
          icon="logout"
          label="Sign out"
          subtitle="Ends the session and signs you out"
          onTap={confirmLogout}
        />
      </ScrollView>

      {/* Per-customer action menu (RN equivalent of the Dart PopupMenuButton) */}
      <Modal
        visible={menuCustomer != null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuCustomer(null)}
      >
        <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={() => setMenuCustomer(null)} />
        <View
          style={{
            backgroundColor: colors.surfaceElevated,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingVertical: spacing.sm,
          }}
        >
          {menuCustomer != null && menuCustomer.id !== active?.id && (
            <MenuRow
              label="Use for this session"
              onPress={() => {
                const c = menuCustomer;
                setMenuCustomer(null);
                if (c != null) useCustomer(c);
              }}
            />
          )}
          <MenuRow
            label="Edit"
            onPress={() => {
              const c = menuCustomer;
              setMenuCustomer(null);
              if (c != null) editCustomer(c);
            }}
          />
          <MenuRow
            label="Delete"
            onPress={() => {
              const c = menuCustomer;
              setMenuCustomer(null);
              if (c != null) confirmDelete(c);
            }}
          />
        </View>
      </Modal>

      {toast != null && (
        <View
          style={{
            position: 'absolute',
            left: spacing.md,
            right: spacing.md,
            bottom: spacing.md,
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

function ActiveCard({ customer, onOpen }: { customer: Customer; onOpen: () => void }) {
  const { colors, text } = useTheme();
  return (
    <View
      style={{
        marginBottom: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: withAlpha(colors.accent, 0.1),
        borderWidth: 1,
        borderColor: colors.accent,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Icon name="connected" size={18} color={colors.accent} />
      <View style={{ width: spacing.sm }} />
      <View style={{ flex: 1 }}>
        <Text style={eyebrow(colors.accent)}>ACTIVE THIS SESSION</Text>
        <View style={{ height: 2 }} />
        <Text style={text.titleSmall}>{CustomerDirectoryController.labelFor(customer)}</Text>
      </View>
      <Pressable onPress={onOpen}>
        <Text style={[text.labelLarge, { color: colors.accent }]}>Open</Text>
      </Pressable>
    </View>
  );
}

function CustomerTile({
  customer,
  isActive,
  onEdit,
  onMenu,
}: {
  customer: Customer;
  isActive: boolean;
  onEdit: () => void;
  onMenu: () => void;
}) {
  const { colors, text } = useTheme();
  return (
    <Pressable
      onPress={onEdit}
      style={{
        marginBottom: spacing.sm,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: isActive ? colors.accent : colors.border,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      }}
    >
      <InitialsAvatar name={CustomerDirectoryController.labelFor(customer)} radius={18} />
      <View style={{ width: spacing.sm }} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[text.titleSmall, { flexShrink: 1 }]} numberOfLines={1}>
            {CustomerDirectoryController.labelFor(customer)}
          </Text>
          {customer.isRepeatCustomer && (
            <>
              <View style={{ width: spacing.xs }} />
              <MaterialIcons name="star" size={14} color={colors.accent} />
            </>
          )}
        </View>
        <Text style={[text.bodySmall, { color: colors.textSecondary }]} numberOfLines={2}>
          {CustomerDirectoryController.summaryFor(customer)}
        </Text>
      </View>
      <View style={{ width: spacing.xs }} />
      <Pressable onPress={onMenu} hitSlop={8} style={{ padding: spacing.xs }}>
        <Icon name="more" size={20} color={colors.textTertiary} />
      </Pressable>
    </Pressable>
  );
}

function EmptyBook() {
  const { colors, text } = useTheme();
  return (
    <View
      style={{
        width: '100%',
        padding: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
      }}
    >
      <Text style={text.titleSmall}>No saved customers yet</Text>
      <View style={{ height: spacing.xs }} />
      <Text style={[text.bodySmall, { color: colors.textSecondary, textAlign: 'center' }]}>
        Add a customer and they will appear here for future visits.
      </Text>
    </View>
  );
}

/// A single navigation row in the profile hub.
function HubTile({
  icon,
  label,
  subtitle,
  onTap,
}: {
  icon: AppIconName;
  label: string;
  subtitle: string;
  onTap: () => void;
}) {
  const { colors, text } = useTheme();
  return (
    <Pressable
      onPress={onTap}
      style={{
        marginBottom: spacing.sm,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      <Icon name={icon} color={colors.accent} size={22} />
      <View style={{ width: spacing.md }} />
      <View style={{ flex: 1 }}>
        <Text style={text.titleSmall}>{label}</Text>
        <Text style={[text.bodySmall, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={colors.textTertiary} />
    </Pressable>
  );
}

function MenuRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { text } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.xl }}>
      <Text style={text.bodyLarge}>{label}</Text>
    </Pressable>
  );
}
