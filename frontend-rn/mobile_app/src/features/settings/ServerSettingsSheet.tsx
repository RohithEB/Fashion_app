import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { AppConfig } from '../../config/appConfig';
import { useTheme } from '../../theme/ThemeProvider';
import { eyebrow } from '../../theme/typography';
import { radius, spacing } from '../../theme/tokens';
import { AppButton } from '../../widgets/AppButton';
import { useRestart } from '../../app/restart';

/// In-app server configuration: backend host/port at runtime (persisted). Saving
/// restarts the app root to re-resolve repositories. Ported from `ServerSettingsSheet`.
export function ServerSettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, text } = useTheme();
  const restart = useRestart();
  const [backend, setBackend] = useState(AppConfig.backendMode);
  const [host, setHost] = useState(AppConfig.backendHost);
  const [port, setPort] = useState(String(AppConfig.backendPort));

  const save = async () => {
    const p = parseInt(port.trim(), 10);
    await AppConfig.save({ backend, host, port: Number.isNaN(p) ? null : p });
    onClose();
    restart();
  };

  const reset = async () => {
    await AppConfig.clear();
    onClose();
    restart();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={onClose} />
      <View
        style={{
          backgroundColor: colors.surfaceElevated,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl,
        }}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text style={eyebrow(colors.accent)}>SERVER</Text>
          <View style={{ height: spacing.xs }} />
          <Text style={text.titleLarge}>Connection settings</Text>
          <View style={{ height: spacing.md }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={text.titleMedium}>Use backend server</Text>
              <Text style={[text.bodySmall, { color: colors.textSecondary }]}>
                {backend ? 'Live catalog, accounts, orders & realtime.' : 'Offline demo (in-app mock data).'}
              </Text>
            </View>
            <Switch value={backend} onValueChange={setBackend} trackColor={{ true: colors.accent }} />
          </View>
          <View style={{ height: spacing.sm }} />
          <Field label="Host (server IP)" value={host} onChange={setHost} editable={backend} placeholder="e.g. 192.168.1.5" colors={colors} />
          <View style={{ height: spacing.md }} />
          <Field label="Port" value={port} onChange={setPort} editable={backend} placeholder="3000" keyboardType="number-pad" colors={colors} />
          <View style={{ height: spacing.sm }} />
          <Text style={[text.bodySmall, { color: colors.textSecondary }]}>
            On a real device use the server PC&apos;s LAN IP — not localhost. Saving restarts the app to apply.
          </Text>
          <View style={{ height: spacing.lg }} />
          <AppButton label="Save & apply" expand onPress={save} />
          <View style={{ height: spacing.sm }} />
          <Pressable onPress={reset} style={{ alignItems: 'center', paddingVertical: spacing.xs }}>
            <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>Reset to defaults</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  editable,
  placeholder,
  keyboardType,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View>
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          height: 52,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          color: colors.textPrimary,
          backgroundColor: colors.surface,
          opacity: editable ? 1 : 0.5,
        }}
      />
    </View>
  );
}
