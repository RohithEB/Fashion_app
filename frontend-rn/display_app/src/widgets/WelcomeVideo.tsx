import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../theme/ThemeProvider';

/// Plays a looping, muted, auto-playing video scaled to cover its box. Falls
/// back to a calm skeleton while it loads or if it can't play. Ported from the
/// Flutter `WelcomeVideo` (video_player → expo-video).
export function WelcomeVideo({ url }: { url: string }) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);

  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
    try {
      p.play();
    } catch {
      setFailed(true);
    }
  });

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error' || error != null) setFailed(true);
    });
    return () => sub.remove();
  }, [player]);

  if (failed) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />;
  }
  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
      pointerEvents="none"
    />
  );
}
