import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { eyebrow } from '../../theme/typography';
import { radius, spacing } from '../../theme/tokens';
import { Icon } from '../../theme/icons';
import { AppButton } from '../../widgets/AppButton';
import { useListenable } from '../../core/useListenable';
import { useDeps } from '../../app/providers';

/// Global overlay that surfaces the display's idle-timeout warning with a live
/// countdown and a one-tap "keep session" action. Ported from `IdleWarningOverlay`.
export function IdleWarningOverlay({ children }: { children: React.ReactNode }) {
  const { colors, text } = useTheme();
  const { connection } = useDeps();
  useListenable(connection);
  const warning = connection.idleWarning;
  const seconds = connection.idleSecondsLeft;

  return (
    <View style={{ flex: 1 }}>
      {children}
      {warning && (
        <SafeAreaView style={{ position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md }}>
          <View style={{ backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="warning" size={24} color={colors.accent} />
            <View style={{ width: spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={eyebrow(colors.accent)}>SESSION IDLE</Text>
              <View style={{ height: 2 }} />
              <Text style={[text.titleSmall, { color: colors.onPrimary }]}>{`Ending in ${seconds}s`}</Text>
            </View>
            <AppButton label="I'm still here" size="small" onPress={() => connection.keepAlive()} />
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}
