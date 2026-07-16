import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../features/auth/login_screen.dart';
import '../../features/cart/cart_screen.dart';
import '../../features/catalog/home_screen.dart';
import '../../features/checkout/checkout_screen.dart';
import '../../features/checkout/payment_success_screen.dart';
import '../../features/connection/connect_screen.dart';
import '../../features/connection/connection_controller.dart';
import '../../features/product/product_detail_screen.dart';
import '../../models/product.dart';
import '../theme/app_motion.dart';

/// App routes. Guards enforce the real-world order: **log in → pair a display →
/// browse**. Everything else is reachable once connected.
abstract final class AppRoutes {
  static const String login = '/login';
  static const String connect = '/connect';
  static const String home = '/home';
  static const String product = '/product';
  static const String cart = '/cart';
  static const String checkout = '/checkout';
  static const String success = '/success';
}

abstract final class AppRouter {
  static GoRouter build(BuildContext context) {
    final ConnectionController conn = context.read<ConnectionController>();
    return GoRouter(
      initialLocation: AppRoutes.login,
      refreshListenable: conn,
      redirect: (BuildContext ctx, GoRouterState state) {
        final bool loggedIn = conn.salesperson != null;
        final bool connected = conn.isConnected;
        final String loc = state.matchedLocation;
        if (!loggedIn) return loc == AppRoutes.login ? null : AppRoutes.login;
        if (!connected) {
          return loc == AppRoutes.connect ? null : AppRoutes.connect;
        }
        if (loc == AppRoutes.login || loc == AppRoutes.connect) {
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
          path: AppRoutes.connect,
          pageBuilder: (_, _) => _fade(const ConnectScreen()),
        ),
        GoRoute(
          path: AppRoutes.home,
          pageBuilder: (_, _) => _fade(const HomeScreen()),
        ),
        GoRoute(
          path: AppRoutes.product,
          pageBuilder: (_, GoRouterState state) => _fade(
            ProductDetailScreen(product: state.extra! as Product),
          ),
        ),
        GoRoute(
          path: AppRoutes.cart,
          pageBuilder: (_, _) => _fade(const CartScreen()),
        ),
        GoRoute(
          path: AppRoutes.checkout,
          pageBuilder: (_, _) => _fade(const CheckoutScreen()),
        ),
        GoRoute(
          path: AppRoutes.success,
          pageBuilder: (_, _) => _fade(const PaymentSuccessScreen()),
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
          opacity: CurvedAnimation(parent: animation, curve: AppMotion.standard),
          child: child,
        ),
      );
}
