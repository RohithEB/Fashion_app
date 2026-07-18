import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:provider/single_child_widget.dart';

import 'core/config/app_config.dart';
import 'core/realtime/backend_display_realtime.dart';
import 'core/realtime/display_realtime.dart';
import 'core/realtime/realtime_service.dart';
import 'core/theme/app_theme.dart';
import 'data/bundled_catalog_repository.dart';
import 'data/catalog_repository.dart';
import 'data/http_catalog_repository.dart';
import 'features/display/display_controller.dart';
import 'features/display/display_shell.dart';

/// Customer-facing display app root. Always dark (gallery-at-night), landscape,
/// and non-interactive — it renders whatever the salesperson presents.
class DisplayApp extends StatelessWidget {
  const DisplayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: <SingleChildWidget>[
        Provider<CatalogRepository>(
          // Offline / box-as-server mode hydrates from the bundled real-catalog
          // snapshot; backend mode reads the Node HTTP API.
          create: (_) => AppConfig.backendMode
              ? HttpCatalogRepository()
              : BundledCatalogRepository(),
        ),
        Provider<RealtimeService>(
          create: (_) => AppConfig.backendMode
              ? BackendDisplayRealtime()
              : createDisplayRealtime(),
          dispose: (_, RealtimeService s) => s.dispose(),
        ),
        ChangeNotifierProvider<DisplayController>(
          create: (BuildContext ctx) => DisplayController(
            ctx.read<RealtimeService>(),
            ctx.read<CatalogRepository>(),
            ownsIdle: !AppConfig.backendMode,
          ),
        ),
      ],
      child: MaterialApp(
        title: 'Ebani — Showroom',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.dark(),
        darkTheme: AppTheme.dark(),
        themeMode: ThemeMode.dark,
        home: const DisplayShell(),
      ),
    );
  }
}
