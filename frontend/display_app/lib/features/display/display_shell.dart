import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_motion.dart';
import '../../models/presentation_state.dart';
import 'display_controller.dart';
import 'screens/advertisement_screen.dart';
import 'screens/cart_screen.dart';
import 'screens/catalog_screen.dart';
import 'screens/checkout_screen.dart';
import 'screens/connecting_screen.dart';
import 'screens/loading_screen.dart';
import 'screens/presentation_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/thank_you_screen.dart';
import 'screens/waiting_screen.dart';
import 'screens/welcome_screen.dart';

/// Root of the display: renders the screen for the current [DisplayPhase] and
/// cross-fades between phases cinematically.
class DisplayShell extends StatelessWidget {
  const DisplayShell({super.key});

  @override
  Widget build(BuildContext context) {
    final DisplayPhase phase = context.select<DisplayController, DisplayPhase>(
      (DisplayController c) => c.phase,
    );

    final Widget child = switch (phase) {
      DisplayPhase.splash => const SplashScreen(),
      DisplayPhase.advertisement => const AdvertisementScreen(),
      DisplayPhase.waiting => const WaitingScreen(),
      DisplayPhase.connecting => const ConnectingScreen(),
      DisplayPhase.loading => const LoadingScreen(),
      DisplayPhase.welcome => const WelcomeScreen(),
      DisplayPhase.catalogue => const CatalogScreen(),
      DisplayPhase.cart => const CartScreen(),
      DisplayPhase.checkout => const CheckoutScreen(),
      DisplayPhase.presenting => const PresentationScreen(),
      DisplayPhase.thankYou => const ThankYouScreen(),
      DisplayPhase.disconnected => const WaitingScreen(),
    };

    return Scaffold(
      body: AnimatedSwitcher(
        duration: AppMotion.display,
        switchInCurve: AppMotion.standard,
        switchOutCurve: AppMotion.standard,
        child: KeyedSubtree(key: ValueKey<DisplayPhase>(phase), child: child),
      ),
    );
  }
}
