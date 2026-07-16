import 'dart:async';

import 'package:flutter/foundation.dart';

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
  DisplayController(this._realtime, this._catalog) {
    _sub = _realtime.events.listen(_handle);
    _boot();
  }

  final RealtimeService _realtime;
  final CatalogRepository _catalog;
  StreamSubscription<WsEvent>? _sub;

  /// Seconds the Thank-You screen stays before returning to idle. Spec: 60s;
  /// shortened for the POC demo.
  static const int thankYouSeconds = 15;

  /// The pairing link encoded in the on-screen QR. In production the
  /// Android-hosted server issues this with the device IP + a fresh token.
  final String pairingUrl = 'http://192.168.1.42:8080/pair?token=DEMO-8421';

  List<Product> _cache = <Product>[];

  DisplayPhase phase = DisplayPhase.splash;
  ProductPresentation? presentation;
  Product? product;
  String salespersonName = '';
  int thankYouCountdown = thankYouSeconds;

  Timer? _phaseTimer;
  Timer? _countdownTimer;

  Future<void> _boot() async {
    _cache = await _catalog.products(); // hydrate + cache the catalog
    _phaseTimer = Timer(const Duration(milliseconds: 2200), () {
      phase = DisplayPhase.advertisement;
      notifyListeners();
      _phaseTimer = Timer(const Duration(seconds: 6), _toWaiting);
    });
  }

  void _toWaiting() {
    _cancelTimers();
    phase = DisplayPhase.waiting;
    presentation = null;
    product = null;
    salespersonName = '';
    notifyListeners();
  }

  void _handle(WsEvent e) {
    switch (e.type) {
      case WsEventType.connectScreen:
        salespersonName =
            (e.payload['salespersonName'] as String?) ?? 'your advisor';
        _runConnectFlow();
      case WsEventType.showProduct:
        _showProduct(e);
      case WsEventType.hideProduct:
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

  void _showProduct(WsEvent e) {
    final Product? found =
        _cache.where((Product p) => p.id == e.productId).firstOrNull;
    if (found == null) return;
    product = found;
    presentation = ProductPresentation(
      productId: found.id,
      variantId: e.variantId ?? found.defaultVariant.id,
    );
    phase = DisplayPhase.presenting;
    notifyListeners();
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

  void _cancelTimers() {
    _phaseTimer?.cancel();
    _countdownTimer?.cancel();
  }

  /// Standalone showcase: injects a scripted session so the display animates
  /// through every screen without a physical mobile controller. Used from the
  /// waiting screen for demos; no-op if a real transport is wired.
  void startDemoSession() {
    final RealtimeService rt = _realtime;
    if (rt is! MockRealtimeService) return;
    final List<Product> demo = _cache.take(3).toList();
    if (demo.isEmpty) return;

    void at(int ms, WsEvent event) =>
        Timer(Duration(milliseconds: ms), () => rt.inject(event));

    at(0, WsEvent(
      type: WsEventType.connectScreen,
      payload: const <String, dynamic>{'salespersonName': 'Éléonore'},
    ));
    at(3200, WsEvent(
      type: WsEventType.showProduct,
      payload: <String, dynamic>{
        'productId': demo[0].id,
        'variantId': demo[0].defaultVariant.id,
      },
    ));
    at(5200, const WsEvent(
      type: WsEventType.showAIHighlights,
      payload: <String, dynamic>{'visible': true},
    ));
    if (demo[0].variants.length > 1) {
      at(7600, WsEvent(
        type: WsEventType.changeColor,
        payload: <String, dynamic>{'variantId': demo[0].variants[1].id},
      ));
    }
    at(10000, const WsEvent(
      type: WsEventType.changeImage,
      payload: <String, dynamic>{'imageIndex': 1},
    ));
    at(12400, WsEvent(
      type: WsEventType.showProduct,
      payload: <String, dynamic>{
        'productId': demo[1].id,
        'variantId': demo[1].defaultVariant.id,
      },
    ));
    at(15000, const WsEvent(type: WsEventType.paymentSuccess));
  }

  @override
  void dispose() {
    _cancelTimers();
    _sub?.cancel();
    super.dispose();
  }
}
