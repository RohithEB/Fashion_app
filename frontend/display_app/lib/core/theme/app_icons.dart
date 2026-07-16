import 'package:flutter/widgets.dart';
import 'package:material_symbols_icons/symbols.dart';

/// Curated icon set on **Material Symbols Rounded** — one variable font, total
/// visual consistency, soft/premium optical style, scales from phone to 4K.
/// Feature code references [AppIcons.*] rather than raw glyphs.
abstract final class AppIcons {
  // Navigation
  static const IconData search = Symbols.search_rounded;
  static const IconData home = Symbols.home_rounded;
  static const IconData back = Symbols.arrow_back_ios_new_rounded;
  static const IconData forward = Symbols.arrow_forward_ios_rounded;
  static const IconData close = Symbols.close_rounded;
  static const IconData menu = Symbols.menu_rounded;
  static const IconData more = Symbols.more_horiz_rounded;
  static const IconData chevronDown = Symbols.keyboard_arrow_down_rounded;

  // Commerce
  static const IconData cart = Symbols.shopping_bag_rounded;
  static const IconData add = Symbols.add_rounded;
  static const IconData remove = Symbols.remove_rounded;
  static const IconData delete = Symbols.delete_rounded;
  static const IconData checkout = Symbols.point_of_sale_rounded;
  static const IconData payment = Symbols.credit_card_rounded;
  static const IconData tag = Symbols.sell_rounded;

  // Showroom / display control
  static const IconData showOnScreen = Symbols.cast_rounded;
  static const IconData connected = Symbols.cast_connected_rounded;
  static const IconData qrScan = Symbols.qr_code_scanner_rounded;
  static const IconData qrCode = Symbols.qr_code_2_rounded;
  static const IconData play = Symbols.play_arrow_rounded;
  static const IconData pause = Symbols.pause_rounded;
  static const IconData gallery = Symbols.photo_library_rounded;
  static const IconData video = Symbols.movie_rounded;
  static const IconData palette = Symbols.palette_rounded;
  static const IconData disconnect = Symbols.link_off_rounded;
  static const IconData zoomIn = Symbols.zoom_in_rounded;
  static const IconData sparkle = Symbols.auto_awesome_rounded;

  // Feedback
  static const IconData success = Symbols.check_circle_rounded;
  static const IconData check = Symbols.check_rounded;
  static const IconData warning = Symbols.warning_rounded;
  static const IconData error = Symbols.error_rounded;
  static const IconData info = Symbols.info_rounded;
  static const IconData empty = Symbols.inventory_2_rounded;

  // Account
  static const IconData person = Symbols.person_rounded;
  static const IconData logout = Symbols.logout_rounded;
  static const IconData lock = Symbols.lock_rounded;
  static const IconData visible = Symbols.visibility_rounded;
  static const IconData hidden = Symbols.visibility_off_rounded;

  // Attributes
  static const IconData size = Symbols.straighten_rounded;
  static const IconData favorite = Symbols.favorite_rounded;
  static const IconData filter = Symbols.tune_rounded;
}
