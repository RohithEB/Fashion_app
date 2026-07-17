import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../core/realtime/display_realtime.dart';
import '../../core/realtime/realtime_service.dart';
import '../../data/catalog_repository.dart';
import '../../models/presentation_state.dart';
import '../../models/product.dart';
import '../../models/ws_event.dart';

/// Drives the customer display. A thin renderer with its own phase state
/// machine: it holds no browsing state and transitions only on (a) local timers
/// (splash/ads/thank-you) or (b) realtime events received from the salesperson
/// via the server. Product content is rendered from the **cached catalog**
/// (hydrated over HTTP on boot); events carry only ids + transform params.
class DisplayController extends ChangeNotifier {
  DisplayController(this._realtime, this._catalog, {this.ownsIdle = true}) {
    _sub = _realtime.events.listen(_handle);
    _boot();
  }

  final RealtimeService _realtime;
  final CatalogRepository _catalog;

  /// Whether this controller runs the idle timer itself (standalone mode). In
  /// backend mode the Node server owns idle/`session_end`, so we don't.
  final bool ownsIdle;

  StreamSubscription<WsEvent>? _sub;

  /// Seconds the Thank-You screen stays before returning to idle. Spec: 60s;
  /// shortened for the POC demo.
  static const int thankYouSeconds = 15;

  /// Idle before a warning is issued. Spec: 10 minutes; shortened for the demo.
  static const Duration idleTimeout = Duration(seconds: 90);

  /// Grace window after the warning before the session auto-ends.
  static const int graceSeconds = 20;

  /// The pairing link encoded in the on-screen QR. Set from the LAN server's
  /// real device IP + token once [start] completes (placeholder until then).
  String pairingUrl = 'http://192.168.1.42:8080/pair?token=DEMO-8421';

  List<Product> _cache = <Product>[];

  DisplayPhase phase = DisplayPhase.splash;
  ProductPresentation? presentation;
  Product? product;
  String salespersonName = '';
  int thankYouCountdown = thankYouSeconds;

  /// True while the idle grace countdown is running (surfaced subtly on-screen).
  bool idleWarningActive = false;
  int idleSecondsLeft = graceSeconds;

  /// The product id we currently intend to present — guards against a stale
  /// async detail fetch overwriting a newer command.
  String? _presentTargetId;

  Timer? _phaseTimer;
  Timer? _countdownTimer;
  Timer? _idleTimer;
  Timer? _warningTimer;

  Future<void> _boot() async {
    // Host the LAN server (native) and publish the real pairing URL.
    final RealtimeService rt = _realtime;
    if (rt is DisplayRealtimeService) {
      await rt.start();
      pairingUrl = rt.pairingUrl;
      notifyListeners();
    }
    _cache = await _catalog.products(); // hydrate + cache the catalog
    _phaseTimer = Timer(const Duration(milliseconds: 2200), () {
      phase = DisplayPhase.advertisement;
      notifyListeners();
      _phaseTimer = Timer(const Duration(seconds: 6), _toWaiting);
    });
  }

  void _toWaiting() {
    _cancelTimers();
    // In backend mode the server re-registers the display with a fresh token.
    final RealtimeService rt = _realtime;
    if (rt is DisplayRealtimeService) pairingUrl = rt.pairingUrl;
    phase = DisplayPhase.waiting;
    presentation = null;
    product = null;
    salespersonName = '';
    notifyListeners();
  }

