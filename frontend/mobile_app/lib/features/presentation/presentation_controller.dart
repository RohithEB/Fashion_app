import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../core/realtime/realtime_service.dart';
import '../../models/presentation_state.dart';
import '../../models/product.dart';
import '../../models/ws_event.dart';

/// The **source of truth for Live Presentation Synchronization** on the mobile
/// side.
///
/// While the salesperson browses privately, [presentation] is null and nothing
/// reaches the display. Pressing "Show on Screen" ([showProduct]) enters
/// Presentation mode: from then on every interaction updates [presentation]
/// locally (so the in-app preview mirrors the TV) **and** emits a lightweight
/// [WsEvent] to the real display. High-frequency gestures (zoom/pan) are
/// throttled before emission to keep the channel light.
class PresentationController extends ChangeNotifier {
  PresentationController(this._realtime);

  final RealtimeService _realtime;

  ProductPresentation? _presentation;
  ProductPresentation? get presentation => _presentation;

  Product? _product;
  Product? get product => _product;

  bool get isPresenting => _presentation != null;

  /// True while the cart is mirrored on the display (so cart edits re-sync live).
  bool cartOnScreen = false;

  String? _sessionId;
  set sessionId(String? value) => _sessionId = value;

  Timer? _throttle;
  WsEvent? _pendingThrottled;

  void _apply(WsEvent event, {bool throttled = false}) {
    if (_presentation != null) {
      _presentation = _presentation!.applyEvent(event);
      notifyListeners();
    }
    if (throttled) {
      _emitThrottled(event);
    } else {
      _emit(event);
    }
  }

  void _emit(WsEvent event) {
    _realtime.emit(
      WsEvent(
        type: event.type,
        sessionId: _sessionId,
        senderRole: SenderRole.salesperson,
        payload: event.payload,
      ),
    );
  }

  /// Coalesce rapid events (zoom/pan) to at most one per 60ms.
  void _emitThrottled(WsEvent event) {
    _pendingThrottled = event;
    _throttle ??= Timer.periodic(const Duration(milliseconds: 60), (_) {
      if (_pendingThrottled != null) {
        _emit(_pendingThrottled!);
        _pendingThrottled = null;
      } else {
        _throttle?.cancel();
        _throttle = null;
      }
    });
  }

  // ---- Presentation gating --------------------------------------------------

  /// Enter Presentation mode with [product] (the "Show on Screen" action).
  void showProduct(Product product, {String? variantId, String? size}) {
    _product = product;
    cartOnScreen = false;
    final String resolvedVariant = variantId ?? product.defaultVariant.id;
    _presentation = ProductPresentation(
      productId: product.id,
      variantId: resolvedVariant,
      size: size,
    );
    _emit(
      WsEvent(
        type: WsEventType.showProduct,
        payload: <String, dynamic>{
          'productId': product.id,
          'variantId': resolvedVariant,
          'size': ?size,
        },
      ),
    );
    notifyListeners();
  }

  /// Push the top recommendations to the display as a grid. The picks stay
  /// private on the phone until the associate opens the recommendations screen.
  void showRecommendations(List<String> productIds) {
    _presentation = null;
    _product = null;
    cartOnScreen = false;
    _emit(
      WsEvent(
        type: WsEventType.showRecommendations,
        payload: <String, dynamic>{'productIds': productIds},
      ),
    );
    notifyListeners();
  }

  /// Mirror the associate's product-detail scroll (0..1) onto the display's info
  /// panel so it scrolls in step. Throttled — only sent while presenting.
  void syncScroll(double fraction) => _apply(
    WsEvent(
      type: WsEventType.scrollSync,
      payload: <String, dynamic>{'fraction': fraction},
    ),
    throttled: true,
  );

  /// Push the full catalogue to the display (used right after onboarding).
  /// Leaves single-product presentation mode; the display shows the grid.
  void showCatalog() {
    _presentation = null;
    _product = null;
    cartOnScreen = false;
    _emit(const WsEvent(type: WsEventType.showCatalog));
    notifyListeners();
  }

