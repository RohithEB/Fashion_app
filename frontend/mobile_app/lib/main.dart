import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app.dart';
import 'core/config/app_config.dart';
import 'core/restart_widget.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Load persisted server settings (backend mode + host) before wiring DI.
  await AppConfig.load();
  // The associate controller is a one-handed POS surface — lock to portrait so
  // layouts never reflow into landscape (which overflows the fixed columns).
  SystemChrome.setPreferredOrientations(<DeviceOrientation>[
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  runApp(const RestartWidget(child: FashionControllerApp()));
}
