# Fashion Showroom — Master Project TODO

> Hierarchical, module-grouped backlog. Continuously updated as development
> progresses. Legend:
> **Priority:** 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low
> **Status:** ⬜ Pending · 🔄 In Progress · ✅ Completed · ⛔ Blocked
> **Complexity:** S (small) · M (medium) · L (large)
>
> Architecture note: per client direction this is a **two-app Flutter setup**
> (`frontend/mobile_app`, `frontend/display_app`) with a simple, clean per-app
> structure — **no shared packages**. The luxury design system, models, and
> services live inside each app under `lib/core`, `lib/models`, `lib/data`.

---

## 1. Project Setup
| ID | Task | Pri | Status | Deps | Complexity | Notes |
|----|------|-----|--------|------|-----------|-------|
| SET-01 | Git repo + GitHub remote (`RohithEB/Fashion_app`) | 🔴 | ✅ | — | S | main branch, no commits yet |
| SET-02 | `flutter create` mobile_app + display_app (android/ios/web) | 🔴 | ✅ | SET-01 | S | org com.ebanitech |
| SET-03 | Add core deps (provider, go_router, google_fonts, material_symbols_icons, web_socket_channel; +mobile_scanner / +qr_flutter) | 🔴 | ✅ | SET-02 | S | done both apps |
| SET-04 | Per-app `lib/` structure (core/features/widgets/models/data) | 🔴 | 🔄 | SET-02 | S | in progress |
| SET-05 | Strict analysis_options / lint per app | 🟡 | ⬜ | SET-02 | S | |
| SET-06 | .gitignore hardening (build, secrets, keystores) | 🟡 | ✅ | SET-01 | S | root .gitignore present |

## 2. Design System (per app, `lib/core/theme`)
| ID | Task | Pri | Status | Deps | Complexity | Notes |
|----|------|-----|--------|------|-----------|-------|
| DS-01 | Color tokens (semantic, light + dark) `AppColors` | 🔴 | ⬜ | SET-04 | M | ivory/ink/champagne |
| DS-02 | Typography (Cormorant Garamond + Inter) `AppTypography` | 🔴 | ⬜ | SET-04 | S | |
| DS-03 | Spacing / Radius / Elevation / Motion / Sizes tokens | 🔴 | ⬜ | SET-04 | S | 8pt system |
| DS-04 | Iconography (`AppIcons` — Material Symbols Rounded) | 🟠 | ⬜ | SET-04 | S | |
| DS-05 | Material 3 `ThemeData` (all component themes) | 🔴 | ⬜ | DS-01..04 | M | one central theme |
| DS-06 | Core components: AppButton, AppScaffold, state views | 🟠 | ⬜ | DS-05 | M | |
| DS-07 | Product card, category card, chips, quantity/variant selectors | 🟠 | ⬜ | DS-06 | M | |
| DS-08 | Dialogs, bottom sheets, success dialog, skeleton/shimmer | 🟡 | ⬜ | DS-06 | M | |

## 3. Models & Mock Data (`lib/models`, `lib/data`)
| ID | Task | Pri | Status | Deps | Complexity | Notes |
|----|------|-----|--------|------|-----------|-------|
| MOD-01 | Money value object | 🔴 | ⬜ | SET-04 | S | minor units |
| MOD-02 | Product, ProductVariant, ProductMedia, Category | 🔴 | ⬜ | MOD-01 | M | AI enrichment fields |
| MOD-03 | Cart, CartItem, Order, PaymentResult | 🔴 | ⬜ | MOD-01 | M | |
| MOD-04 | Salesperson, Session, PairingInfo | 🔴 | ⬜ | SET-04 | S | |
| MOD-05 | DisplayState (sealed presentation state) | 🔴 | ⬜ | MOD-02 | M | drives TV FSM |
| MOD-06 | WS event protocol (envelope + typed events) | 🔴 | ⬜ | MOD-02 | M | see §14 |
| MOD-07 | Seeded luxury catalog (mock enriched products + media) | 🟠 | ⬜ | MOD-02 | M | shared JSON/const |

## 4. Backend Integration Placeholders / API Layer / Repositories
| ID | Task | Pri | Status | Deps | Complexity | Notes |
|----|------|-----|--------|------|-----------|-------|
| API-01 | `ApiClient` interface (HTTP) — stub impl | 🟠 | ⬜ | MOD-* | S | swap for real later |
| API-02 | CatalogRepository (interface + MockCatalogRepository) | 🔴 | ⬜ | MOD-07 | M | hydrate/search/detail |
| API-03 | CartRepository / OrderRepository (mock) | 🟠 | ⬜ | MOD-03 | M | server-side totals mocked |
| API-04 | AuthRepository (mock login) | 🟠 | ⬜ | MOD-04 | S | |
| API-05 | PaymentGateway abstraction + FakeGateway | 🟠 | ⬜ | MOD-03 | S | |
| API-06 | Repositories wired via provider DI | 🔴 | ⬜ | API-02..05 | S | |

