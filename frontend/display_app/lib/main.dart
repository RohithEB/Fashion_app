import 'package:flutter/material.dart';

import 'app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // The display follows the device orientation; every screen is responsive to
  // both landscape (TV) and portrait (kiosk panel).
  runApp(const DisplayApp());
}
