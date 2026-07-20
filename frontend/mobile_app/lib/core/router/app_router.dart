import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../features/auth/auth_controller.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/register_screen.dart';
import '../../features/cart/cart_screen.dart';
import '../../features/catalog/catalog_controller.dart';
import '../../features/catalog/home_screen.dart';
import '../../features/checkout/checkout_screen.dart';
import '../../features/checkout/payment_success_screen.dart';
import '../../features/connection/connect_screen.dart';
import '../../features/connection/connection_controller.dart';
import '../../features/onboarding/onboarding_controller.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/customer/customer_profile_screen.dart';
import '../../features/product/product_detail_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/recommendations/recommendations_screen.dart';
import '../../models/order.dart';
import '../../models/product.dart';
import '../theme/app_motion.dart';

/// App routes. Guards enforce the real-world order: **log in → pair a display →
/// browse**. Everything else is reachable once connected.
abstract final class AppRoutes {
  static const String login = '/login';
  static const String register = '/register';
  static const String connect = '/connect';
  static const String onboarding = '/onboarding';
  static const String profile = '/profile';
  static const String customerProfile = '/customer-profile';
  static const String home = '/home';
  static const String product = '/product';
  static const String cart = '/cart';
  static const String recommendations = '/recommendations';
  static const String checkout = '/checkout';
  static const String success = '/success';
}

abstract final class AppRouter {
  static GoRouter build(BuildContext context) {
    final ConnectionController conn = context.read<ConnectionController>();
    final AuthController auth = context.read<AuthController>();
    final OnboardingController onboarding = context
        .read<OnboardingController>();
    final CatalogController catalog = context.read<CatalogController>();
    return GoRouter(
      initialLocation: AppRoutes.login,
      refreshListenable: Listenable.merge(<Listenable>[
        conn,
        auth,
        onboarding,
      ]),
      redirect: (BuildContext ctx, GoRouterState state) {
        final bool loggedIn = auth.isAuthenticated;
        final bool connected = conn.isConnected;
        final bool onboarded = onboarding.isCompletedFor(
          conn.session?.sessionId,
        );
        final String loc = state.matchedLocation;
        const Set<String> authRoutes = <String>{
          AppRoutes.login,
          AppRoutes.register,
        };
        // log in → pair a display → capture the guest → browse.
        if (!loggedIn) return authRoutes.contains(loc) ? null : AppRoutes.login;
        if (!connected) {
          return loc == AppRoutes.connect ? null : AppRoutes.connect;
        }
        if (!onboarded) {
          return loc == AppRoutes.onboarding ? null : AppRoutes.onboarding;
        }
        if (authRoutes.contains(loc) ||
            loc == AppRoutes.connect ||
            loc == AppRoutes.onboarding) {
          return AppRoutes.home;
        }
        return null;
      },
      routes: <RouteBase>[
        GoRoute(
          path: AppRoutes.login,
          pageBuilder: (_, _) => _fade(const LoginScreen()),
        ),
        GoRoute(
          path: AppRoutes.register,
          pageBuilder: (_, _) => _fade(const RegisterScreen()),
        ),
        GoRoute(
          path: AppRoutes.connect,
          pageBuilder: (_, _) => _fade(const ConnectScreen()),
        ),
        GoRoute(
          path: AppRoutes.onboarding,
          pageBuilder: (_, _) => _fade(const OnboardingScreen()),
        ),
        GoRoute(
          path: AppRoutes.profile,
          pageBuilder: (_, _) => _fade(const ProfileScreen()),
        ),
        GoRoute(
          path: AppRoutes.customerProfile,
          pageBuilder: (_, _) => _fade(const CustomerProfileScreen()),
        ),
        GoRoute(
          path: AppRoutes.home,
          pageBuilder: (_, _) => _fade(const HomeScreen()),
        ),
        GoRoute(
          path: AppRoutes.product,
          pageBuilder: (_, GoRouterState state) {
            // `state.extra` is NOT preserved across a go_router refresh (e.g. the
            // idle `session_warning`/`session_end` notify). Recover the last
            // product so a refresh never crashes into a blank page or bounces Home.
            final Object? extra = state.extra;
            final Product? product = extra is Product
                ? extra
                : catalog.lastViewedProduct;
            if (product == null) return _fade(const HomeScreen());
            catalog.lastViewedProduct = product;
            return _fade(ProductDetailScreen(product: product));
          },
        ),
        GoRoute(
          path: AppRoutes.cart,
          pageBuilder: (_, _) => _fade(const CartScreen()),
        ),
        GoRoute(
          path: AppRoutes.recommendations,
          pageBuilder: (_, _) => _fade(const RecommendationsScreen()),
        ),
        GoRoute(
          path: AppRoutes.checkout,
          pageBuilder: (_, _) => _fade(const CheckoutScreen()),
        ),
        GoRoute(
          path: AppRoutes.success,
          pageBuilder: (_, GoRouterState state) =>
              _fade(PaymentSuccessScreen(order: state.extra as Order?)),
        ),
      ],
    );
  }

  static CustomTransitionPage<void> _fade(Widget child) =>
      CustomTransitionPage<void>(
        child: child,
        transitionDuration: AppMotion.base,
        transitionsBuilder: (_, Animation<double> animation, _, Widget child) =>
            FadeTransition(
              opacity: CurvedAnimation(
                parent: animation,
                curve: AppMotion.standard,
              ),
              child: child,
            ),
      );
}
