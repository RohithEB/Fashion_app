import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useDeps } from '../../app/providers';
import { useListenable } from '../../core/useListenable';
import { useTheme } from '../../theme/ThemeProvider';
import { eyebrow } from '../../theme/typography';
import { radius, spacing } from '../../theme/tokens';
import { withAlpha } from '../../theme/colors';
import { Icon } from '../../theme/icons';
import { Category } from '../../models/category';
import { Product } from '../../models/product';
import { InitialsAvatar } from '../../widgets/InitialsAvatar';
import { ProductCard } from '../../widgets/ProductCard';
import { EmptyStateView, ErrorStateView, LoadingView } from '../../widgets/StateViews';
import { NowShowingBar } from '../presentation/widgets/NowShowingBar';
import { LivePreviewModal } from '../presentation/widgets/LivePreview';
import { LoadState } from './catalogController';

// Grid cell aspect ratio mirrors the Dart `childAspectRatio: 0.56` on the whole
// cell; since ProductCard here takes an explicit `imageHeight` for just the
// image portion, subtract the fixed text block (brand + name + price row)
// rendered below the image.
const CARD_TEXT_BLOCK = spacing.xs + 13.2 + 2 + 18.9 + 2 + 21;
function cardImageHeight(width: number): number {
  return width / 0.56 - CARD_TEXT_BLOCK;
}

/// Private browsing home: search, categories, and the collection grid. Nothing
/// here reaches the display until the salesperson presses "Show on Screen".
/// Ported from `HomeScreen`.
export function HomeScreen() {
  const { colors, text } = useTheme();
  const nav = useNavigation<any>();
  const { auth, catalog, cart, connection, presentation } = useDeps();
  useListenable(auth);
  useListenable(catalog);
  useListenable(cart);
  useListenable(connection);
  const { width } = useWindowDimensions();

  const [query, setQuery] = useState(catalog.query);
  const [previewOpen, setPreviewOpen] = useState(false);

  const connected = connection.liveLink;

  const outerPad = spacing.md;
  const columnGap = spacing.md;
  const columnWidth = (width - outerPad * 2 - columnGap) / 2;
  const imageHeight = cardImageHeight(columnWidth);

  const openProduct = (product: Product) => {
    catalog.lastViewedProduct = product;
    nav.navigate('Product', { product });
  };

  const presentProduct = (product: Product) => {
    presentation.showProduct(product, { size: product.defaultVariant.sizes[0] });
    setPreviewOpen(true);
  };

  let listState: 'loading' | 'error' | 'empty' | 'ready' = 'ready';
  if (catalog.state === LoadState.loading && catalog.products.length === 0) listState = 'loading';
  else if (catalog.state === LoadState.error) listState = 'error';
  else if (catalog.products.length === 0) listState = 'empty';

  const header = (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={eyebrow(colors.accent)}>THE COLLECTION</Text>
          <View style={{ height: 2 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={text.headlineSmall} numberOfLines={1}>
              Ebani
            </Text>
            <View style={{ width: spacing.sm }} />
            <StatusBadge connected={connected} />
          </View>
        </View>
        <SavedOutfitsButton count={cart.cart.count} onPress={() => nav.navigate('Cart')} />
        <Pressable onPress={() => nav.navigate('Profile')} accessibilityLabel="Profile" hitSlop={8}>
          <InitialsAvatar name={auth.salesperson?.name} radius={15} />
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.sm,
          }}
        >
          <Icon name="search" size={20} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={(v) => {
              setQuery(v);
              void catalog.search(v);
            }}
            placeholder="Search the atelier…"
            placeholderTextColor={colors.textTertiary}
            style={[text.bodyMedium, { flex: 1, paddingVertical: 12, paddingLeft: spacing.xs }]}
          />
        </View>
      </View>
      <View style={{ height: spacing.sm }} />
      <CategoryBar
        categories={catalog.categories}
        selectedId={catalog.selectedCategoryId}
        onSelect={(id) => void catalog.selectCategory(id)}
      />
      <View style={{ height: spacing.xs }} />
      <ColorExplorer
        products={catalog.products}
        onOpen={openProduct}
        onPresent={connected ? presentProduct : undefined}
      />
      <View style={{ height: spacing.xs }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <FlatList
        style={{ flex: 1 }}
        data={listState === 'ready' ? catalog.products : []}
        keyExtractor={(p) => p.id}
        numColumns={2}
        ListHeaderComponent={header}
        columnWrapperStyle={{ gap: columnGap, paddingHorizontal: outerPad, marginBottom: spacing.lg }}
        contentContainerStyle={{ paddingBottom: spacing.xl, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={catalog.state === LoadState.loading}
            onRefresh={() => void catalog.refresh()}
            tintColor={colors.accent}
          />
        }
        renderItem={({ item }) => (
          <View style={{ width: columnWidth }}>
            <ProductCard
              product={item}
              imageHeight={imageHeight}
              onTap={() => openProduct(item)}
              onPresent={connected ? () => presentProduct(item) : undefined}
            />
          </View>
        )}
        ListEmptyComponent={
          listState === 'loading' ? (
            <LoadingView label="Curating…" />
          ) : listState === 'error' ? (
            <ErrorStateView message={catalog.error ?? 'Please try again.'} onRetry={() => void catalog.load()} />
          ) : listState === 'empty' ? (
            <EmptyStateView
              title="Nothing found"
              message="Pull down to refresh, or try another search."
              icon="search"
            />
          ) : null
        }
      />
      {connection.isConnected && <NowShowingBar />}
      <LivePreviewModal visible={previewOpen} onClose={() => setPreviewOpen(false)} />
    </SafeAreaView>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  const { colors } = useTheme();
  const color = connected ? colors.success : colors.textTertiary;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xs,
        paddingVertical: 3,
        backgroundColor: withAlpha(color, 0.12),
        borderRadius: radius.pill,
      }}
    >
      <Icon name={connected ? 'connected' : 'disconnect'} size={12} color={color} />
      <View style={{ width: 4 }} />
      <Text style={[eyebrow(color), { fontSize: 9, lineHeight: 11 }]}>{connected ? 'LIVE' : 'OFFLINE'}</Text>
    </View>
  );
}

