import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { AppConfig } from '../../../config/appConfig';
import { useTheme } from '../../../theme/ThemeProvider';
import { displayHero, eyebrow, sansRegular } from '../../../theme/typography';
import { radius, spacing } from '../../../theme/tokens';
import { WelcomeVideo } from '../../../widgets/WelcomeVideo';
import { useDisplayController } from '../DisplayContext';

/// The idle pairing screen. The backend model video is the primary content; the
/// welcome text + pairing QR sit alongside it. Tapping starts a hands-free demo
/// session (POC). Ported from `WaitingScreen`.
export function WaitingScreen() {
  const { colors } = useTheme();
  const ctrl = useDisplayController();
  const { width, height } = useWindowDimensions();
  const portrait = height > width;
  const pad = portrait ? spacing.lg : spacing.giant;
  const videoUrl = AppConfig.media('/media/samples/model-360.mp4');

  const video = (
    <View style={{ flex: 1, borderRadius: radius.xl, overflow: 'hidden' }}>
      <WelcomeVideo url={videoUrl} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.15)']}
        locations={[0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ position: 'absolute', left: spacing.lg, top: spacing.lg }}>
        <Text style={eyebrow('#FFFFFF')}>EBANI</Text>
      </View>
    </View>
  );

  const panel = <PairPanel url={ctrl.pairingUrl} portrait={portrait} />;

  return (
    <Pressable onPress={ctrl.startDemoSession} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, padding: pad }}>
        {portrait ? (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 7 }}>{video}</View>
            <View style={{ height: spacing.xl }} />
            <View style={{ flex: 3 }}>{panel}</View>
          </View>
        ) : (
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View style={{ flex: 6 }}>{video}</View>
            <View style={{ width: spacing.giant }} />
            <View style={{ flex: 4 }}>{panel}</View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function PairPanel({ url, portrait }: { url: string; portrait: boolean }) {
  const { colors, text } = useTheme();

  const textBlock = (
    <View style={{ alignItems: portrait ? 'flex-start' : 'center', justifyContent: 'center' }}>
      <Text style={eyebrow(colors.accent)}>WELCOME</Text>
      <View style={{ height: spacing.sm }} />
      <Text
        style={[
          displayHero(colors.textPrimary),
          { fontSize: portrait ? 40 : 52, lineHeight: (portrait ? 40 : 52) * 1.02, textAlign: portrait ? 'left' : 'center' },
        ]}
      >
        {'A private\nshowroom, for you.'}
      </Text>
      <View style={{ height: spacing.sm }} />
      <Text
        style={[
          sansRegular(text.titleLarge),
          { color: colors.textSecondary, lineHeight: 20 * 1.35, textAlign: portrait ? 'left' : 'center' },
        ]}
      >
        A style advisor will pair their device to begin.
      </Text>
    </View>
  );

  const qr = <QrCard url={url} size={portrait ? 150 : 190} />;

  if (portrait) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>{textBlock}</View>
        <View style={{ width: spacing.xl }} />
        {qr}
      </View>
    );
  }
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {textBlock}
      <View style={{ height: spacing.xl }} />
      {qr}
    </View>
  );
}

function QrCard({ url, size }: { url: string; size: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
      }}
    >
      <View style={{ padding: spacing.sm, backgroundColor: '#FFFFFF', borderRadius: radius.lg }}>
        <QRCode value={url || ' '} size={size} color="#141210" backgroundColor="#FFFFFF" />
      </View>
      <View style={{ height: spacing.sm }} />
      <Text style={eyebrow(colors.textSecondary)}>SCAN TO CONNECT</Text>
    </View>
  );
}
