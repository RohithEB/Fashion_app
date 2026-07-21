import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../../../theme/ThemeProvider';
import { eyebrow, sansRegular } from '../../../theme/typography';
import { radius, spacing } from '../../../theme/tokens';
import { Icon } from '../../../theme/icons';
import { PresentationView, ProductPresentation } from '../../../models/presentationState';
import { Product, ProductMedia, ProductVariant } from '../../../models/product';
import { NetworkPhoto } from '../../../widgets/NetworkPhoto';
import { PriceTag } from '../../../widgets/PriceTag';
import { useDisplayController } from '../DisplayContext';

/// Renders the product currently presented by the salesperson, reproducing every
/// synchronized interaction from the ProductPresentation state (never mirroring
/// the phone screen). Ported from `PresentationScreen`.
export function PresentationScreen() {
  const { colors } = useTheme();
  const ctrl = useDisplayController();
  const p = ctrl.presentation;
  const product = ctrl.product;
  const [size, setSize] = useState({ w: 0, h: 0 });

  if (p == null || product == null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const variant = product.variantById(p.variantId);
  const images = variant.images;
  const imageUrl =
    images.length === 0 ? undefined : images[clamp(p.imageIndex, 0, images.length - 1)].url;
  const isVideo = p.view === PresentationView.video;
  const isGallery = p.view === PresentationView.gallery;

  const sheetHeight = size.h * (p.detailsExpanded ? 0.88 : 0.42);

  const stage = (
    <View style={StyleSheet.absoluteFill}>
      {isGallery ? (
        <GalleryStage images={images} />
      ) : isVideo ? (
        <VideoStage
          videoUrl={variant.video?.url}
          poster={variant.video?.thumbnailUrl ?? imageUrl}
          playing={p.videoPlaying}
          muted={p.videoMuted}
          positionMs={p.videoPositionMs}
        />
      ) : (
        <SyncedTransform key={`${p.variantId}-${p.imageIndex}`} scale={p.zoom} panX={p.panX} panY={p.panY}>
          <NetworkPhoto url={imageUrl} />
        </SyncedTransform>
      )}
      {!isVideo && !isGallery && images.length > 1 && size.h > 0 && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: sheetHeight + spacing.md, alignItems: 'center' }}>
          <ImageDots count={images.length} index={p.imageIndex} />
        </View>
      )}
    </View>
  );

  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  // Full-screen on the phone → full-bleed here (drop the info panel entirely).
  if (p.fullscreen) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayout}>
        {stage}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayout}>
      {stage}
      <AnimatedSheet height={sheetHeight}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            shadowColor: '#000',
            shadowOpacity: 0.45,
            shadowRadius: 32,
            shadowOffset: { width: 0, height: -8 },
            elevation: 24,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.xs }}>
            <View style={{ width: 68, height: 5, borderRadius: radius.pill, backgroundColor: colors.textTertiary }} />
          </View>
          <View style={{ flex: 1 }}>
            <InfoPanel
              product={product}
              variant={variant}
              size={p.size}
              scrollFraction={p.scrollFraction}
              detailsExpanded={p.detailsExpanded}
            />
          </View>
        </View>
      </AnimatedSheet>
    </View>
  );
}

function AnimatedSheet({ height, children }: { height: number; children: React.ReactNode }) {
  const h = useRef(new Animated.Value(height)).current;
  useEffect(() => {
    Animated.timing(h, { toValue: height, duration: 400, useNativeDriver: false }).start();
  }, [height, h]);
  return (
    <Animated.View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h }}>{children}</Animated.View>
  );
}