/// Quick access to the guest's saved outfits, with a live count badge.
function SavedOutfitsButton({ count, onPress }: { count: number; onPress: () => void }) {
  const { colors, text } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityLabel="Saved outfits" style={{ padding: spacing.xs }}>
      <Icon name="cart" size={24} color={colors.textPrimary} />
      {count > 0 && (
        <View
          style={{
            position: 'absolute',
            right: 4,
            top: 4,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 4,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={[text.labelSmall, { color: colors.onAccent, fontSize: 10, lineHeight: 12 }]}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

function CategoryBar({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
      <CategoryChip label="All" selected={selectedId == null} onPress={() => onSelect(null)} />
      {categories.map((cat) => (
        <CategoryChip key={cat.id} label={cat.name} selected={selectedId === cat.id} onPress={() => onSelect(cat.id)} />
      ))}
    </ScrollView>
  );
}

function CategoryChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors, text } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginRight: spacing.xs,
        paddingHorizontal: spacing.md,
        height: 36,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? colors.primary : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
      }}
    >
      <Text style={[text.labelLarge, { color: selected ? colors.onPrimary : colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

/// Colour selector: a row of swatches; picking one expands a panel listing every
/// piece available in that colour (filtered from the loaded catalogue). Tap
/// again to collapse. Ported from `_ColorExplorer`.
function ColorExplorer({
  products,
  onOpen,
  onPresent,
}: {
  products: Product[];
  onOpen: (p: Product) => void;
  onPresent?: (p: Product) => void;
}) {
  const { colors, text } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);

  const swatches = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      for (const v of p.variants) {
        if (!v.colorName || v.colorName.toLowerCase() === 'default') continue;
        if (!map.has(v.colorName)) map.set(v.colorName, v.colorHex);
      }
    }
    return Array.from(map.entries());
  }, [products]);

  if (swatches.length === 0) return null;

  const matches = selected == null ? [] : products.filter((p) => p.variants.some((v) => v.colorName === selected));
  const matchImageHeight = cardImageHeight(150);

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
        {swatches.map(([name, hex]) => (
          <Swatch
            key={name}
            color={hexToColor(hex)}
            selected={selected === name}
            onPress={() => setSelected(selected === name ? null : name)}
          />
        ))}
      </ScrollView>
      {selected != null && (
        <View style={{ paddingTop: spacing.xs }}>
          <Text style={[eyebrow(colors.accent), { paddingHorizontal: spacing.md }]}>
            {`${selected} · ${matches.length} piece${matches.length === 1 ? '' : 's'}`}
          </Text>
          <View style={{ height: spacing.xs }} />
          <View style={{ height: 268 }}>
            {matches.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>No pieces in this colour</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.md }}
              >
                {matches.map((product, i) => (
                  <View
                    key={product.id}
                    style={{ width: 150, marginRight: i === matches.length - 1 ? 0 : spacing.md }}
                  >
                    <ProductCard
                      product={product}
                      imageHeight={matchImageHeight}
                      onTap={() => onOpen(product)}
                      onPresent={onPresent ? () => onPresent(product) : undefined}
                    />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function Swatch({ color, selected, onPress }: { color: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ marginRight: spacing.sm }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: color,
          borderWidth: selected ? 3 : 1,
          borderColor: selected ? colors.accent : colors.border,
        }}
      />
    </Pressable>
  );
}

function hexToColor(hex: string): string {
  const s = hex.replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`;
  if (/^[0-9a-fA-F]{3}$/.test(s)) return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  return '#141210';
}
