import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { eyebrow } from '../../theme/typography';
import { sizes, spacing } from '../../theme/tokens';
import { Icon } from '../../theme/icons';
import { useDeps } from '../../app/providers';
import { useListenable } from '../../core/useListenable';
import { AppButton } from '../../widgets/AppButton';
import { EmptyStateView, LoadingView } from '../../widgets/StateViews';
import { ProductCard } from '../../widgets/ProductCard';
import { Product } from '../../models/product';
import { LivePreviewModal } from '../presentation/widgets/LivePreview';

/// Curated picks matched to the guest's onboarding profile (gender · personality
/// · age range) against the enriched catalog — fetched from the backend
/// `GET /api/recommendations`. The associate can push any pick straight to the
/// display. Ported 1:1 from `RecommendationsScreen`.
export function RecommendationsScreen() {
  const { colors, text } = useTheme();
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { catalogRepo, connection, onboarding, presentation, journey, auth } = useDeps();
  useListenable(connection);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const connected = connection.liveLink;
  const guest = onboarding.customer;
  const name = guest?.name;

  useEffect(() => {
    // Record that the associate opened recommendations for this guest.
    journey.log({
      eventType: 'recommendations_opened',
      token: auth.token,
      sessionId: connection.session?.sessionId,
      refId: guest?.id,
    });
    let alive = true;
    setLoading(true);
    void catalogRepo
      .recommendations({
        gender: guest?.gender,
        ageRange: guest?.ageRange,
        personality: guest?.personality,
        customerId: guest?.id,
        styleHints: guest?.styleHints ?? [],
        limit: 12,
      })
      .then((picks) => {
        if (!alive) return;
        setItems(picks);
        setLoading(false);
        // Mirror the picks onto the display as a grid, preserving order.
        presentation.showRecommendations(picks.map((p) => p.id));
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gap = spacing.md;
  const cardWidth = (width - spacing.md * 2 - gap) / 2;
  const imageHeight = cardWidth / sizes.ratioPortrait;

  const present = (product: Product) => {
    presentation.showProduct(product, { size: product.defaultVariant.sizes[0] });
    setPreviewOpen(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: spacing.xxs }}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12} style={{ padding: spacing.sm }}>
          <Icon name="back" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={text.titleLarge}>Recommendations</Text>
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xs }}>
        <Text style={eyebrow(colors.accent)}>{name == null ? 'Curated for your guest' : `Curated for ${name}`}</Text>
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
          <LoadingView label="Matching the look…" />
        ) : items.length === 0 ? (
          <EmptyStateView
            title="No matches yet"
            message="Capture a guest profile or add enriched products."
            icon="sparkle"
          />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(p) => p.id}
            numColumns={2}
            contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.xl }}
            columnWrapperStyle={{ gap }}
            ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
            renderItem={({ item }) => (
              <View style={{ width: cardWidth }}>
                <ProductCard
                  product={item}
                  imageHeight={imageHeight}
                  onTap={() => nav.navigate('Product', { product: item })}
                  onPresent={connected ? () => present(item) : undefined}
                  ctaLabel={connected ? 'Show on screen' : undefined}
                />
              </View>
            )}
          />
        )}
      </View>

      <View style={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.sm }}>
        <AppButton
          label="Explore the full collection"
          icon="showOnScreen"
          variant="secondary"
          expand
          onPress={() => nav.navigate('Home')}
        />
      </View>

      <LivePreviewModal visible={previewOpen} onClose={() => setPreviewOpen(false)} />
    </SafeAreaView>
  );
}
