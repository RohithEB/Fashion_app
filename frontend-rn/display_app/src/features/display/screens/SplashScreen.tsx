import React from 'react';
import { Image, Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { eyebrow } from '../../../theme/typography';
import { spacing } from '../../../theme/tokens';
import { FadeIn } from './Anim';

const INK = '#182838';
const GILT = '#C8A070';

/// Boot splash: the Maison Ébani mark on a clean white field. Deliberately light.
/// Ported from `SplashScreen`.
export function SplashScreen() {
  const { text } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
      <FadeIn style={{ alignItems: 'center' }}>
        <Image
          source={require('../../../../assets/icon/app_icon.png')}
          style={{ width: 220, height: 220 }}
          resizeMode="contain"
        />
        <View style={{ height: spacing.xl }} />
        <Text style={eyebrow(GILT)}>LUXURY FASHION</Text>
        <View style={{ height: spacing.sm }} />
        <Text style={[text.displayMedium, { color: INK }]}>Ebani</Text>
      </FadeIn>
    </View>
  );
}
