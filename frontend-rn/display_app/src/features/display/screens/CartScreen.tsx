import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { eyebrow } from '../../../theme/typography';
import { radius, spacing } from '../../../theme/tokens';
import { withAlpha } from '../../../theme/colors';
import { NetworkPhoto } from '../../../widgets/NetworkPhoto';
import { useDisplaySelector } from '../DisplayContext';

/// Read-only cart page mirrored from the controller. Ported from `CartScreen`.
export function CartScreen() {
  const { colors, text } = useTheme();
  const cart = useDisplaySelector((c) => c.cartView);
  const items: any[] = (cart?.items as any[]) ?? [];
  const customerName = cart?.customerName as string | undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl }}>
      <Text style={eyebrow(colors.accent)}>YOUR SELECTION</Text>
      <View style={{ height: spacing.xs }} />
      <Text style={text.displaySmall}>{customerName == null ? 'Saved outfits' : `${customerName}'s outfits`}</Text>
      <View style={{ height: spacing.lg }} />
      <View style={{ flex: 1 }}>
        {items.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[text.bodyLarge, { color: colors.textSecondary }]}>No saved outfits yet.</Text>
          </View>
        ) : (
          <ScrollView>
            {items.map((item, i) => (
              <View key={i}>
                {i > 0 && <View style={{ height: spacing.md }} />}
                <CartLine item={item} />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
      {items.length > 0 && cart != null && <Summary data={cart} />}
    </View>
  );
}

function CartLine({ item }: { item: Record<string, any> }) {
  const { colors, text } = useTheme();
  const image = item.image as string | undefined;
  const quantity = (item.quantity as number) ?? 1;
  const meta = [item.color, item.size].filter((x) => x != null).join('  ·  ');

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ width: 72, height: 92, borderRadius: radius.md, overflow: 'hidden' }}>
        <NetworkPhoto url={image} />
      </View>
      <View style={{ width: spacing.md }} />
      <View style={{ flex: 1 }}>
        {item.brand != null && <Text style={eyebrow(colors.textTertiary)}>{`${item.brand}`}</Text>}
        <Text numberOfLines={1} style={text.titleMedium}>
          {`${item.name ?? ''}`}
        </Text>
        <View style={{ height: 2 }} />
        <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>{meta}</Text>
      </View>
      <View style={{ width: spacing.md }} />
      <View style={{ alignItems: 'flex-end' }}>
        <View
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            backgroundColor: withAlpha(colors.accent, 0.14),
            borderRadius: radius.pill,
          }}
        >
          <Text style={[text.titleSmall, { color: colors.accent }]}>{`×${quantity}`}</Text>
        </View>
        <View style={{ height: spacing.xs }} />
        <Text style={text.titleMedium}>{`${item.lineTotal ?? ''}`}</Text>
      </View>
    </View>
  );
}

function Summary({ data }: { data: Record<string, any> }) {
  const { colors, text } = useTheme();
  const Row = ({ label, value, emphasize = false }: { label: string; value?: string; emphasize?: boolean }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 3 }}>
      <Text style={[emphasize ? text.titleMedium : text.bodyLarge, { color: colors.textSecondary }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={emphasize ? text.headlineSmall : text.bodyLarge}>{value ?? ''}</Text>
    </View>
  );
  return (
    <View
      style={{
        marginTop: spacing.md,
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Row label="Subtotal" value={data.subtotal as string | undefined} />
      <Row label="Tax" value={data.tax as string | undefined} />
      <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: spacing.lg / 2 }} />
      <Row label="Total" value={data.total as string | undefined} emphasize />
    </View>
  );
}
