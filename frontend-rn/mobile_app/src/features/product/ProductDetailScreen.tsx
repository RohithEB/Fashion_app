import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinchGestureHandler, PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { eyebrow, sansRegular } from '../../theme/typography';
import { radius, spacing } from '../../theme/tokens';
import { Icon } from '../../theme/icons';
import { withAlpha } from '../../theme/colors';
import { Product, ProductVariant } from '../../models/product';
import { NetworkPhoto } from '../../widgets/NetworkPhoto';
import { PriceTag } from '../../widgets/PriceTag';
import { AppButton } from '../../widgets/AppButton';
import { useDeps } from '../../app/providers';
import { useListenable } from '../../core/useListenable';
import { LivePreviewModal } from '../presentation/widgets/LivePreview';

/// Private product detail. The image fills the screen; a draggable details sheet
/// sits at the bottom and drags up to reveal the full enriched details. While
/// presenting, expanding the sheet / colour / size / zoom stay synchronized to
/// the display. Ported 1:1 from `ProductDetailScreen`.
export function ProductDetailScreen() {
  const { colors } = useTheme();
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const deps = useDeps();
  const { presentation, connection, cart, auth, onboarding, journey, catalogRepo } = deps;
  useListenable(presentation);
  useListenable(connection);
  const { height: screenH } = useWindowDimensions();

  const initial: Product = route.params?.product ?? deps.catalog.lastViewedProduct;

  const [product, setProduct] = useState<Product>(initial);
  const [variantId, setVariantId] = useState<string>(initial.defaultVariant.id);
  const [size, setSize] = useState<string>(initial.defaultVariant.sizes[0]);
  const [imageIndex, setImageIndex] = useState(0);
  const [detailsShown, setDetailsShown] = useState(false);
  const [talkingPoint, setTalkingPoint] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const variant = product.variantById(variantId);
  const collapsed = screenH * 0.42;
  const expanded = screenH * 0.92;

  const galleryRef = useRef<ScrollView>(null);
  const { width: screenW } = useWindowDimensions();

  const presentingThis =
    presentation.isPresenting && presentation.presentation?.productId === product.id;
  const connected = connection.liveLink;

  // Load full detail + the private talking point on mount.
  useEffect(() => {
    let alive = true;
    void catalogRepo.productById(initial.id).then((full) => {
      if (full != null && alive) {
        setProduct(full);
        setVariantId(full.defaultVariant.id);
        setSize(full.defaultVariant.sizes[0]);
        setImageIndex(0);
      }
    });
    void catalogRepo
      .talkingPoint({
        productId: initial.id,
        customerId: onboarding.customer?.id,
        personality: onboarding.customer?.personality,
        name: onboarding.customer?.name,
      })
      .then((tp) => {
        if (tp != null && tp.length > 0 && alive) setTalkingPoint(tp);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id]);

  const isPresentingThisNow = () =>
    presentation.isPresenting && presentation.presentation?.productId === product.id;

  const selectVariant = (id: string) => {
    const newSize = product.variantById(id).sizes[0];
    setVariantId(id);
    setImageIndex(0);
    setSize(newSize);
    galleryRef.current?.scrollTo({ x: 0, animated: false });
    if (isPresentingThisNow()) presentation.changeColor(id, { size: newSize });
  };

  const selectSize = (s: string) => {
    setSize(s);
    if (isPresentingThisNow()) presentation.changeSize(s);
  };

  const onImageChanged = (i: number) => {
    setImageIndex(i);
    if (isPresentingThisNow()) presentation.changeImage(i);
  };

  const onDetailScroll = (fraction: number) => {
    if (isPresentingThisNow()) presentation.syncScroll(fraction);
  };

  const setDetails = (expandedNow: boolean) => {
    if (expandedNow === detailsShown) return;
    setDetailsShown(expandedNow);
    if (isPresentingThisNow()) presentation.showDetails(expandedNow);
  };

  const showOnScreen = () => {
    presentation.showProduct(product, { variantId, size });
    if (detailsShown) presentation.showDetails(true);
    setPreviewOpen(true);
  };

  const addToCart = () => {
    cart.addItem(product, { variantId, size });
    journey.log({
      eventType: 'cart_add',
      token: auth.token,
      sessionId: connection.session?.sessionId,
      refId: product.id,
      meta: { size, variantId },
    });
    setToast(`${product.name} saved to outfits`);
    setTimeout(() => setToast(null), 2200);
  };

  const openFullscreen = () => {
    if (isPresentingThisNow()) presentation.setFullscreen(true);
    setFullscreen(true);
  };
  const closeFullscreen = () => {
    setFullscreen(false);
    if (isPresentingThisNow()) {
      presentation.setFullscreen(false);
      presentation.resetZoom();
    }
  };

  // Draggable sheet height.
  const sheetH = useRef(new Animated.Value(collapsed)).current;
  const sheetVal = useRef(collapsed);
  useEffect(() => {
    const id = sheetH.addListener(({ value }) => (sheetVal.current = value));
    return () => sheetH.removeListener(id);
  }, [sheetH]);

  const snapTo = (target: number) => {
    Animated.timing(sheetH, { toValue: target, duration: 280, useNativeDriver: false }).start();
    setDetails(target > (collapsed + expanded) / 2);
  };
  const toggleSheet = () => snapTo(detailsShown ? collapsed : expanded);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        const next = Math.min(expanded, Math.max(collapsed, sheetVal.current - g.dy));
        sheetH.setValue(next);
      },
      onPanResponderRelease: () => {
        const mid = (collapsed + expanded) / 2;
        snapTo(sheetVal.current > mid ? expanded : collapsed);
      },
    }),
  ).current;

  const images = variant.images;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Full-bleed gallery */}
      <Pressable style={{ flex: 1 }} onPress={openFullscreen}>
        <ScrollView
          ref={galleryRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => onImageChanged(Math.round(e.nativeEvent.contentOffset.x / screenW))}
          style={{ flex: 1 }}
        >
          {images.map((m, i) => (
            <View key={i} style={{ width: screenW }}>
              <NetworkPhoto url={m.url} />
            </View>
          ))}
        </ScrollView>
        {images.length > 1 && (
          <View
            style={{
              position: 'absolute',
              bottom: collapsed + spacing.md,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {images.map((_, i) => (
              <View
                key={i}
                style={{
                  marginHorizontal: 3,
                  width: i === imageIndex ? 20 : 6,
                  height: 6,
                  borderRadius: radius.pill,
                  backgroundColor: i === imageIndex ? colors.onPrimary : withAlpha(colors.onPrimary, 0.5),
                }}
              />
            ))}
          </View>
        )}
      </Pressable>

      {/* Back button */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0 }}>
        <Pressable
          onPress={() => nav.goBack()}
          style={{
            margin: spacing.xs,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.45)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="back" size={18} color="#FFFFFF" />
        </Pressable>
      </SafeAreaView>

      {/* Draggable details sheet */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: sheetH,
          backgroundColor: colors.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View {...pan.panHandlers} style={{ alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.xs }}>
          <View style={{ width: 44, height: 4, borderRadius: radius.pill, backgroundColor: colors.border }} />
        </View>
        <DetailsSheet
          product={product}
          variant={variant}
          selectedVariantId={variantId}
          selectedSize={size}
          presentingThis={presentingThis}
          expanded={detailsShown}
          talkingPoint={talkingPoint}
          onSelectVariant={selectVariant}
          onSelectSize={selectSize}
          onToggleDetails={toggleSheet}
          onScroll={onDetailScroll}
        />
      </Animated.View>

      {/* Pinned actions */}
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.background }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <View style={{ flex: 3 }}>
            <AppButton
              label={!connected ? 'No screen connected' : presentingThis ? 'Showing live' : 'Show on Screen'}
              icon={!connected ? 'disconnect' : presentingThis ? 'connected' : 'showOnScreen'}
              expand
              onPress={!connected || presentingThis ? null : showOnScreen}
            />
          </View>
          <View style={{ width: spacing.sm }} />
          <View style={{ flex: 2 }}>
            <AppButton label="Add" icon="add" variant="outline" expand onPress={addToCart} />
          </View>
        </View>
      </SafeAreaView>

      {toast != null && (
        <View style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: 96 }}>
          <View style={{ backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md }}>
            <Text style={{ color: colors.onPrimary }}>{toast}</Text>
          </View>
        </View>
      )}

      <LivePreviewModal visible={previewOpen} onClose={() => setPreviewOpen(false)} />
      <FullscreenViewer
        visible={fullscreen}
        variant={variant}
        initialIndex={imageIndex}
        presenting={presentingThis}
        onImageChanged={onImageChanged}
        onTransform={presentingThis ? (s, px, py) => presentation.zoom(s, { focalX: px, focalY: py }) : undefined}
        onClose={closeFullscreen}
      />
    </View>
  );
}

