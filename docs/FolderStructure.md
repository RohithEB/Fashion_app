# Folder Structure

Each app follows the same simple, feature-first layout:

```
frontend/<app>/lib/
├─ main.dart                  # entry point
├─ app.dart                   # providers (DI) + MaterialApp + theme
├─ core/
│  ├─ theme/                  # design tokens + Material 3 theme
│  │   app_colors, app_typography, app_spacing, app_radius,
│  │   app_elevation, app_motion, app_sizes, app_icons, app_theme
│  ├─ realtime/               # RealtimeService interface + mock
│  └─ router/                 # go_router config (mobile only)
├─ models/                    # Product, Variant, Media, Cart, Money,
│                             # Session, WsEvent, ProductPresentation
├─ data/                      # CatalogRepository + MockCatalogRepository + seed
├─ features/                  # feature-first: <feature>/<controller + screens>
│  (mobile) auth, connection, catalog, product, cart, checkout, presentation
│  (display) display/ (controller, shell, screens/)
└─ widgets/                   # shared widgets (AppButton, NetworkPhoto, state views)
```

The **shared foundation** (`core/theme`, `models`, `core/realtime`, `data`, and
common `widgets`) is identical across both apps and uses **relative imports only**,
so files stay portable between `mobile_app/` and `display_app/`.
