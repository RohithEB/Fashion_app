import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:provider/single_child_widget.dart';

import 'core/realtime/controller_realtime_service.dart';
import 'core/realtime/realtime_service.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'data/catalog_repository.dart';
import 'features/cart/cart_controller.dart';
import 'features/catalog/catalog_controller.dart';
import 'features/connection/connection_controller.dart';
import 'features/connection/idle_warning_overlay.dart';
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
          create: (_) => const MockCatalogRepository(),
        ),
        Provider<RealtimeService>(
          create: (_) => ControllerRealtimeService(),
          dispose: (_, RealtimeService s) => s.dispose(),
        ),
        ChangeNotifierProvider<CatalogController>(
          create: (BuildContext ctx) =>
              CatalogController(ctx.read<CatalogRepository>())..load(),
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
            builder: (BuildContext context, Widget? child) =>
                IdleWarningOverlay(child: child ?? const SizedBox.shrink()),
          );
        },
      ),
    );
  }
}
