import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { eyebrow } from '../../../theme/typography';
import { radius, spacing } from '../../../theme/tokens';
import { Icon } from '../../../theme/icons';
import { NetworkPhoto } from '../../../widgets/NetworkPhoto';
import { useListenable } from '../../../core/useListenable';
import { useDeps } from '../../../app/providers';
import { LivePreviewModal } from './LivePreview';

/// Persistent bar shown whenever a product is live on the display. Ported from
/// `NowShowingBar`.
export function NowShowingBar() {
  const { colors, text } = useTheme();
  const { presentation } = useDeps();
  useListenable(presentation);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!presentation.isPresenting || presentation.product == null) return null;

  const variant = presentation.product.variantById(presentation.presentation?.variantId);

  return (
    <View style={{ padding: spacing.sm }}>
      <Pressable
        onPress={() => setPreviewOpen(true)}
        style={{ backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.xs }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 44, height: 44, borderRadius: radius.sm, overflow: 'hidden' }}>
            <NetworkPhoto url={variant.images[0]?.url} />
          </View>
          <View style={{ width: spacing.sm }} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="connected" size={14} color={colors.accent} />
              <View style={{ width: 4 }} />
              <Text style={eyebrow(colors.accent)}>ON SCREEN</Text>
            </View>
            <View style={{ height: 2 }} />
            <Text numberOfLines={1} style={[text.titleSmall, { color: colors.onPrimary }]}>
              {presentation.product.name}
            </Text>
          </View>
          <Pressable onPress={() => presentation.hideProduct()} style={{ padding: spacing.xs }} hitSlop={8}>
            <Icon name="disconnect" size={24} color={colors.onPrimary} />
          </Pressable>
        </View>
      </Pressable>
      <LivePreviewModal visible={previewOpen} onClose={() => setPreviewOpen(false)} />
    </View>
  );
}
