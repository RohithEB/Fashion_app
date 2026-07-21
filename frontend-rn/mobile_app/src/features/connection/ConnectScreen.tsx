import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../../theme/ThemeProvider';
import { eyebrow } from '../../theme/typography';
import { radius, spacing } from '../../theme/tokens';
import { Icon } from '../../theme/icons';
import { AppButton } from '../../widgets/AppButton';
import { useListenable } from '../../core/useListenable';
import { useDeps } from '../../app/providers';
import { ConnectionStatus } from './connectionController';

/// Pairing entry point: scan the QR shown on a display to connect over WiFi.
/// Ported from `ConnectScreen` (connect_screen.dart).
export function ConnectScreen() {
  const { colors, text } = useTheme();
  const { connection } = useDeps();
  useListenable(connection);

  const connecting = connection.status === ConnectionStatus.connecting;
  const [scannerVisible, setScannerVisible] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: spacing.xl }}>
        <View style={{ height: spacing.xl }} />
        <Text style={eyebrow(colors.accent)}>PAIR A DISPLAY</Text>
        <View style={{ height: spacing.sm }} />
        <Text style={text.headlineMedium}>Connect to a screen</Text>
        <View style={{ height: spacing.sm }} />
        <Text style={[text.bodyLarge, { color: colors.textSecondary }]}>
          Scan the QR code shown on the showroom display to begin a synchronized session with your client.
        </Text>

        <View style={{ flex: 1 }} />

        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 168,
              height: 168,
              borderRadius: radius.xl,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="qrScan" size={72} color={colors.accent} />
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {connection.status === ConnectionStatus.error && connection.error != null && (
          <Text style={[text.bodySmall, { color: colors.error, marginBottom: spacing.sm }]}>
            {connection.error}
          </Text>
        )}

        <AppButton
          label={connecting ? 'Connecting…' : 'Scan display QR'}
          icon="qrScan"
          expand
          isLoading={connecting}
          onPress={connecting ? null : () => setScannerVisible(true)}
        />
        <View style={{ height: spacing.xl }} />
      </View>

      <ScannerModal visible={scannerVisible} onClose={() => setScannerVisible(false)} />
    </SafeAreaView>
  );
}

/// Full-screen scanner: a live camera QR reader with a manual paste-URL
/// fallback for the web build (no camera access there).
function ScannerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, text } = useTheme();
  const { connection, auth } = useDeps();
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);
  const [manualValue, setManualValue] = useState('');

  useEffect(() => {
    if (!visible) return;
    handled.current = false;
    setManualValue('');
    if (!permission?.granted) void requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleValue = (value: string) => {
    if (handled.current) return;
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    handled.current = true;
    void connection.connectFromQr(trimmed, { salesperson: auth.salesperson ?? undefined });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ height: spacing.md }} />
        <Text style={[text.titleMedium, { textAlign: 'center' }]}>Scan display QR</Text>
        <View style={{ height: spacing.md }} />

        <View style={{ flex: 1, paddingHorizontal: spacing.md }}>
          <View
            style={{
              flex: 1,
              borderRadius: radius.lg,
              overflow: 'hidden',
              backgroundColor: colors.surface,
            }}
          >
            {permission?.granted ? (
              <CameraView
                style={{ flex: 1 }}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={({ data }) => handleValue(data)}
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md }}>
                <Icon name="qrScan" size={48} color={colors.textTertiary} />
                <View style={{ height: spacing.sm }} />
                <Text style={[text.bodySmall, { color: colors.textSecondary, textAlign: 'center' }]}>
                  Camera unavailable. Paste the pairing URL below instead.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ padding: spacing.md }}>
          <Text style={[text.bodySmall, { color: colors.textSecondary }]}>
            Point the camera at the code on the screen
          </Text>
          <View style={{ height: spacing.sm }} />
          <TextInput
            value={manualValue}
            onChangeText={setManualValue}
            placeholder="Or paste the pairing URL"
            placeholderTextColor={colors.textTertiary}
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
            }}
          />
          <View style={{ height: spacing.sm }} />
          <AppButton
            label="Connect"
            expand
            onPress={manualValue.trim().length > 0 ? () => handleValue(manualValue) : null}
          />
          <View style={{ height: spacing.sm }} />
          <Pressable onPress={onClose} style={{ alignItems: 'center', paddingVertical: spacing.xs }}>
            <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
