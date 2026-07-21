# display_app (React Native / Expo)

A 1:1 React Native port of the Flutter **display_app** — the customer-facing
showroom screen that runs on the Android box's TV and renders whatever the
salesperson presents. Built with Expo (SDK 57) + `react-native-web`, so the same
codebase runs in the **web view** and as a native Android/iOS build.

## Architecture (identical to the Flutter app)

```
src/
  config/appConfig.ts          box-as-server / backend mode switch, HTTP + WS URLs
  theme/                       colors, typography, spacing/sizes/radius/motion, icons, ThemeProvider
  models/                      money, product, category, session, wsEvent, presentationState, cart
  data/                        CatalogRepository (interface) + HTTP / bundled repos + backendDto
  realtime/                    RealtimeService + DisplayRealtime (stub) + BackendDisplayRealtime (WS)
  features/display/
    displayController.ts       the phase state-machine (ChangeNotifier → Listenable + hook)
    DisplayContext.tsx         provider + useDisplayController / useDisplaySelector
    DisplayShell.tsx           phase → screen switcher with a cinematic cross-fade
    screens/                   splash · advertisement · waiting · connecting · loading · welcome ·
                               catalog · cart · checkout · presentation · thankYou
  widgets/                     NetworkPhoto · PriceTag · AppButton · StateViews · WelcomeVideo
  app/DisplayApp.tsx           font loading + theme + provider + shell
```

Layered the same way as the Flutter source: `repositories → services → screens`,
driven by realtime events per [`../../PROTOCOL.md`](../../PROTOCOL.md). No screen
mirroring — the display renders a `ProductPresentation` reduced from WebSocket events.

## Backend connection (default)

`AppConfig.backendMode` defaults to **true** — the deployed box-as-server topology.

- **Catalogue (HTTP, CMS-fed):** `GET /api/products`, `/api/products/:id`,
  `/api/categories` on the Node server (`server/`), same shapes as the Flutter app.
- **Realtime (WebSocket):** `ws://<box>:3000/ws?role=display`. Handles
  `display_registered`, `paired`, `show_product`, `show_catalog`, `show_cart`,
  `show_recommendations`, `show_details`, `show_related`, `scroll`, `zoom`,
  `clear`, `session_end` — the frozen protocol relayed by the server.
- **Media/placeholders:** `/media/*` and on-device `/media/ph` placeholders.

On the web build the host is resolved from the serving origin (the box), so when
the Node server serves this app they are same-origin. Overrides:
`?host=10.0.1.45&port=3000`, or `?backend=0` for the bundled offline snapshot.

## Run

```bash
npm install
npm run web        # web view (react-native-web)
npm run android    # native Android (the box)
npm run ios        # native iOS
```

Start the Node server (`server/`, `npm start`) first so the catalogue and realtime
channel are live.

## Verified statically

- `npx tsc --noEmit` — clean.
- `npx expo export --platform web` — bundles with no resolution/asset errors.

The WS message types and HTTP response shapes were checked against
`server/src/ws/protocol.js` and `server/src/http/routes/catalog.routes.js`.
