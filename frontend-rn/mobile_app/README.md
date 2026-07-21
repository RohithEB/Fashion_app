# mobile_app (React Native / Expo)

A 1:1 React Native port of the Flutter **mobile_app** — the salesperson controller /
POS that pairs to a display and drives the showroom over WebSocket. Built with Expo
(SDK 57) + `react-native-web`, so the same codebase runs in the **web view** and as a
native Android/iOS build.

## Architecture (identical to the Flutter app)

```
src/
  config/appConfig.ts            backend host/port (persisted via AsyncStorage)
  theme/                         colors, typography, tokens, icons, ThemeProvider (light)
  models/                        money, product, category, session, wsEvent, presentationState,
                                 cart, customer (+options), order
  data/                          CatalogRepository (HTTP + bundled) · authRepository ·
                                 checkoutRepository · customerRepository · journeyLogger · backendDto
  realtime/                      RealtimeService + BackendControllerRealtime (WS, protocol translator)
  core/                          Listenable (ChangeNotifier) + useListenable hooks
  features/
    auth/                        AuthController + Login / Register screens
    connection/                  ConnectionController + Connect (QR) screen + idle watcher/overlay
    onboarding/                  OnboardingController + Onboarding screen
    catalog/                     CatalogController + Home screen
    product/                     ProductDetailScreen (gallery, draggable details sheet,
                                 colour/size, fullscreen pinch-zoom, live sync controls)
    cart/                        CartController + Cart screen
    checkout/                    Checkout + PaymentSuccess screens
    customer/                    CustomerDirectoryController + CustomerProfile screen + CustomerForm
    recommendations/             Recommendations screen (backend /api/recommendations)
    presentation/                PresentationController + LivePreview + NowShowingBar
    profile/                     Profile screen
    settings/                    ServerSettingsSheet
  app/                           providers (DI graph) · RootNavigator (guards) · MobileApp · restart
```

Layered exactly like the Flutter source (`repositories → controllers → screens`), driven
by realtime events per [`../../PROTOCOL.md`](../../PROTOCOL.md). `ChangeNotifier` controllers
became `Listenable` stores consumed through `useListenable` / `useListenableSelector`
(`useSyncExternalStore`). `go_router`'s redirect guards became React Navigation conditional
screen groups (**log in → pair a display → capture the guest → browse**).

## Backend connection (mandatory)

`AppConfig.backendMode` is always on (host/port configurable via the in-app *Server settings*).
All data + realtime go through the Node server on the box, verified against the server source:

- **Auth:** `POST /api/auth/register|login|logout` (bearer token persisted).
- **Catalogue (CMS-fed):** `GET /api/products`, `/api/products/:id`, `/api/categories`,
  `/api/recommendations`, `/api/talking-point`.
- **Customers:** `GET /api/customers/options`, `POST /api/customers`, `PUT /api/customers/:id`.
- **Checkout:** `POST /api/cart/:sessionId/checkout`. **Journey:** `POST /api/journey`.
- **Realtime:** `ws://<box>:3000/ws?role=controller` — translates the app's rich event
  vocabulary to the frozen `PROTOCOL.md` command set (`pair`, `show_product`, `show_cart`,
  `show_recommendations`, `show_details`, `show_related`, `zoom`, `scroll`, `clear`, `keep_alive`).

## Run

```bash
npm install
npm run web        # web view (react-native-web)
npm run android    # native Android
npm run ios        # native iOS
```

Start the Node `server/` first. On a real device open *Server settings* and set the server
PC's LAN IP.

## Verified statically (not run, per request)

- `npx tsc --noEmit` — clean.
- `npx expo export --platform web` — bundles with no resolution/asset errors.
- All HTTP/WS endpoints checked against `server/src/http/routes/*` and `server/src/ws/protocol.js`.

## Known web-view caveats

- **QR scanning** uses `expo-camera`; browsers with no camera fall back to the manual
  pairing-URL field in the scan sheet.
- **Confirmation dialogs** on the Profile screen use `Alert` (native). On web these degrade
  to a basic browser prompt — swap for a `Modal` if richer web confirms are needed. Core flow
  (login → pair → onboard → browse → present → cart → checkout) does not depend on them.
