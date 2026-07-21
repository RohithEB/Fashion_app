import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { displayHero, eyebrow } from '../../../theme/typography';
import { spacing } from '../../../theme/tokens';
import { useDisplaySelector } from '../DisplayContext';
import { FadeIn } from './Anim';

/// Ported from `ThankYouScreen`.
export function ThankYouScreen() {
  const { colors, text } = useTheme();
  const countdown = useDisplaySelector((d) => d.thankYouCountdown);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <FadeIn style={{ alignItems: 'center' }}>
        <Text style={eyebrow(colors.accent)}>WITH GRATITUDE</Text>
        <View style={{ height: spacing.lg }} />
        <Text style={displayHero(colors.textPrimary)}>Thank you</Text>
        <View style={{ height: spacing.md }} />
        <Text style={[text.titleMedium, { color: colors.textSecondary, fontWeight: '400' }]}>
          We look forward to seeing you again.
        </Text>
      </FadeIn>
      <View style={{ height: spacing.giant }} />
      <Text style={[text.bodySmall, { color: colors.textTertiary }]}>{`This session ends in ${countdown}`}</Text>
    </View>
  );
}
