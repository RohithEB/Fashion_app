import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { eyebrow } from '../theme/typography';
import { radius, sizes, spacing } from '../theme/tokens';
import { Icon } from '../theme/icons';
import { Product, ProductVariant } from '../models/product';
import { NetworkPhoto } from './NetworkPhoto';

/// Editorial product tile used in the catalog grid. When onPresent is given a
/// quick "view on screen" affordance is shown. Ported from `ProductCard`.
export function ProductCard({
  product,
  onTap,
  onPresent,
  ctaLabel,
  imageHeight,
}: {
  product: Product;
  onTap: () => void;
  onPresent?: () => void;
  ctaLabel?: string;
  imageHeight: number;
}) {
  const { colors, text } = useTheme();
  return (
    <Pressable onPress={onTap}>
      <View style={{ height: imageHeight }}>
        <NetworkPhoto url={product.heroImage} borderRadius={radius.lg} />
        {product.isNew && (
          <View
            style={{
              position: 'absolute',
              top: spacing.xs,
              left: spacing.xs,
              paddingHorizontal: spacing.xs,
              paddingVertical: 4,
              backgroundColor: colors.background,
              borderRadius: radius.pill,
            }}
          >
            <Text style={eyebrow(colors.textPrimary)}>NEW</Text>
          </View>
        )}
        {onPresent != null && ctaLabel == null && (
          <View style={{ position: 'absolute', top: spacing.xs, right: spacing.xs }}>
            <Pressable
              onPress={onPresent}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="showOnScreen" size={17} color={colors.onPrimary} />
            </Pressable>
          </View>
        )}
      </View>
      <View style={{ height: spacing.xs }} />
      <Text style={eyebrow(colors.textTertiary)}>{product.brand}</Text>
      <View style={{ height: 2 }} />
      <Text numberOfLines={1} style={text.titleSmall}>
        {product.name}
      </Text>
      <View style={{ height: 2 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={text.bodyMedium}>{product.price.formatted}</Text>
        <View style={{ flex: 1 }} />
        <Swatches product={product} />
      </View>
      {ctaLabel != null && onPresent != null && (
        <>
          <View style={{ height: spacing.xs }} />
          <Pressable
            onPress={onPresent}
            style={{
              backgroundColor: colors.primary,
              borderRadius: radius.pill,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="showOnScreen" size={15} color={colors.onPrimary} />
            <View style={{ width: 6 }} />
            <Text style={[text.labelLarge, { color: colors.onPrimary }]}>{ctaLabel}</Text>
          </Pressable>
        </>
      )}
    </Pressable>
  );
}

function Swatches({ product }: { product: Product }) {
  const { colors } = useTheme();
  const shown = product.variants.slice(0, 4);
  const s = sizes.iconXs - 4;
  return (
    <View style={{ flexDirection: 'row' }}>
      {shown.map((v: ProductVariant) => (
        <View
          key={v.id}
          style={{
            marginLeft: 4,
            width: s,
            height: s,
            borderRadius: s / 2,
            backgroundColor: hexToColor(v.colorHex),
            borderWidth: 1,
            borderColor: colors.border,
          }}
        />
      ))}
    </View>
  );
}

function hexToColor(hex: string): string {
  const s = hex.replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`;
  if (/^[0-9a-fA-F]{3}$/.test(s)) return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  return '#141210';
}
