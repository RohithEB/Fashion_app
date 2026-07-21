import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { DisplayPhase } from '../../models/presentationState';
import { useDisplaySelector } from './DisplayContext';
import { SplashScreen } from './screens/SplashScreen';
import { AdvertisementScreen } from './screens/AdvertisementScreen';
import { WaitingScreen } from './screens/WaitingScreen';
import { ConnectingScreen } from './screens/ConnectingScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { CatalogScreen } from './screens/CatalogScreen';
import { CartScreen } from './screens/CartScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { PresentationScreen } from './screens/PresentationScreen';
import { ThankYouScreen } from './screens/ThankYouScreen';

/// Root of the display: renders the screen for the current DisplayPhase and
/// cross-fades between phases cinematically. Ported from `DisplayShell`.
export function DisplayShell() {
  const { colors } = useTheme();
  const phase = useDisplaySelector((c) => c.phase);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CrossFade phaseKey={phase}>{screenFor(phase)}</CrossFade>
    </View>
  );
}

function screenFor(phase: DisplayPhase): React.ReactNode {
  switch (phase) {
    case DisplayPhase.splash:
      return <SplashScreen />;
    case DisplayPhase.advertisement:
      return <AdvertisementScreen />;
    case DisplayPhase.waiting:
      return <WaitingScreen />;
    case DisplayPhase.connecting:
      return <ConnectingScreen />;
    case DisplayPhase.loading:
      return <LoadingScreen />;
    case DisplayPhase.welcome:
      return <WelcomeScreen />;
    case DisplayPhase.catalogue:
      return <CatalogScreen />;
    case DisplayPhase.cart:
      return <CartScreen />;
    case DisplayPhase.checkout:
      return <CheckoutScreen />;
    case DisplayPhase.presenting:
      return <PresentationScreen />;
    case DisplayPhase.thankYou:
      return <ThankYouScreen />;
    case DisplayPhase.disconnected:
      return <WaitingScreen />;
    default:
      return <WaitingScreen />;
  }
}

/// Cinematic 700ms cross-fade when the keyed child changes — the RN equivalent
/// of Flutter's AnimatedSwitcher + KeyedSubtree.
function CrossFade({ phaseKey, children }: { phaseKey: string; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [current, setCurrent] = React.useState<{ key: string; node: React.ReactNode }>({
    key: phaseKey,
    node: children,
  });

  useEffect(() => {
    if (phaseKey === current.key) {
      setCurrent({ key: phaseKey, node: children });
      return;
    }
    opacity.setValue(0);
    setCurrent({ key: phaseKey, node: children });
    Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseKey, children]);

  return <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>{current.node}</Animated.View>;
}
