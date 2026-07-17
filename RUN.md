# How to run so data actually SAVES

The Flutter apps have **two modes**:

| Mode | How | Data |
|------|-----|------|
| **Standalone** (default) | `flutter run` with **no** dart-defines | In-memory **mocks** — nothing is saved. This is why the CMS was empty. |
| **Backend** | `flutter run … --dart-define=BACKEND=true` | Reads/writes the **Node server + SQLite** — customers, journey, orders persist and show in the CMS. |

**You must run in BACKEND mode for data to save.**

---

## 1. Start the backend + CMS (each in its own terminal)

```bash
cd server
npm install        # first time only
npm start          # API + WebSocket on http://<host-ip>:3000

cd cms
npm install        # first time only
npm run dev        # CMS admin on http://localhost:4000
```

Find your host LAN IP (the phone/box must be on the same WiFi):
`ipconfig` → the IPv4 like `10.0.1.12`. Call it `BACKEND_HOST`.

## 2. Run the apps in BACKEND mode

**Easiest — one command (Windows):**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-backend.ps1
# or pin the IP: ... run-backend.ps1 -BackendHost 10.0.1.12
```
It auto-detects the host IP + devices, builds both apps with the backend flag, installs the
display on the box and the controller on the phone, and launches them.

**Manual (pick your device with `-d`):**
```bash
# Salesperson / controller app on the phone
cd frontend/mobile_app
flutter run -d <phone-id> --dart-define=BACKEND=true --dart-define=BACKEND_HOST=10.0.1.12

# Customer display app on the box / portrait panel
cd frontend/display_app
flutter run -d 10.0.1.45:5555 --dart-define=BACKEND=true --dart-define=BACKEND_HOST=10.0.1.12
```
(`flutter devices` lists ids.)

## 3. Make data appear in the CMS
- **Salespeople**: create them in the **CMS → Salespeople** page (the admin owns salespeople).
- **Customers**: in the mobile app, **complete the onboarding** (name/mobile) → it `POST`s
  `/api/customers`. Then run a session; the customer + journey show in **CMS → Dashboard**.
- Everything is keyed off the session created at pairing, so pair the phone to the display first.

> Sanity check the DB directly any time:
> `GET http://<host-ip>:3000/api/health` → `{ "status":"ok", "products":36 }`
> CMS APIs: `http://localhost:4000/api/products`, `/api/salespeople`, `/api/analytics`.

---

## ⚠️ If data still isn't saving — RESTART THE SERVER

The #1 gotcha: a **stale server process**. If the Node server was started *before* a code
change (e.g. a new route like `/api/customers/options`), it keeps serving the old code and
new endpoints return **404**, which silently breaks onboarding so no customer is saved.

**Always restart the server after pulling/changing backend code:**
```powershell
# find + kill whatever holds :3000, then start fresh
netstat -ano | findstr :3000        # note the PID
taskkill /PID <pid> /F
cd server ; npm start
```

Verify the endpoints the app depends on actually respond:
```bash
curl http://localhost:3000/api/health              # {"status":"ok","products":36}
curl http://localhost:3000/api/customers/options   # must be 200 (not 404!)
```

Then confirm a save round-trips:
```bash
curl -X POST http://localhost:3000/api/customers -H "content-type: application/json" \
  -d '{"name":"Test","mobile":"9990001111","gender":"Female","ageRange":"25-34"}'
curl http://localhost:4000/api/analytics           # customers count should go up
```

Note: **salespeople** are created in the **CMS → Salespeople** page (the mobile app does not
create them). Create one there and it shows immediately.
