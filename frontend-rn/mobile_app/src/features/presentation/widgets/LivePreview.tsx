import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { darkColors } from '../../../theme/colors';
import { makeTextTheme, eyebrow } from '../../../theme/typography';
import { useTheme } from '../../../theme/ThemeProvider';
import { radius, spacing } from '../../../theme/tokens';
import { Icon } from '../../../theme/icons';
import { Product } from '../../../models/product';
import { NetworkPhoto } from '../../../widgets/NetworkPhoto';
import { useListenable } from '../../../core/useListenable';
import { useDeps } from '../../../app/providers';

const darkText = makeTextTheme(darkColors.textPrimary);

/// The rendering surface shared with the display app: applies zoom/pan + overlays
/// from ProductPresentation. Always dark (mirrors the TV). Ported from `DisplayMirror`.
export function DisplayMirror() {
  const { presentation } = useDeps();
  useListenable(presentation);
  const p = presentation.presentation;
  const product = presentation.product;

  if (p == null || product == null) {
    return (
      <View style={{ flex: 1, backgroundColor: darkColors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={makeTextTheme(darkColors.textPrimary).headlineMedium}>Welcome</Text>
      </View>
    );
  }

  const variant = product.variantById(p.variantId);
  const image =
    variant.images.length === 0
      ? undefined
      : variant.images[Math.max(0, Math.min(p.imageIndex, variant.images.length - 1))].url;

  return (
    <View style={{ flex: 1, backgroundColor: darkColors.background }}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX: p.panX * 40 }, { translateY: p.panY * 40 }, { scale: p.zoom }] },
        ]}
      >
        <NetworkPhoto url={image} />
      </View>
      {p.showAIHighlights && (
        <View style={{ position: 'absolute', left: spacing.md, bottom: spacing.md, maxWidth: 220 }}>
          <HighlightsOverlay product={product} />
        </View>
      )}
    </View>
  );
}

function HighlightsOverlay({ product }: { product: Product }) {
  return (
    <View style={{ padding: spacing.sm, backgroundColor: 'rgba(23,22,20,0.82)', borderRadius: radius.md }}>
      <Text style={eyebrow(darkColors.accent)}>STYLE NOTES</Text>
      <View style={{ height: 4 }} />
      {product.aiHighlights.slice(0, 3).map((h, i) => (
        <Text key={i} style={[makeTextTheme(darkColors.textSecondary).bodySmall, { marginTop: 2 }]}>
          {`— ${h}`}
        </Text>
      ))}
    </View>
  );
}

/// A live-mirror bottom sheet of the customer display. Ported from `LivePreviewSheet`.
export function LivePreviewModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, text } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={onClose} />
      <View
        style={{
          backgroundColor: colors.surfaceElevated,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          padding: spacing.md,
        }}
      >
        <View style={{ alignItems: 'center', paddingBottom: spacing.sm }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="connected" size={16} color={colors.accent} />
          <View style={{ width: spacing.xs }} />
          <Text style={eyebrow(colors.textSecondary)}>CUSTOMER DISPLAY</Text>
        </View>
        <View style={{ height: spacing.sm }} />
        <View style={{ aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: 'hidden' }}>
          <DisplayMirror />
        </View>
        <View style={{ height: spacing.sm }} />
        <Text style={[text.bodySmall, { color: colors.textSecondary }]}>
          This is a live mirror of the showroom screen.
        </Text>
        <View style={{ height: spacing.sm }} />
      </View>
    </Modal>
  );
}
