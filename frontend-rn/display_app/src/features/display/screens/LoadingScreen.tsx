import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { eyebrow } from '../../../theme/typography';
import { spacing } from '../../../theme/tokens';

/// Ported from `LoadingScreen` — an indeterminate linear progress bar.
export function LoadingScreen() {
  const { colors, text } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={eyebrow(colors.accent)}>PREPARING YOUR SHOWROOM</Text>
      <View style={{ height: spacing.md }} />
      <Text style={text.headlineMedium}>One moment</Text>
      <View style={{ height: spacing.xl }} />
      <IndeterminateBar width={160} color={colors.accent} track={colors.disabled} />
    </View>
  );
}

function IndeterminateBar({ width, color, track }: { width: number; color: string; track: string }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(x, { toValue: 1, duration: 1100, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [x]);
  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.6, width] });
  return (
    <View style={{ width, height: 2, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={{ width: width * 0.6, height: 2, backgroundColor: color, transform: [{ translateX }] }} />
    </View>
  );
}