  /// Mirror the cart onto the display as a full cart page (items, quantities,
  /// totals). While [cartOnScreen], [syncCart] pushes live edits.
  void showCart(Map<String, dynamic> payload) {
    _presentation = null;
    _product = null;
    cartOnScreen = true;
    _emit(WsEvent(type: WsEventType.showCart, payload: payload));
    notifyListeners();
  }

  /// Re-push the updated cart if it is currently on the display (quantity/delete).
  void syncCart(Map<String, dynamic> payload) {
    if (!cartOnScreen) return;
    _emit(WsEvent(type: WsEventType.showCart, payload: payload));
  }

  /// Leave Presentation mode (customer returns to Welcome).
  void hideProduct() {
    _presentation = null;
    _product = null;
    cartOnScreen = false;
    _emit(const WsEvent(type: WsEventType.hideProduct));
    notifyListeners();
  }

  // ---- Synchronized interactions -------------------------------------------

  void changeColor(String variantId, {String? size}) => _apply(
    WsEvent(
      type: WsEventType.changeColor,
      payload: <String, dynamic>{'variantId': variantId, 'size': ?size},
    ),
  );

  /// Mirror the salesperson's size selection onto the display.
  void changeSize(String size) => _apply(
    WsEvent(
      type: WsEventType.changeSize,
      payload: <String, dynamic>{'size': size},
    ),
  );

  void changeImage(int index) => _apply(
    WsEvent(
      type: WsEventType.changeImage,
      payload: <String, dynamic>{'imageIndex': index},
    ),
  );

  void zoom(double scale, {double focalX = 0, double focalY = 0}) => _apply(
    WsEvent(
      type: WsEventType.zoomImage,
      payload: <String, dynamic>{
        'scale': scale,
        'focalX': focalX,
        'focalY': focalY,
      },
    ),
    throttled: true,
  );

  void pan(double dx, double dy) => _apply(
    WsEvent(
      type: WsEventType.panImage,
      payload: <String, dynamic>{'offsetX': dx, 'offsetY': dy},
    ),
    throttled: true,
  );

  void resetZoom() => _apply(const WsEvent(type: WsEventType.resetZoom));

  /// Return the display to the normal single-image (hero) view from gallery or
  /// video, resetting zoom/pan. This is the "reset view" action.
  void resetView() {
    final int idx = _presentation?.imageIndex ?? 0;
    _apply(
      WsEvent(
        type: WsEventType.changeImage,
        payload: <String, dynamic>{'imageIndex': idx},
      ),
    );
  }

  /// Expand/collapse the full product-details panel on the display (driven by
  /// the draggable details sheet on the product screen).
  void showDetails(bool expanded) => _apply(
    WsEvent(
      type: WsEventType.showDetails,
      payload: <String, dynamic>{'expanded': expanded},
    ),
  );

  void toggleAIHighlights() => _apply(
    WsEvent(
      type: WsEventType.showAIHighlights,
      payload: <String, dynamic>{
        'visible': !(_presentation?.showAIHighlights ?? false),
      },
    ),
  );

  void showRelatedMedia(String mediaId) => _apply(
    WsEvent(
      type: WsEventType.showRelatedMedia,
      payload: <String, dynamic>{'mediaId': mediaId},
    ),
  );

  /// Switch the display into the multi-image gallery view.
  void showGallery() => _apply(
    const WsEvent(
      type: WsEventType.showRelatedMedia,
      payload: <String, dynamic>{'mediaId': 'gallery'},
    ),
  );

  /// Return the display to a single focused image (hero) view.
  void focusImage(int index) => changeImage(index);

  void playVideo() => _apply(const WsEvent(type: WsEventType.playVideo));
  void pauseVideo() => _apply(const WsEvent(type: WsEventType.pauseVideo));
  void seekVideo(int positionMs) => _apply(
    WsEvent(
      type: WsEventType.seekVideo,
      payload: <String, dynamic>{'positionMs': positionMs},
    ),
  );

  @override
  void dispose() {
    _throttle?.cancel();
    super.dispose();
  }
}
