import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { AppIconName, Icon } from '../theme/icons';
import { sizes, spacing } from '../theme/tokens';
import { AppButton } from './AppButton';

/// Centralized empty / error / loading presentations. Ported from `state_views`.

export function EmptyStateView({
  title,
  message,
  icon = 'empty',
  action,
}: {
  title: string;
  message?: string;
  icon?: AppIconName;
  action?: React.ReactNode;
}) {
  const { colors, text } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <Icon name={icon} size={sizes.iconXl} color={colors.textTertiary} />
      <View style={{ height: spacing.md }} />
      <Text style={[text.titleMedium, { textAlign: 'center' }]}>{title}</Text>
      {message != null && (
        <>
          <View style={{ height: spacing.xs }} />
          <Text style={[text.bodyMedium, { color: colors.textSecondary, textAlign: 'center' }]}>{message}</Text>
        </>
      )}
      {action != null && (
        <>
          <View style={{ height: spacing.lg }} />
          {action}
        </>
      )}
    </View>
  );
}

export function ErrorStateView({
  message,
  title = 'Something went wrong',
  onRetry,
}: {
  message: string;
  title?: string;
  onRetry?: () => void;
}) {
  const { colors, text } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <Icon name="error" size={sizes.iconXl} color={colors.error} />
      <View style={{ height: spacing.md }} />
      <Text style={[text.titleMedium, { textAlign: 'center' }]}>{title}</Text>
      <View style={{ height: spacing.xs }} />
      <Text style={[text.bodyMedium, { color: colors.textSecondary, textAlign: 'center' }]}>{message}</Text>
      {onRetry != null && (
        <>
          <View style={{ height: spacing.lg }} />
          <AppButton label="Try again" variant="outline" onPress={onRetry} />
        </>
      )}
    </View>
  );
}

export function LoadingView({ label }: { label?: string }) {
  const { colors, text } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} />
      {label != null && (
        <>
          <View style={{ height: spacing.md }} />
          <Text style={[text.bodySmall, { color: colors.textSecondary }]}>{label}</Text>
        </>
      )}
    </View>
  );
}
