import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { displayHero, eyebrow, sansRegular } from '../../../theme/typography';
import { spacing } from '../../../theme/tokens';
import { useDisplaySelector } from '../DisplayContext';
import { FadeIn } from './Anim';

/// "You are now connected with {Salesperson}." Ported from `WelcomeScreen`.
export function WelcomeScreen() {
  const { colors, text } = useTheme();
  const name = useDisplaySelector((d) => d.salespersonName);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <FadeIn rise={16} style={{ maxWidth: 900, alignItems: 'center' }}>
        <Text style={eyebrow(colors.accent)}>WELCOME</Text>
        <View style={{ height: spacing.lg }} />
        <Text style={[displayHero(colors.textPrimary), { fontSize: 72, lineHeight: 72 * 1.02, textAlign: 'center' }]}>
          {`You are now connected\nwith ${name}`}
        </Text>
        <View style={{ height: spacing.xl }} />
        <Text
          style={[
            sansRegular(text.titleLarge),
            { color: colors.textSecondary, lineHeight: 20 * 1.4, textAlign: 'center' },
          ]}
        >
          Share your requirements, and our fashion experts will help you find the perfect piece.
        </Text>
      </FadeIn>
    </View>
  );
}
