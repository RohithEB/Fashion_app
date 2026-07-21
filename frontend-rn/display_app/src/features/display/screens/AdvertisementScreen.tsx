import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../theme/ThemeProvider';
import { displayHero, eyebrow } from '../../../theme/typography';
import { spacing } from '../../../theme/tokens';
import { MockCatalog } from '../../../data/mockCatalog';
import { NetworkPhoto } from '../../../widgets/NetworkPhoto';

/// Idle advertisement loop: full-bleed campaign imagery cross-fading with an
/// editorial caption. Ported from `AdvertisementScreen`.
export function AdvertisementScreen() {
  const { colors, text } = useTheme();
  const items = MockCatalog.products;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);

  const item = items[index];

  return (
    <View style={StyleSheet.absoluteFill}>
      <NetworkPhoto key={item.id} url={item.heroImage} style={StyleSheet.absoluteFill as any} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.87)']}
        locations={[0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: spacing.giant }}>
        <Text style={eyebrow(colors.accent)}>THE AUTUMN COLLECTION</Text>
        <View style={{ height: spacing.sm }} />
        <Text style={[displayHero('#FFFFFF'), { fontSize: 64, lineHeight: 64 * 1.02 }]}>{item.name}</Text>
        <View style={{ height: spacing.xs }} />
        <Text style={[text.titleMedium, { color: 'rgba(255,255,255,0.7)' }]}>{item.brand}</Text>
      </View>
    </View>
  );
}
