import React from 'react';
import { FlatList, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { eyebrow } from '../../../theme/typography';
import { radius, spacing } from '../../../theme/tokens';
import { Product } from '../../../models/product';
import { NetworkPhoto } from '../../../widgets/NetworkPhoto';
import { useDisplaySelector } from '../DisplayContext';

/// The full collection shown as a grid — pushed by the controller after
/// onboarding (view-only). Ported from `CatalogScreen`.
export function CatalogScreen() {
  const { colors, text } = useTheme();
  const products = useDisplaySelector((c) => c.catalogGrid);
  const title = useDisplaySelector((c) => c.catalogueTitle);
  const curated = title !== 'The Collection';
  const { width } = useWindowDimensions();

  const outerPad = spacing.xl;
  const avail = width - outerPad * 2;
  const columns = avail > 900 ? 4 : 2;
  const gap = spacing.md;
  const itemWidth = (avail - gap * (columns - 1)) / columns;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: outerPad }}>
      <Text style={eyebrow(colors.accent)}>{title.toUpperCase()}</Text>
      <View style={{ height: spacing.xs }} />
      <Text style={text.displaySmall}>{curated ? 'Handpicked for you' : 'Explore the atelier'}</Text>
      <View style={{ height: spacing.lg }} />
      {products.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[text.bodyLarge, { color: colors.textSecondary }]}>Preparing the collection…</Text>
        </View>
      ) : (
        <FlatList
          key={columns}
          data={products}
          keyExtractor={(p) => p.id}
          numColumns={columns}
          columnWrapperStyle={{ gap }}
          contentContainerStyle={{ gap: spacing.lg }}
          renderItem={({ item }) => (
            <View style={{ width: itemWidth }}>
              <CatalogCard product={item} width={itemWidth} />
            </View>
          )}
        />
      )}
    </View>
  );
}

function CatalogCard({ product, width }: { product: Product; width: number }) {
  const { colors, text } = useTheme();
  const cellHeight = width / 0.62;
  return (
    <View style={{ height: cellHeight }}>
      <View style={{ flex: 1 }}>
        <NetworkPhoto url={product.heroImage} borderRadius={radius.lg} />
      </View>
      <View style={{ height: spacing.sm }} />
      <Text style={eyebrow(colors.textTertiary)}>{product.brand}</Text>
      <View style={{ height: 2 }} />
      <Text numberOfLines={1} style={text.titleSmall}>
        {product.name}
      </Text>
      <View style={{ height: 2 }} />
      <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>{product.price.formatted}</Text>
    </View>
  );
}