function DetailsSheet({
  product,
  variant,
  selectedVariantId,
  selectedSize,
  presentingThis,
  expanded,
  talkingPoint,
  onSelectVariant,
  onSelectSize,
  onToggleDetails,
  onScroll,
}: {
  product: Product;
  variant: ProductVariant;
  selectedVariantId: string;
  selectedSize: string;
  presentingThis: boolean;
  expanded: boolean;
  talkingPoint: string | null;
  onSelectVariant: (id: string) => void;
  onSelectSize: (s: string) => void;
  onToggleDetails: () => void;
  onScroll: (fraction: number) => void;
}) {
  const { colors, text } = useTheme();
  const contentH = useRef(0);
  const viewH = useRef(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const max = contentH.current - viewH.current;
    if (max > 0) onScroll(Math.max(0, Math.min(1, e.nativeEvent.contentOffset.y / max)));
  };

  return (
    <ScrollView
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onContentSizeChange={(_, h) => (contentH.current = h)}
      onLayout={(e) => (viewH.current = e.nativeEvent.layout.height)}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl }}
    >
      <Text style={eyebrow(colors.textTertiary)}>{product.brand}</Text>
      <View style={{ height: spacing.xxs }} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={[text.headlineSmall, { flex: 1 }]}>{product.name}</Text>
        <View style={{ width: spacing.sm }} />
        <PriceTag base={product.price} effective={variant.price ?? product.price} style={text.titleMedium} />
      </View>
      <View style={{ height: spacing.lg }} />

      {talkingPoint != null && talkingPoint.length > 0 && (
        <>
          <TalkingPointCard text={talkingPoint} />
          <View style={{ height: spacing.lg }} />
        </>
      )}

      <Text style={eyebrow(colors.textSecondary)}>{`COLOR — ${variant.colorName}`}</Text>
      <View style={{ height: spacing.xs }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {product.variants.map((v) => {
          const selected = v.id === selectedVariantId;
          return (
            <Pressable
              key={v.id}
              onPress={() => onSelectVariant(v.id)}
              style={{
                width: 40,
                height: 40,
                marginRight: spacing.sm,
                marginBottom: spacing.xs,
                borderRadius: 20,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? colors.accent : colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: hexToColor(v.colorHex) }} />
            </Pressable>
          );
        })}
      </View>
      <View style={{ height: spacing.lg }} />

      <Text style={eyebrow(colors.textSecondary)}>SIZE</Text>
      <View style={{ height: spacing.xs }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {variant.sizes.map((s) => {
          const selected = s === selectedSize;
          return (
            <Pressable
              key={s}
              onPress={() => onSelectSize(s)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                marginRight: spacing.xs,
                marginBottom: spacing.xs,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary : 'transparent',
              }}
            >
              <Text style={[text.labelMedium, { color: selected ? colors.onPrimary : colors.textPrimary }]}>{s}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ height: spacing.lg }} />
      <View style={{ height: spacing.sm }} />

      <Pressable onPress={onToggleDetails} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevronDown" size={20} color={colors.textPrimary} />
        <View style={{ width: 4 }} />
        <Text style={[text.labelLarge, { color: colors.textPrimary }]}>{expanded ? 'Hide details' : 'View all details'}</Text>
      </Pressable>

      <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: spacing.lg / 2 }} />

      {product.description.length > 0 && (
        <>
          <Text style={[sansRegular(text.bodyLarge), { color: colors.textSecondary }]}>{product.description}</Text>
          <View style={{ height: spacing.lg }} />
        </>
      )}

      {product.aiHighlights.length > 0 && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="sparkle" size={16} color={colors.accent} />
            <View style={{ width: spacing.xs }} />
            <Text style={eyebrow(colors.textSecondary)}>STYLE NOTES</Text>
          </View>
          <View style={{ height: spacing.sm }} />
          {product.aiHighlights.map((h, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: spacing.xs }}>
              <Text style={[text.bodyMedium, { color: colors.accent }]}>{'—  '}</Text>
              <Text style={[text.bodyMedium, { flex: 1 }]}>{h}</Text>
            </View>
          ))}
          <View style={{ height: spacing.lg }} />
        </>
      )}

      {product.details.length > 0 && (
        <>
          <Text style={eyebrow(colors.textSecondary)}>DETAILS</Text>
          <View style={{ height: spacing.sm }} />
          {product.details.map((d, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: 4 }}>
              <View style={{ width: 120 }}>
                <Text style={eyebrow(colors.textTertiary)}>{d.label.toUpperCase()}</Text>
              </View>
              <Text style={[text.bodyMedium, { flex: 1 }]}>{d.value}</Text>
            </View>
          ))}
        </>
      )}

      {presentingThis && (
        <>
          <View style={{ height: spacing.lg }} />
          <SyncControls product={product} />
        </>
      )}
    </ScrollView>
  );
}