function InfoPanel({
  product,
  variant,
  size,
  scrollFraction,
  detailsExpanded,
}: {
  product: Product;
  variant: ProductVariant;
  size?: string;
  scrollFraction: number;
  detailsExpanded: boolean;
}) {
  const { colors, text } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const contentH = useRef(0);
  const viewH = useRef(0);
  const prevExpanded = useRef(detailsExpanded);

  useEffect(() => {
    const max = Math.max(0, contentH.current - viewH.current);
    const target = clamp(scrollFraction, 0, 1) * max;
    scrollRef.current?.scrollTo({ y: target, animated: true });
  }, [scrollFraction]);

  useEffect(() => {
    if (detailsExpanded && !prevExpanded.current) {
      // The associate just opened the details sheet → reveal the full spec.
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
    prevExpanded.current = detailsExpanded;
  }, [detailsExpanded]);

  return (
    <ScrollView
      ref={scrollRef}
      onContentSizeChange={(_, h) => (contentH.current = h)}
      onLayout={(e) => (viewH.current = e.nativeEvent.layout.height)}
      contentContainerStyle={{ paddingHorizontal: spacing.giant, paddingTop: spacing.md, paddingBottom: spacing.xl }}
    >
      <Text style={eyebrow(colors.accent)}>{product.brand}</Text>
      <View style={{ height: spacing.md }} />
      <Text style={text.displaySmall}>{product.name}</Text>
      <View style={{ height: spacing.sm }} />
      <PriceTag base={product.price} effective={variant.price ?? product.price} style={text.headlineSmall} />
      <View style={{ height: spacing.xl }} />
      <Text style={[sansRegular(text.titleLarge), { color: colors.textSecondary, lineHeight: 20 * 1.5 }]}>
        {product.description}
      </Text>
      <View style={{ height: spacing.xl }} />
      <Text style={eyebrow(colors.textSecondary)}>{`COLOR — ${variant.colorName}`}</Text>
      <View style={{ height: spacing.sm }} />
      <View style={{ flexDirection: 'row' }}>
        {product.variants.map((v) => (
          <View
            key={v.id}
            style={{
              width: 36,
              height: 36,
              marginRight: spacing.sm,
              borderRadius: 18,
              backgroundColor: hexToColor(v.colorHex),
              borderWidth: v.id === variant.id ? 2 : 1,
              borderColor: v.id === variant.id ? colors.accent : colors.border,
            }}
          />
        ))}
      </View>
      {size != null && size.length > 0 && (
        <>
          <View style={{ height: spacing.xl }} />
          <Text style={eyebrow(colors.textSecondary)}>{`SIZE — ${size}`}</Text>
        </>
      )}
      {product.aiHighlights.length > 0 && (
        <View style={{ marginTop: spacing.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="sparkle" size={16} color={colors.accent} />
            <View style={{ width: spacing.xs }} />
            <Text style={eyebrow(colors.accent)}>STYLE NOTES</Text>
          </View>
          <View style={{ height: spacing.sm }} />
          {product.aiHighlights.map((h, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: spacing.xs }}>
              <Text style={[text.bodyLarge, { color: colors.accent }]}>{'—  '}</Text>
              <Text style={[text.bodyLarge, { flex: 1 }]}>{h}</Text>
            </View>
          ))}
        </View>
      )}
      {product.details.length > 0 && (
        <View style={{ marginTop: spacing.xl }}>
          <Text style={eyebrow(colors.accent)}>DETAILS</Text>
          <View style={{ height: spacing.sm }} />
          {product.details.map((d, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: spacing.xs }}>
              <View style={{ width: 150 }}>
                <Text style={eyebrow(colors.textTertiary)}>{d.label.toUpperCase()}</Text>
              </View>
              <Text style={[text.bodyLarge, { flex: 1 }]}>{d.value}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/// Smooths discrete zoom/pan updates into continuous motion. Ported from
/// `_SyncedTransform` (interpolate toward each new target over ~120ms).
function SyncedTransform({
  scale,
  panX,
  panY,
  children,
}: {
  scale: number;
  panX: number;
  panY: number;
  children: React.ReactNode;
}) {
  const s = useRef(new Animated.Value(scale)).current;
  const tx = useRef(new Animated.Value(panX * 60)).current;
  const ty = useRef(new Animated.Value(panY * 60)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(s, { toValue: scale, duration: 120, useNativeDriver: true }),
      Animated.timing(tx, { toValue: panX * 60, duration: 120, useNativeDriver: true }),
      Animated.timing(ty, { toValue: panY * 60, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [scale, panX, panY, s, tx, ty]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }, { translateY: ty }, { scale: s }] }]}>
      {children}
    </Animated.View>
  );
}

/// Plays the presented product's video from the synchronized state. Falls back
/// to a postered play-button when no video is available. Ported from `_VideoStage`.
function VideoStage({
  videoUrl,
  poster,
  playing,
  muted,
  positionMs,
}: {
  videoUrl?: string;
  poster?: string;
  playing: boolean;
  muted: boolean;
  positionMs: number;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const hasUrl = videoUrl != null && videoUrl.length > 0;

  const player = useVideoPlayer(hasUrl ? videoUrl! : null, (pl) => {
    if (!hasUrl) return;
    pl.loop = true;
    pl.muted = muted;
  });

  useEffect(() => {
    if (!hasUrl) return;
    const sub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error' || error != null) setFailed(true);
      if (status === 'readyToPlay') {
        setReady(true);
        if (positionMs > 0) player.currentTime = positionMs / 1000;
        if (playing) player.play();
      }
    });
    return () => sub.remove();
  }, [player, hasUrl]);

  useEffect(() => {
    if (!ready) return;
    if (playing) player.play();
    else player.pause();
  }, [playing, ready, player]);

  useEffect(() => {
    if (ready) player.muted = muted;
  }, [muted, ready, player]);

  useEffect(() => {
    if (!ready) return;
    const current = player.currentTime * 1000;
    if (Math.abs(positionMs - current) > 600) player.currentTime = positionMs / 1000;
  }, [positionMs, ready, player]);

  if (hasUrl && ready && !failed) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }]}>
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
      </View>
    );
  }
  // Fallback: poster + play affordance.
  return (
    <View style={StyleSheet.absoluteFill}>
      <NetworkPhoto url={poster} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.33)' }]} />
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: 'rgba(255,255,255,0.16)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.34)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={playing ? 'pause' : 'play'} size={48} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );
}

function GalleryStage({ images }: { images: ProductMedia[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, padding: spacing.xl, flexDirection: 'row', flexWrap: 'wrap' }}>
      {images.map((m, i) => (
        <View key={i} style={{ width: '50%', aspectRatio: 0.8, padding: spacing.md / 2 }}>
          <View style={{ flex: 1, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
            <NetworkPhoto url={m.url} borderRadius={radius.lg} />
          </View>
        </View>
      ))}
    </View>
  );
}

function ImageDots({ count, index }: { count: number; index: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            marginRight: 6,
            width: i === index ? 28 : 8,
            height: 8,
            borderRadius: radius.pill,
            backgroundColor: i === index ? '#FFFFFF' : 'rgba(255,255,255,0.34)',
          }}
        />
      ))}
    </View>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function hexToColor(hex: string): string {
  const s = hex.replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`;
  if (/^[0-9a-fA-F]{3}$/.test(s)) return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  return '#141210';
}