  void _handle(WsEvent e) {
    // Real interactions count as activity and reset the idle clock; pure
    // liveness heartbeats do not (so an idle-but-connected app still times out).
    if (e.type != WsEventType.heartbeat) _registerActivity();
    switch (e.type) {
      case WsEventType.connectScreen:
        salespersonName =
            (e.payload['salespersonName'] as String?) ?? 'your advisor';
        _runConnectFlow();
      case WsEventType.showCatalog:
        _showCatalog();
      case WsEventType.showCart:
        _showCart(e);
      case WsEventType.showProduct:
        _showProduct(e);
      case WsEventType.hideProduct:
        _presentTargetId = null;
        phase = DisplayPhase.welcome;
        presentation = null;
        product = null;
        notifyListeners();
      case WsEventType.changeColor:
      case WsEventType.changeImage:
      case WsEventType.zoomImage:
      case WsEventType.panImage:
      case WsEventType.resetZoom:
      case WsEventType.showAIHighlights:
      case WsEventType.showDetails:
      case WsEventType.showRelatedMedia:
      case WsEventType.playVideo:
      case WsEventType.pauseVideo:
      case WsEventType.seekVideo:
      case WsEventType.muteVideo:
        if (presentation != null) {
          presentation = presentation!.applyEvent(e);
          notifyListeners();
        }
      case WsEventType.paymentSuccess:
        _runThankYou();
      case WsEventType.disconnectScreen:
      case WsEventType.sessionEnd:
      case WsEventType.sessionTimeout:
        _toWaiting();
      default:
        break;
    }
  }

  void _runConnectFlow() {
    _cancelTimers();
    phase = DisplayPhase.connecting;
    notifyListeners();
    _phaseTimer = Timer(const Duration(milliseconds: 900), () {
      phase = DisplayPhase.loading;
      notifyListeners();
      _phaseTimer = Timer(const Duration(milliseconds: 1100), () {
        phase = DisplayPhase.welcome;
        notifyListeners();
      });
    });
  }

  /// The hydrated catalog, shown as a grid on the [DisplayPhase.catalogue] screen.
  List<Product> get catalog => _cache;

  /// The cart/shortlist payload mirrored from the controller (read-only).
  Map<String, dynamic>? cartView;

  /// Show the full collection grid (pushed by the controller after onboarding).
  void _showCatalog() {
    _cancelTimers();
    _presentTargetId = null;
    presentation = null;
    product = null;
    phase = DisplayPhase.catalogue;
    notifyListeners();
  }

  /// Mirror the controller's cart page (items, quantities, totals) — read-only.
  void _showCart(WsEvent e) {
    _cancelTimers();
    _presentTargetId = null;
    presentation = null;
    product = null;
    cartView = e.payload;
    phase = DisplayPhase.cart;
    notifyListeners();
  }

  void _showProduct(WsEvent e) {
    final String? id = e.productId;
    if (id == null) return;
    _presentTargetId = id;
    final Product? cached = _cache.where((Product p) => p.id == id).firstOrNull;
    if (cached != null) {
      // We have data → present immediately.
      product = cached;
      presentation = ProductPresentation(
        productId: id,
        variantId: e.variantId ?? cached.defaultVariant.id,
      );
      phase = DisplayPhase.presenting;
      notifyListeners();
    } else {
      // Not cached yet → show the loading screen (never a blank presenting
      // screen) while we fetch the detail.
      phase = DisplayPhase.loading;
      notifyListeners();
    }
    // Fetch/upgrade to full detail (rich variants/media/enrichment).
    unawaited(
      _catalog
          .productById(id)
          .then((Product? full) {
            if (full == null || _presentTargetId != id) {
              // Detail unavailable and nothing to show → fall back to welcome.
              if (product == null && phase == DisplayPhase.loading) {
                phase = DisplayPhase.welcome;
                notifyListeners();
              }
              return;
            }
            product = full;
            presentation = ProductPresentation(
              productId: id,
              variantId: e.variantId ?? full.defaultVariant.id,
            );
            phase = DisplayPhase.presenting;
            notifyListeners();
          })
          .catchError((Object _) {
            if (product == null && phase == DisplayPhase.loading) {
              phase = DisplayPhase.welcome;
              notifyListeners();
            }
          }),
    );
  }

