import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { eyebrow } from '../../../theme/typography';
import { spacing } from '../../../theme/tokens';

/// Ported from `ConnectingScreen`.
export function ConnectingScreen() {
  const { colors, text } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={colors.accent} />
      <View style={{ height: spacing.xl }} />
      <Text style={eyebrow(colors.textSecondary)}>CONNECTING</Text>
      <View style={{ height: spacing.xs }} />
      <Text style={text.headlineSmall}>Pairing your device</Text>
    </View>
  );
}
