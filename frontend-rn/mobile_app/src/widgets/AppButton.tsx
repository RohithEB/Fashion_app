import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppIconName, Icon } from '../theme/icons';
import { radius, sizes, spacing } from '../theme/tokens';

export type AppButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type AppButtonSize = 'small' | 'medium' | 'large';

/// The canonical button: loading state, optional leading icon, full-width
/// layout, and a subtle press-scale micro-interaction. Ported from `AppButton`.
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  isLoading = false,
  expand = false,
}: {
  label: string;
  onPress?: (() => void) | null;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  icon?: AppIconName;
  isLoading?: boolean;
  expand?: boolean;
}) {
  const { colors, text } = useTheme();
  const enabled = onPress != null && !isLoading;
  const scale = useRef(new Animated.Value(1)).current;
  const [, setPressed] = useState(false);

  const height = size === 'small' ? sizes.buttonSm : size === 'large' ? sizes.buttonLg : sizes.buttonMd;

  const [bg, fg, border] =
    variant === 'primary'
      ? [colors.primary, colors.onPrimary, undefined]
      : variant === 'secondary'
        ? [colors.surface, colors.textPrimary, colors.border]
        : variant === 'outline'
          ? ['transparent', colors.textPrimary, colors.border]
          : ['transparent', colors.textPrimary, undefined];

  const animate = (to: number) => {
    setPressed(to < 1);
    Animated.timing(scale, { toValue: to, duration: 90, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], opacity: enabled ? 1 : sizes.opacityDisabled }}>
      <Pressable
        accessibilityRole="button"
        disabled={!enabled}
        onPressIn={() => enabled && animate(0.97)}
        onPressOut={() => enabled && animate(1)}
        onPress={enabled ? () => onPress?.() : undefined}
      >
        <View
          style={{
            height,
            width: expand ? '100%' : undefined,
            paddingHorizontal: spacing.xl,
            borderRadius: radius.md,
            backgroundColor: bg,
            borderWidth: border ? 1 : 0,
            borderColor: border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={fg} />
          ) : (
            <>
              {icon != null && (
                <View style={{ marginRight: spacing.xs }}>
                  <Icon name={icon} size={sizes.iconSm} color={fg} />
                </View>
              )}
              <Text numberOfLines={1} style={[text.labelLarge, { color: fg }]}>
                {label}
              </Text>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
