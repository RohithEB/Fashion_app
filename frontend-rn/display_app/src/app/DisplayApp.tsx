import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import { ThemeProvider } from '../theme/ThemeProvider';
import { darkColors } from '../theme/colors';
import { DisplayProvider } from '../features/display/DisplayContext';
import { DisplayShell } from '../features/display/DisplayShell';

/// Customer-facing display app root. Always dark (gallery-at-night). Wires font
/// loading, the theme, the DI/controller provider and the shell. Ported from the
/// Flutter `DisplayApp`.
export function DisplayApp() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
  });

  // Kiosk web view: on the web build, the first tap anywhere puts the browser
  // into true fullscreen (Chrome hides its URL/toolbar). One tap on setup and
  // the showroom screen stays clean. No-op on native.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const goFullscreen = () => {
      const el: any = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req && !document.fullscreenElement) {
        try {
          req.call(el);
        } catch {
          /* ignore */
        }
      }
    };
    document.addEventListener('pointerdown', goFullscreen);
    return () => document.removeEventListener('pointerdown', goFullscreen);
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: darkColors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={darkColors.accent} />
      </View>
    );
  }

  return (
    <ThemeProvider mode="dark">
      <StatusBar style="light" />
      <DisplayProvider>
        <DisplayShell />
      </DisplayProvider>
    </ThemeProvider>
  );
}
