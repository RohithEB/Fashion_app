import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:provider/single_child_widget.dart';

import 'core/config/app_config.dart';
import 'core/realtime/backend_controller_realtime.dart';
import 'core/realtime/controller_realtime_service.dart';
import 'core/realtime/realtime_service.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_colors.dart';
import 'core/theme/app_theme.dart';
import 'data/auth_repository.dart';
import 'data/bundled_catalog_repository.dart';
import 'data/catalog_repository.dart';
import 'data/checkout_repository.dart';
import 'data/customer_repository.dart';
import 'data/http_catalog_repository.dart';
import 'data/journey_logger.dart';
import 'features/auth/auth_controller.dart';
import 'features/cart/cart_controller.dart';
import 'features/catalog/catalog_controller.dart';
import 'features/connection/connection_controller.dart';
import 'features/connection/idle_warning_overlay.dart';
import 'features/onboarding/onboarding_controller.dart';
import 'features/presentation/presentation_controller.dart';

/// Salesperson controller app root: wires dependency injection (provider),
/// the luxury theme, and the router.
class FashionControllerApp extends StatelessWidget {
  const FashionControllerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: <SingleChildWidget>[
        Provider<CatalogRepository>(
          // Offline / box-as-server mode reads the bundled real-catalog snapshot
          // (instant, no network); backend mode reads the Node HTTP API.
          create: (_) => AppConfig.backendMode
              ? HttpCatalogRepository()
              : BundledCatalogRepository(),
        ),
        Provider<AuthRepository>(
          create: (_) => AppConfig.backendMode
              ? HttpAuthRepository()
              : const MockAuthRepository(),
        ),
        Provider<CheckoutRepository>(
          create: (_) => AppConfig.backendMode
              ? HttpCheckoutRepository()
              : const MockCheckoutRepository(),
        ),
        Provider<CustomerRepository>(
          create: (_) => AppConfig.backendMode
              ? HttpCustomerRepository()
              : const MockCustomerRepository(),
        ),
        Provider<JourneyLogger>(create: (_) => JourneyLogger()),
        Provider<RealtimeService>(
          create: (_) => AppConfig.backendMode
              ? BackendControllerRealtime()
              : ControllerRealtimeService(),
          dispose: (_, RealtimeService s) => s.dispose(),
        ),
        ChangeNotifierProvider<CatalogController>(
          create: (BuildContext ctx) =>
              CatalogController(ctx.read<CatalogRepository>())..load(),
        ),
        ChangeNotifierProvider<AuthController>(
          create: (BuildContext ctx) =>
              AuthController(ctx.read<AuthRepository>()),
        ),
        ChangeNotifierProvider<OnboardingController>(
          create: (BuildContext ctx) =>
              OnboardingController(ctx.read<CustomerRepository>()),
        ),
        ChangeNotifierProvider<CartController>(create: (_) => CartController()),
        ChangeNotifierProvider<ConnectionController>(
          create: (BuildContext ctx) =>
              ConnectionController(ctx.read<RealtimeService>()),
        ),
        ChangeNotifierProvider<PresentationController>(
          create: (BuildContext ctx) =>
              PresentationController(ctx.read<RealtimeService>()),
        ),
      ],
      child: Builder(
        builder: (BuildContext context) {
          return MaterialApp.router(
            title: 'Ebani — Studio',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(),
            darkTheme: AppTheme.dark(),
            themeMode: ThemeMode.light,
            routerConfig: AppRouter.build(context),
            builder: (BuildContext context, Widget? child) {
              // Hold on a splash until the persisted session is restored, so a
              // signed-in associate never sees the login screen flash by.
              if (!context.watch<AuthController>().bootstrapped) {
                return const _BootstrapSplash();
              }
              // Auto-logout disabled for now (no client idle timeout).
              return IdleWarningOverlay(
                child: child ?? const SizedBox.shrink(),
              );
            },
          );
        },
      ),
    );
  }
}

/// Shown briefly on cold start while the persisted auth session is restored.
class _BootstrapSplash extends StatelessWidget {
  const _BootstrapSplash();

  @override
  Widget build(BuildContext context) {
    final AppColors c = AppColors.of(context);
    return Scaffold(
      backgroundColor: c.background,
      body: Center(
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(c.accent),
        ),
      ),
    );
  }
}
