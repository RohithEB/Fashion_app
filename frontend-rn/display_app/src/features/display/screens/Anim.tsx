import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

/// Fade (and optionally rise) in on mount — the RN equivalent of the Flutter
/// TweenAnimationBuilder(0→1) used across the display screens.
export function FadeIn({
  duration = 600,
  rise = 0,
  style,
  children,
}: {
  duration?: number;
  rise?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration, useNativeDriver: true }).start();
  }, [v, duration]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [rise, 0] });
  return (
    <Animated.View style={[style, { opacity: v, transform: rise ? [{ translateY }] : [] }]}>
      {children}
    </Animated.View>
  );
}
