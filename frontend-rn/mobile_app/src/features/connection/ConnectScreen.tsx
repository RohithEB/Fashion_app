import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
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

/// True when the web app is running inside the native kiosk WebView shell. There,
/// the page is served over http, so the browser camera is unavailable — the native
/// shell owns the camera and hands us the scanned value via `__ebaniPairFromQr`.
function inKioskShell(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    !!(window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView
  );
}

/// Pairing entry point: scan the QR shown on a display to connect over WiFi.
/// Camera-only — there is no manual URL entry.
export function ConnectScreen() {
  const { colors, text } = useTheme();
  const { connection, auth } = useDeps();
  useListenable(connection);

  const connecting = connection.status === ConnectionStatus.connecting;
  const [scannerVisible, setScannerVisible] = useState(false);

  const pairFromValue = useCallback(
    (value: string) => {
      const trimmed = (value || '').trim();
      if (trimmed.length === 0) return;
      void connection.connectFromQr(trimmed, { salesperson: auth.salesperson ?? undefined });
    },
    [connection, auth],
  );

  // Bridge for the native shell: when it scans a QR it calls this global with the
  // pairing URL. Registered only on the web build (the one that runs in the shell).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const w = window as unknown as { __ebaniPairFromQr?: (url: string) => void };
    w.__ebaniPairFromQr = (url: string) => pairFromValue(url);
    return () => {
      w.__ebaniPairFromQr = undefined;
    };
  }, [pairFromValue]);

  const startScan = () => {
    if (inKioskShell()) {
      // Ask the native shell to open its camera scanner.
      (window as unknown as { ReactNativeWebView: { postMessage: (s: string) => void } }).ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'open-scanner' }),
      );
    } else {
      // Native RN app (or a secure browser): use the in-app camera directly.
      setScannerVisible(true);
    }
  };

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
          onPress={connecting ? null : startScan}
        />
        <View style={{ height: spacing.xl }} />
      </View>

      <ScannerModal visible={scannerVisible} onClose={() => setScannerVisible(false)} onScanned={pairFromValue} />
    </SafeAreaView>
  );
}

/// In-app camera scanner. Used on the native RN app and in secure browsers; in the
/// kiosk WebView the native shell provides the camera instead (see startScan).
function ScannerModal({
  visible,
  onClose,
  onScanned,
}: {
  visible: boolean;
  onClose: () => void;
  onScanned: (value: string) => void;
}) {
  const { colors, text } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  useEffect(() => {
    if (!visible) return;
    handled.current = false;
    if (!permission?.granted) void requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleValue = (value: string) => {
    if (handled.current) return;
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    handled.current = true;
    onScanned(trimmed);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ height: spacing.md }} />
        <Text style={[text.titleMedium, { textAlign: 'center' }]}>Scan display QR</Text>
        <View style={{ height: spacing.md }} />

        <View style={{ flex: 1, paddingHorizontal: spacing.md }}>
          <View style={{ flex: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface }}>
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
                  Allow camera access to scan the display's QR code.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ padding: spacing.md }}>
          <Text style={[text.bodySmall, { color: colors.textSecondary, textAlign: 'center' }]}>
            Point the camera at the code on the screen
          </Text>
          <View style={{ height: spacing.sm }} />
          <Pressable onPress={onClose} style={{ alignItems: 'center', paddingVertical: spacing.xs }}>
            <Text style={[text.bodyMedium, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
