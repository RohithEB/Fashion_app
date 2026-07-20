  # Box Deployment — Handoff / Control Guide

  > Read this first. It describes the **server-on-the-box** deployment, what was built,
  > and the exact commands to control everything from any laptop. Point a fresh Claude
  > Code agent at this file and it can take over.

  ---

  ## 1. Architecture in one picture

  ```
          ANDROID BOX  (VirtuBox_K2_V1 · RK356x · Android 11 · arm64)  IP 10.0.1.45
          ┌───────────────────────────────────────────────────────────┐
          │  Termux → Node v26.x                                        │
          │    express (HTTP :3000)  +  ws (WebSocket /ws)              │
          │    better-sqlite3 (compiled for arm64)                     │
          │    SQLite DB + media files on box disk  = source of truth   │
          │    runs offline; internet only for optional catalog ingest │
          └───────────────┬───────────────────────┬───────────────────┘
                  ws + http (LAN)          ws + http (LAN)
                ┌──────────┴─────┐        ┌────────┴──────────┐
                │ TV / box screen│        │  Phone / tablet   │
                │  display_app   │        │   mobile_app      │
                │ (WS client)    │        │ (controller,WS)   │
                └────────────────┘        └───────────────────┘
  ```

  - **The box IS the server.** Node + express + ws + SQLite all run in **one process on the box**, not on any laptop. Laptops are remote controls for dev/deploy only.
  - **Apps are clients.** They connect to `ws://10.0.1.45:3000/ws` and `http://10.0.1.45:3000/api/*`. Built with `BACKEND=true` and `BACKEND_HOST=10.0.1.45`.
  - **Offline-first.** During a live session everything reads from the box's SQLite + local media. Needs a LAN (same WiFi / the box's own hotspot); does **not** need internet.

  ---

  ## 2. Box facts (memorize these)

  | Thing | Value |
  |---|---|
  | Model / SoC / OS | VirtuBox_K2_V1 · Rockchip RK356x · Android 11 · **arm64-v8a** |
  | Box LAN IP | **10.0.1.45**  (network ADB on `:5555`) |
  | Build type | `userdebug` — `adb root` works; **`su` works from shell without root** |
  | Termux app uid | **10085** (`u0_a85`) — run node/git/npm as this uid |
  | Repo on box | `/data/data/com.termux/files/home/Fashion_app` |
  | Server dir | `…/Fashion_app/server` |
  | SQLite DB (WAL) | `…/Fashion_app/server/data/showcase.sqlite` (+ `-wal`, `-shm`) |
  | Media dir | `…/Fashion_app/media` |
  | Server log | `/data/data/com.termux/files/home/server.log` |
  | Helper scripts (home) | `run-server.sh` (env + `node src/index.js`), `restart.sh` (kill+relaunch) |
  | Node / port | Node v26.x · HOST `0.0.0.0` · PORT `3000` |

  **Termux env prelude** (needed whenever you run node/npm/git as uid 10085 by hand):
  ```sh
  export PREFIX=/data/data/com.termux/files/usr
  export HOME=/data/data/com.termux/files/home
  export PATH=$PREFIX/bin:$PATH
  export LD_PRELOAD=$PREFIX/lib/libtermux-exec.so
  export TMPDIR=$PREFIX/tmp
  ```

  ---

  ## 3. What a laptop needs to control this

  | To… | Needs |
  |---|---|
  | Manage the box server (restart, logs, pull) | **adb** (Android platform-tools) + LAN access to 10.0.1.45 |
  | Pull / push code | **git** |
  | Rebuild + install the apps | **Flutter SDK + Android SDK + adb** |

  Local Dart here is **3.11.0**; pubspec pins **^3.11.1**. For `flutter build`/`dart analyze`, relax → run → restore:
  ```sh
  sed -i 's/sdk: \^3.11.1/sdk: ^3.11.0/' frontend/mobile_app/pubspec.yaml
  # ...build or analyze...
  sed -i 's/sdk: \^3.11.0/sdk: ^3.11.1/' frontend/mobile_app/pubspec.yaml
  ```

  ---

  ## 4. Daily control — command reference

  All commands run from a laptop. On Git Bash prefix remote paths with `MSYS_NO_PATHCONV=1` to stop path mangling.

  **Connect + health**
  ```sh
  adb connect 10.0.1.45:5555
  curl http://10.0.1.45:3000/api/health          # {"status":"ok","products":36}
  ```

  **Restart the server** (one command — uses the helper on the box)
  ```sh
  adb -s 10.0.1.45:5555 shell su 10085 sh /data/data/com.termux/files/home/restart.sh
  ```

  **Watch logs live** (request middleware + flow trace lines)
  ```sh
  adb -s 10.0.1.45:5555 shell su 10085 tail -f /data/data/com.termux/files/home/server.log
  ```
  You'll see e.g. `[customer] created … fields=[…]`, `[customer] updated … changed=[…]`,
  `[recommendations] signals=[…] -> N picks top="…"(score=…)`.

  **Deploy new backend code to the box** (git is the source of truth)
  ```sh
  adb -s 10.0.1.45:5555 shell su 10085 sh -c '
    export PREFIX=/data/data/com.termux/files/usr HOME=/data/data/com.termux/files/home
    export PATH=$PREFIX/bin:$PATH LD_PRELOAD=$PREFIX/lib/libtermux-exec.so TMPDIR=$PREFIX/tmp
    cd $HOME/Fashion_app && git pull && cd server && npm install --no-audit --no-fund'
  # then restart (command above)
  ```

  **Build + install the mobile controller app** (phone must be in `adb devices`)
  ```sh
  cd frontend/mobile_app
  # (relax SDK pin — see §3)
  flutter build apk --debug --dart-define=BACKEND=true --dart-define=BACKEND_HOST=10.0.1.45
  adb -s <PHONE_ID> install -r build/app/outputs/flutter-apk/app-debug.apk
  adb -s <PHONE_ID> shell monkey -p com.ebanitech.mobile_app -c android.intent.category.LAUNCHER 1
  # (restore SDK pin)
  ```
  Display app (only if `display_app` changed): same, in `frontend/display_app`, package
  `com.ebanitech.display_app`, install onto the box (`-s 10.0.1.45:5555`).
  There is also `scripts/run-backend.ps1` which does both apps — pass `-BackendHost 10.0.1.45`.

  ---

  ## 5. Gotchas learned the hard way

  - **ADB drops mid-command** during long ops. Run long tasks *detached on the box*
    (`setsid sh script.sh > log 2>&1 </dev/null &`) and poll the log; re-`adb connect` after drops.
  - **`su` works without `adb root`.** Prefer `su 10085` — avoids `adb root` restarting adbd
    (which drops the connection). Only use `adb root` to kill root-owned leftovers:
    `adb -s 10.0.1.45:5555 shell su root sh -c 'pkill -9 -f node'`.
  - **Server survives via wakelock**, and the node process is reparented to init (PPID 1) so it
    survives ADB disconnects. Re-arm the wakelock if the box was power-cycled: `termux-wake-lock`.
  - **No boot auto-start yet.** If the box **reboots**, run `restart.sh` (§4). (Proper fix =
    install Termux:Boot APK — blocked by the sideload verifier earlier; verifier is now disabled.)
  - **Sideloading APKs**: Play Protect verifier is already disabled on the box
    (`verifier_verify_adb_installs=0`, `package_verifier_enable=0`), so `adb install -r <apk>` works.
  - **better-sqlite3 native build** (only if reinstalling deps): needs `pkg install python make clang`
    and `export GYP_DEFINES="android_ndk_path="`; if npm skips the build script, run node-gyp directly:
    `node $PREFIX/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js rebuild --release`
    inside `node_modules/better-sqlite3`.
  - **One deployer at a time.** The box runs ONE server; coordinate pull+restart between laptops.
  - **App IP is baked in.** APKs point at `10.0.1.45`. On a different network the box gets a new IP →
    rebuild apps with the new `BACKEND_HOST` (or change it in the app's in-app Server settings).

  ---

  ## 6. What was built in this deployment

  **Server moved on-box** — Termux + Node + repo + arm64 `better-sqlite3` compiled and running;
  `/api/health` reachable over LAN; offline-capable.

  **Customer profile feature (backend + frontend)**
  - `customers` table: added `dateOfBirth, occupation, preferredFit, topSize, bottomSize, shoeSize,
    budgetRange, notes, isRepeatCustomer, updatedAt` + JSON-array columns `fashionStyles,
    favoriteColors, preferredBrands, favoriteCategories, preferredFabrics` (idempotent migration in
    `server/src/db/index.js`).
  - **`PUT /api/customers/:id`** — partial upsert; only provided fields change, so the associate can
    fill the form across multiple saves. `POST /api/customers` accepts the full profile.
  - Frontend: `customer_repository` (full create + PUT update), `onboarding_controller`
    (`persistProfileUpdate`), `customer_profile_screen` (edit→PUT), `http_catalog_repository`
    (sends `hints` to recommendations).

  **Recommendations** (`server/src/services/catalog.service.js`)
  - Scores products against the **full** profile (gender, ageGroup, personality→styleArchetype,
    occasion, fit, colours, categories, fabrics, brands, styles, budget) + free-text `hints`.
  - **Synonym normalization** bridges the customer-form vocab and the CMS product vocab
    (e.g. Wedding→Formal/Party, Smart Casual/Luxury→Sophisticated/Elegant, Navy→blue).
  - `GET /api/recommendations?customerId=…&hints=…&limit=…` returns `matchScore` + `matchReasons`.

  **Logging** — flow trace via the logger (`[customer] created/updated`, `[recommendations] …`) on top
  of the existing request-logger middleware.

  **CMS** — the add-products form + API already capture every enrichment attribute the matching uses;
  nothing was missing. `BOX_API_URL=http://10.0.1.45:3000` added to `cms/.env.example` (template) and
  `cms/env.local`.

  **Bug fixed** — `server/src/db/seed.js` referenced an undefined `img()` (crashed a fresh seed); added
  the `/media/ph` placeholder-URL helper.

  ---

  ## 7. Security TODO (not done yet)
  - `cms/env.local` (tracked, no leading dot) contains **real R2 keys** in a **public repo** — rotate
    the keys and `git rm --cached cms/env.local`; keep secrets only in a real `.env.local` (dot,
    gitignored). Next.js loads `.env.local` (with the dot), not `env.local`.