## 5. Navigation
| ID | Task | Pri | Status | Deps | Complexity | Notes |
|----|------|-----|--------|------|-----------|-------|
| NAV-01 | mobile_app go_router (login → home → detail → cart → checkout) | 🔴 | ⬜ | DS-05 | M | guards on auth/pairing |
| NAV-02 | display_app router driven by DisplayState/FSM | 🔴 | ⬜ | MOD-05 | M | not user-navigable |
| NAV-03 | Premium page transitions (fade/shared-axis) | 🟡 | ⬜ | NAV-01 | S | |

## 6. Screen Connection · QR Pairing · WebSocket · Session
| ID | Task | Pri | Status | Deps | Complexity | Notes |
|----|------|-----|--------|------|-----------|-------|
| CON-01 | `RealtimeService` interface (connect/emit/stream events) | 🔴 | ⬜ | MOD-06 | M | transport-agnostic |
| CON-02 | MockRealtimeService (in-app loopback/simulated) | 🔴 | ⬜ | CON-01 | M | UI-first, no server |
| CON-03 | Real WS client (`web_socket_channel`) impl | 🟠 | ⬜ | CON-01 | M | reconnect + heartbeat |
| CON-04 | Display: boot → open WS → get pairingToken → render QR | 🔴 | ⬜ | CON-01 | M | QR = pair url+token |
| CON-05 | Mobile: scan QR (`mobile_scanner`) → parse → `pair` event | 🔴 | ⬜ | CON-01 | M | |
| CON-06 | Server-side bind → `paired {sessionId, displayId}` to both | 🔴 | ⬜ | CON-02 | M | mocked in loopback |
| CON-07 | Session lifecycle: connecting → loading → welcome | 🔴 | ⬜ | CON-06 | S | |
| CON-08 | Idle timeout (10 min) → `session_warning` → `session_end` | 🟠 | ⬜ | CON-07 | M | grace + keep_alive |
| CON-09 | Disconnect / re-pair handling both apps | 🟠 | ⬜ | CON-07 | M | |

## 7. Display App (Customer TV)
| ID | Task | Pri | Status | Deps | Complexity | Notes |
|----|------|-----|--------|------|-----------|-------|
| DIS-01 | Splash | 🟠 | ⬜ | DS-05 | S | |
| DIS-02 | Advertisement / idle loop | 🟠 | ⬜ | DS-05 | M | auto-cycling hero content |
| DIS-03 | Waiting + QR screen | 🔴 | ⬜ | CON-04 | M | luxury pairing screen |
| DIS-04 | Connecting + Loading | 🔴 | ⬜ | CON-07 | S | |
| DIS-05 | Welcome ("connected with {name}") | 🔴 | ⬜ | CON-07 | S | |
| DIS-06 | Product presentation (hero) | 🔴 | ⬜ | MOD-05 | L | renders from cache |
| DIS-07 | Gallery view | 🟠 | ⬜ | DIS-06 | M | |
| DIS-08 | Video view | 🟠 | ⬜ | DIS-06 | M | placeholder → video_player later |
| DIS-09 | Colorway / variant showcase | 🟠 | ⬜ | DIS-06 | M | |
| DIS-10 | Checkout success + Thank You (60s timer) | 🟠 | ⬜ | CON-07 | S | |
| DIS-11 | TV responsive layout (4K/landscape) + D-pad focus | 🟡 | ⬜ | DS-05 | M | |

## 8. Mobile App (Salesperson)
| ID | Task | Pri | Status | Deps | Complexity | Notes |
|----|------|-----|--------|------|-----------|-------|
| MOB-01 | Login | 🟠 | ⬜ | API-04 | S | |
| MOB-02 | Available screens / pairing entry + QR scanner | 🔴 | ⬜ | CON-05 | M | |
| MOB-03 | Home / catalog + search + categories + filters (private) | 🔴 | ⬜ | API-02 | L | |
| MOB-04 | Product detail (variants, media, AI highlights) | 🔴 | ⬜ | API-02 | L | |
| MOB-05 | "Show on Screen" → enter Presentation mode | 🔴 | ⬜ | CON-01 | M | pins presented product |
| MOB-06 | Presentation controller UI (what customer sees + controls) | 🔴 | ⬜ | MOB-05 | L | zoom/pan/gallery/color/video |
| MOB-07 | Cart-as-display-selector (touch item → present it) | 🔴 | ⬜ | MOD-03 | L | key differentiator |
| MOB-08 | Cart management (qty/size/color/remove/totals) | 🟠 | ⬜ | API-03 | M | |
| MOB-09 | Checkout summary | 🟠 | ⬜ | API-03 | M | |
| MOB-10 | Payment (fake gateway) + success | 🟠 | ⬜ | API-05 | M | |
| MOB-11 | One-handed POS ergonomics pass | 🟡 | ⬜ | MOB-03 | M | large targets |

