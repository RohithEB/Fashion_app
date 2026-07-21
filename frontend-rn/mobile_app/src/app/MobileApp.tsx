import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { CormorantGaramond_500Medium, CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond';
import { AppConfig } from '../config/appConfig';
import { ThemeProvider } from '../theme/ThemeProvider';
import { lightColors } from '../theme/colors';
import { AppProviders, useDeps } from './providers';
import { RestartContext } from './restart';
import { RootNavigator } from './RootNavigator';
import { IdleSessionWatcher } from '../features/connection/IdleSessionWatcher';
import { IdleWarningOverlay } from '../features/connection/IdleWarningOverlay';
import { useListenable } from '../core/useListenable';

/// Salesperson controller app root. Always light (POS surface). Wires font
/// loading, persisted config, DI, navigation, and the idle-session guards.
/// Ported from the Flutter `FashionControllerApp` + `main()`.
export function MobileApp() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
  });
  const [cfgLoaded, setCfgLoaded] = useState(false);
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => {
    AppConfig.load().finally(() => setCfgLoaded(true));
  }, []);

  // On the web build (inside the WebView), suppress the browser's default focus
  // ring/tap highlight on inputs — the field's own bordered container already
  // shows focus. Without this, the WebView draws an ugly outline over the field.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent = [
      '*{-webkit-tap-highlight-color:transparent;}',
      'input,textarea,select,[contenteditable]{outline:none!important;box-shadow:none!important;}',
      'input:focus,textarea:focus,select:focus{outline:none!important;box-shadow:none!important;}',
    ].join('');
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!fontsLoaded || !cfgLoaded) return <Splash />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider mode="light">
          <StatusBar style="dark" />
          <RestartContext.Provider value={() => setRestartKey((k) => k + 1)}>
            <AppProviders key={restartKey}>
              <BootstrapGate>
                <NavigationContainer>
                  <IdleSessionWatcher>
                    <IdleWarningOverlay>
                      <RootNavigator />
                    </IdleWarningOverlay>
                  </IdleSessionWatcher>
                </NavigationContainer>
              </BootstrapGate>
            </AppProviders>
          </RestartContext.Provider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/// Hold on a splash until the persisted auth session is restored, so a signed-in
/// associate never sees the login screen flash by. Ported from `_BootstrapSplash`.
function BootstrapGate({ children }: { children: React.ReactNode }) {
  const { auth } = useDeps();
  useListenable(auth);
  if (!auth.bootstrapped) return <Splash />;
  return <>{children}</>;
}

function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: lightColors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={lightColors.accent} />
    </View>
  );
}