  void _runThankYou() {
    _cancelTimers();
    phase = DisplayPhase.thankYou;
    thankYouCountdown = thankYouSeconds;
    notifyListeners();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (Timer t) {
      thankYouCountdown--;
      if (thankYouCountdown <= 0) {
        _toWaiting();
      } else {
        notifyListeners();
      }
    });
  }

  // ---- Idle / session lifecycle --------------------------------------------

  /// Called on every inbound event. Restarts the idle countdown and cancels any
  /// pending warning. Only armed while a session is active (welcome/presenting).
  void _registerActivity() {
    if (!ownsIdle) return; // server owns idle in backend mode
    _idleTimer?.cancel();
    if (idleWarningActive) {
      idleWarningActive = false;
      _warningTimer?.cancel();
      notifyListeners();
    }
    _idleTimer = Timer(idleTimeout, _beginIdleWarning);
  }

  void _beginIdleWarning() {
    if (phase != DisplayPhase.welcome &&
        phase != DisplayPhase.presenting &&
        phase != DisplayPhase.catalogue &&
        phase != DisplayPhase.cart) {
      return;
    }
    idleWarningActive = true;
    idleSecondsLeft = graceSeconds;
    notifyListeners();
    _emit(
      WsEvent(
        type: WsEventType.sessionWarning,
        payload: <String, dynamic>{'secondsLeft': idleSecondsLeft},
      ),
    );
    _warningTimer = Timer.periodic(const Duration(seconds: 1), (Timer t) {
      idleSecondsLeft--;
      if (idleSecondsLeft <= 0) {
        _endSession('idle_timeout');
      } else {
        notifyListeners();
        _emit(
          WsEvent(
            type: WsEventType.sessionWarning,
            payload: <String, dynamic>{'secondsLeft': idleSecondsLeft},
          ),
        );
      }
    });
  }

  void _endSession(String reason) {
    _emit(
      WsEvent(
        type: WsEventType.sessionEnd,
        payload: <String, dynamic>{'reason': reason},
      ),
    );
    _toWaiting();
  }

  /// Broadcast an event to connected controllers (no-op on the web stub).
  void _emit(WsEvent event) => _realtime.emit(event);

  void _cancelTimers() {
    _phaseTimer?.cancel();
    _countdownTimer?.cancel();
    _idleTimer?.cancel();
    _warningTimer?.cancel();
    idleWarningActive = false;
  }

  /// Standalone showcase: injects a scripted session so the display animates
  /// through every screen without a physical mobile controller. Used from the
  /// waiting screen for demos; no-op if a real transport is wired.
  void startDemoSession() {
    final RealtimeService rt = _realtime;
    if (rt is! DisplayRealtimeService) return;
    final List<Product> demo = _cache.take(3).toList();
    if (demo.isEmpty) return;

    void at(int ms, WsEvent event) =>
        Timer(Duration(milliseconds: ms), () => rt.inject(event));

    at(
      0,
      WsEvent(
        type: WsEventType.connectScreen,
        payload: const <String, dynamic>{'salespersonName': 'Eleanor'},
      ),
    );
    at(
      3200,
      WsEvent(
        type: WsEventType.showProduct,
        payload: <String, dynamic>{
          'productId': demo[0].id,
          'variantId': demo[0].defaultVariant.id,
        },
      ),
    );
    at(
      5200,
      const WsEvent(
        type: WsEventType.showAIHighlights,
        payload: <String, dynamic>{'visible': true},
      ),
    );
    if (demo[0].variants.length > 1) {
      at(
        7600,
        WsEvent(
          type: WsEventType.changeColor,
          payload: <String, dynamic>{'variantId': demo[0].variants[1].id},
        ),
      );
    }
    at(
      10000,
      const WsEvent(
        type: WsEventType.changeImage,
        payload: <String, dynamic>{'imageIndex': 1},
      ),
    );
    at(
      12400,
      WsEvent(
        type: WsEventType.showProduct,
        payload: <String, dynamic>{
          'productId': demo[1].id,
          'variantId': demo[1].defaultVariant.id,
        },
      ),
    );
    at(15000, const WsEvent(type: WsEventType.paymentSuccess));
  }

  @override
  void dispose() {
    _cancelTimers();
    _sub?.cancel();
    super.dispose();
  }
}