## 9. Live Presentation Synchronization
| ID | Task | Pri | Status | Deps | Complexity | Notes |
|----|------|-----|--------|------|-----------|-------|
| SYN-01 | Presentation-mode session state (both apps) | 🔴 | ⬜ | MOB-05 | M | gate for sync |
| SYN-02 | Image zoom sync (`zoomImage`) | 🔴 | ⬜ | SYN-01 | M | throttled |
| SYN-03 | Image pan sync (`panImage`) + reset (`resetZoom`) | 🔴 | ⬜ | SYN-02 | M | |
| SYN-04 | Gallery change sync (`changeImage`) | 🟠 | ⬜ | SYN-01 | S | |
| SYN-05 | Color/size change sync (`changeColor`,`changeSize`) | 🟠 | ⬜ | SYN-01 | M | |
| SYN-06 | Video sync (`playVideo`,`pauseVideo`,`seekVideo`,`muteVideo`) | 🟠 | ⬜ | DIS-08 | M | |
| SYN-07 | AI highlights sync (`showAIHighlights`) | 🟡 | ⬜ | SYN-01 | S | |
| SYN-08 | Related media sync (`showRelatedMedia`) | 🟡 | ⬜ | SYN-01 | S | |
| SYN-09 | Rotate 360° (`rotateProduct`) — future-ready hook | ⚪ | ⬜ | SYN-01 | L | stub now |
| SYN-10 | Event throttling / coalescing utility | 🟠 | ⬜ | CON-01 | S | high-freq gestures |

## 10. Commerce Sync
| ID | Task | Pri | Status | Deps | Complexity | Notes |
|----|------|-----|--------|------|-----------|-------|
| COM-01 | Cart update sync (`updateCart`) | 🟡 | ⬜ | MOB-08 | S | optional on-screen |
| COM-02 | Checkout / paymentSuccess events → Thank You | 🟠 | ⬜ | MOB-10 | S | |

## 11. Cross-Cutting
| ID | Task | Pri | Status | Deps | Complexity | Notes |
|----|------|-----|--------|------|-----------|-------|
| CC-01 | Error handling (typed failures, snackbars, retry) | 🟠 | ⬜ | DS-06 | M | |
| CC-02 | Loading / empty / skeleton states everywhere | 🟠 | ⬜ | DS-08 | M | |
| CC-03 | Offline caching (catalog) | 🟡 | ⬜ | API-02 | M | |
| CC-04 | Analytics facade (no-op) | ⚪ | ⬜ | — | S | |
| CC-05 | Logger facade | ⚪ | ⬜ | — | S | |
| CC-06 | Responsiveness (mobile/tablet/TV) | 🟠 | ⬜ | DS-05 | M | |
| CC-07 | Accessibility (contrast, targets, semantics, TV focus) | 🟡 | ⬜ | DS-05 | M | |

## 12. Quality / Testing / Performance
| ID | Task | Pri | Status | Deps | Complexity | Notes |
|----|------|-----|--------|------|-----------|-------|
| QA-01 | Widget tests for key components | 🟡 | ⬜ | DS-06 | M | |
| QA-02 | Unit tests (money, protocol codec, repositories) | 🟡 | ⬜ | MOD-* | M | |
| QA-03 | Golden tests for premium screens | ⚪ | ⬜ | DIS-*, MOB-* | M | |
| QA-04 | Performance pass (const, image caching, rebuild scope) | 🟡 | ⬜ | — | M | |

## 13. Documentation · GitHub · CI/CD · Release
| ID | Task | Pri | Status | Deps | Complexity | Notes |
|----|------|-----|--------|------|-----------|-------|
| DOC-01 | REQUIREMENTS.md (incl. Live Sync) | 🔴 | ✅ | — | M | maintained |
| DOC-02 | PROJECT_TODO.md (this file) | 🔴 | ✅ | — | S | living doc |
| DOC-03 | README (run instructions, architecture overview) | 🟠 | ⬜ | SET-04 | S | |
| DOC-04 | Architecture.md / FolderStructure.md | 🟡 | ⬜ | SET-04 | M | |
| DOC-05 | GitHub issue + PR templates | 🟡 | ⬜ | SET-01 | S | |
| DOC-06 | CI (analyze + test) GitHub Action | ⚪ | ⬜ | QA-* | S | |
| DOC-07 | Initial commit + push to main (needs client OK) | 🟠 | ⬜ | DOC-03 | S | confirm before push |

---

### Current focus (highest-priority open)
1. **SET-04** per-app lib structure → **DS-01..05** design system → **MOD-01..07** models/mock.
2. **CON-01/02** realtime service + **CON-04/05** QR pairing → display + mobile connect flow.
3. **DIS-03..06 / MOB-02..07** core screens → **SYN-01..05** live sync.
