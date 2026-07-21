import React, { useState } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgUri } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../theme/icons';

type ResizeMode = 'cover' | 'contain';

/// A network image with a tasteful skeleton placeholder and graceful error
/// fallback. Renders SVG sources and the backend `/media/ph` placeholder
/// on-device (no network). Ported from the Flutter `NetworkPhoto`.
export function NetworkPhoto({
  url,
  resizeMode = 'cover',
  borderRadius = 0,
  style,
}: {
  url?: string | null;
  resizeMode?: ResizeMode;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);

  const u = url ?? '';
  const isSvg = u.toLowerCase().endsWith('.svg') || u.includes('image/svg');
  const ph = placeholderParams(u);

  let child: React.ReactNode;
  if (url == null || url.length === 0) {
    child = <Skeleton broken color={colors.skeleton} tint={colors.textTertiary} />;
  } else if (ph != null) {
    child = (
      <MediaPlaceholder
        bg={hexColor(ph.bg, '#1C1C1C')}
        fg={hexColor(ph.fg, '#FFFFFF')}
        text={ph.text ?? 'Fashion'}
      />
    );
  } else if (isSvg) {
    child = <SvgUri uri={url} width="100%" height="100%" />;
  } else {
    child = (
      <>
        {!loaded && !broken && <Skeleton color={colors.skeleton} tint={colors.textTertiary} />}
        {broken ? (
          <Skeleton broken color={colors.skeleton} tint={colors.textTertiary} />
        ) : (
          <Image
            source={{ uri: url }}
            resizeMode={resizeMode}
            style={StyleSheet.absoluteFill}
            onLoad={() => setLoaded(true)}
            onError={() => setBroken(true)}
          />
        )}
      </>
    );
  }

  return <View style={[styles.root, { borderRadius }, style]}>{child}</View>;
}

function Skeleton({ color, tint, broken = false }: { color: string; tint: string; broken?: boolean }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: color, alignItems: 'center', justifyContent: 'center' }]}>
      {broken ? <Icon name="gallery" color={tint} size={24} /> : null}
    </View>
  );
}

/// On-device render of the backend's `/media/ph` placeholder: an inset hairline
/// frame and a two-line centred serif label. Ported from `_MediaPlaceholder`.
function MediaPlaceholder({ bg, fg, text }: { bg: string; fg: string; text: string }) {
  const words = text.split(' ');
  const mid = Math.ceil(words.length / 2);
  const label = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
    .filter((s) => s.length > 0)
    .join('\n');

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={() => {}}
    >
      <LinearGradient colors={[bg, withA(bg, 0.75)]} style={StyleSheet.absoluteFill} />
      <MeasuredFrame fg={fg} label={label} />
    </View>
  );
}

function MeasuredFrame({ fg, label }: { fg: string; label: string }) {
  const [w, setW] = useState(300);
  const fontSize = Math.min(34, Math.max(12, w / 12));
  const inset = Math.min(24, Math.max(6, w * 0.035));
  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setW(e.nativeEvent.layout.width || 300)}
    >
      <View style={{ flex: 1, padding: inset }}>
        <View
          style={{
            flex: 1,
            borderWidth: 2,
            borderColor: withA(fg, 0.35),
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: inset,
          }}
        >
          <Text style={{ color: fg, fontFamily: 'serif', fontSize, lineHeight: fontSize * 1.25, textAlign: 'center' }}>
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', backgroundColor: 'transparent' },
});

function placeholderParams(u: string): Record<string, string> | null {
  if (!u.includes('/media/ph')) return null;
  try {
    const qIndex = u.indexOf('?');
    if (qIndex < 0) return {};
    const params: Record<string, string> = {};
    new URLSearchParams(u.substring(qIndex + 1)).forEach((v, k) => (params[k] = v));
    return params;
  } catch {
    return null;
  }
}

function hexColor(h: string | undefined, fallback: string): string {
  const s = (h ?? '').replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`;
  if (/^[0-9a-fA-F]{3}$/.test(s)) return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  return fallback;
}

function withA(hex: string, alpha: number): string {
  const s = hex.replace('#', '');
  const r = parseInt(s.substring(0, 2), 16);
  const g = parseInt(s.substring(2, 4), 16);
  const b = parseInt(s.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