function SyncControls({ product }: { product: Product }) {
  const { colors } = useTheme();
  const { presentation } = useDeps();
  useListenable(presentation);
  const ai = presentation.presentation?.showAIHighlights ?? false;

  return (
    <View style={{ padding: spacing.md, backgroundColor: colors.background, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
      <Text style={eyebrow(colors.accent)}>PRESENTATION CONTROLS</Text>
      <View style={{ height: spacing.sm }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Pill icon="sparkle" label={ai ? 'Hide notes' : 'Show notes'} onPress={() => presentation.toggleAIHighlights()} />
        <Pill icon="gallery" label="Gallery" onPress={() => presentation.showGallery()} />
        {product.defaultVariant.video != null && (
          <Pill icon="play" label="Play video" onPress={() => presentation.playVideo()} />
        )}
        <Pill icon="close" label="Reset view" onPress={() => presentation.resetView()} />
      </View>
    </View>
  );
}

function Pill({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  const { colors, text } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}
    >
      <Icon name={icon} size={16} color={colors.textPrimary} />
      <View style={{ width: 6 }} />
      <Text style={text.labelMedium}>{label}</Text>
    </Pressable>
  );
}

function TalkingPointCard({ text: body }: { text: string }) {
  const { colors, text } = useTheme();
  return (
    <View
      style={{
        padding: spacing.md,
        backgroundColor: withAlpha(colors.accent, 0.08),
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: withAlpha(colors.accent, 0.35),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon name="sparkle" size={16} color={colors.accent} />
        <View style={{ width: spacing.xs }} />
        <Text style={[eyebrow(colors.accent), { flex: 1 }]}>FOR YOU ONLY · SAY TO YOUR GUEST</Text>
        <Icon name="lock" size={14} color={colors.accent} />
      </View>
      <View style={{ height: spacing.xs }} />
      <Text style={[text.bodyLarge, { color: colors.textPrimary, lineHeight: 16 * 1.4 }]}>{body}</Text>
    </View>
  );
}

function FullscreenViewer({
  visible,
  variant,
  initialIndex,
  presenting,
  onImageChanged,
  onTransform,
  onClose,
}: {
  visible: boolean;
  variant: ProductVariant;
  initialIndex: number;
  presenting: boolean;
  onImageChanged: (i: number) => void;
  onTransform?: (scale: number, panX: number, panY: number) => void;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const scale = useRef(new Animated.Value(1)).current;
  const images = variant.images;

  const onPinch = (e: PinchGestureHandlerGestureEvent) => {
    const s = e.nativeEvent.scale;
    scale.setValue(s);
    if (onTransform) {
      const px = Math.max(-1, Math.min(1, (e.nativeEvent.focalX / width - 0.5) * 2));
      const py = Math.max(-1, Math.min(1, (e.nativeEvent.focalY / height - 0.5) * 2));
      onTransform(s, px, py);
    }
  };
  const onPinchEnd = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * width, y: 0 }}
          onMomentumScrollEnd={(e) => onImageChanged(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {images.map((m, i) => (
            <View key={i} style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
              <PinchGestureHandler onGestureEvent={onPinch} onEnded={onPinchEnd}>
                <Animated.View style={{ width, height, transform: [{ scale }] }}>
                  <NetworkPhoto url={m.url} resizeMode="contain" />
                </Animated.View>
              </PinchGestureHandler>
            </View>
          ))}
        </ScrollView>
        <SafeAreaView style={{ position: 'absolute', top: 0, right: 0 }}>
          <Pressable onPress={onClose} style={{ padding: spacing.md }}>
            <Icon name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </SafeAreaView>
        {presenting && (
          <SafeAreaView style={{ position: 'absolute', top: 0, left: 0 }}>
            <View style={{ margin: spacing.md, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.54)', borderRadius: radius.pill }}>
              <Text style={{ color: '#FFFFFF', fontSize: 12 }}>Pinch to zoom · showing live</Text>
            </View>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
}

function hexToColor(hex: string): string {
  const s = hex.replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`;
  if (/^[0-9a-fA-F]{3}$/.test(s)) return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  return '#141210';
}
