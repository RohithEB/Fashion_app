import 'package:flutter/material.dart';

import 'app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Follow the kiosk's real hardware orientation — forcing portrait on a
  // landscape-only panel collapses the render surface (blank/white). The
  // screens are fully responsive to whatever orientation the device reports,
  // so a portrait-mounted kiosk renders portrait and a landscape TV renders
  // landscape, both correctly.
  runApp(const DisplayApp());
}
