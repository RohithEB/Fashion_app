import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Product } from '../models/product';
import { useListenable } from '../core/useListenable';
import { useDeps } from './providers';
import { LoginScreen } from '../features/auth/LoginScreen';
import { ConnectScreen } from '../features/connection/ConnectScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { HomeScreen } from '../features/catalog/HomeScreen';
import { ProductDetailScreen } from '../features/product/ProductDetailScreen';
import { RecommendationsScreen } from '../features/recommendations/RecommendationsScreen';
import { CustomerProfileScreen } from '../features/customer/CustomerProfileScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';

/// Route params. Product/Order instances are passed in-memory (kiosk POC — no
/// deep-linking / state persistence), mirroring go_router's `state.extra`.
export type RootStackParamList = {
  Login: undefined;
  Connect: undefined;
  Onboarding: undefined;
  Home: undefined;
  Product: { product?: Product } | undefined;
  Recommendations: undefined;
  CustomerProfile: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/// Guards enforce the real-world order: log in → pair a display → capture the
/// guest → browse. Implemented with React Navigation's conditional-groups auth
/// pattern (the RN equivalent of the go_router `redirect`).
export function RootNavigator() {
  const { auth, connection, onboarding } = useDeps();
  useListenable(auth);
  useListenable(connection);
  useListenable(onboarding);

  const loggedIn = auth.isAuthenticated;
  const connected = connection.isConnected;
  const onboarded = onboarding.isCompletedFor(connection.session?.sessionId);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }}
    >
      {!loggedIn ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : !connected ? (
        <Stack.Screen name="Connect" component={ConnectScreen} />
      ) : !onboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Product" component={ProductDetailScreen} />
          <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
          <Stack.Screen name="CustomerProfile" component={CustomerProfileScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
