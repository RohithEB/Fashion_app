import AsyncStorage from '@react-native-async-storage/async-storage';

/// App configuration and the backend/standalone mode switch. Ported from the
/// Flutter mobile `AppConfig`.
///
/// Backend mode is **mandatory** in this deployment (the showcase server + the
/// realtime WebSocket run on the box), so only the host/port are configurable.
/// Runtime overrides come from the in-app *Server settings* sheet and are
/// persisted with AsyncStorage; `load()` must run before the app renders.

const K_BACKEND = 'cfg.backend';
const K_HOST = 'cfg.host';
const K_PORT = 'cfg.port';

const ENV_BACKEND = true;
const ENV_HOST = '10.0.1.45'; // the box
const ENV_PORT = 3000;

let backendOverride: boolean | null = null;
let hostOverride: string | null = null;
let portOverride: number | null = null;

export const AppConfig = {
  /// Backend mode is mandatory; a stored override can never drop it to offline.
  get backendMode(): boolean {
    return ENV_BACKEND || (backendOverride ?? false);
  },
  get backendHost(): string {
    return hostOverride ?? ENV_HOST;
  },
  get backendPort(): number {
    return portOverride ?? ENV_PORT;
  },

  /// Load persisted server settings. Call once before rendering.
  async load(): Promise<void> {
    try {
      const [b, h, p] = await Promise.all([
        AsyncStorage.getItem(K_BACKEND),
        AsyncStorage.getItem(K_HOST),
        AsyncStorage.getItem(K_PORT),
      ]);
      if (b != null) backendOverride = b === 'true';
      if (h != null && h.trim().length > 0) hostOverride = h.trim();
      if (p != null) {
        const n = parseInt(p, 10);
        if (!Number.isNaN(n)) portOverride = n;
      }
    } catch {
      // start from defaults
    }
  },

  /// Persist server settings. The app root is restarted after saving so the
  /// repositories re-resolve.
  async save(opts: { backend: boolean; host: string; port?: number | null }): Promise<void> {
    backendOverride = opts.backend;
    const trimmed = opts.host.trim();
    hostOverride = trimmed.length === 0 ? null : trimmed;
    portOverride = opts.port ?? null;

    await AsyncStorage.setItem(K_BACKEND, opts.backend ? 'true' : 'false');
    if (hostOverride != null) await AsyncStorage.setItem(K_HOST, hostOverride);
    else await AsyncStorage.removeItem(K_HOST);
    if (opts.port != null) await AsyncStorage.setItem(K_PORT, `${opts.port}`);
    else await AsyncStorage.removeItem(K_PORT);
  },

  /// Clear all overrides and fall back to the defaults.
  async clear(): Promise<void> {
    backendOverride = null;
    hostOverride = null;
    portOverride = null;
    await AsyncStorage.multiRemove([K_BACKEND, K_HOST, K_PORT]);
  },

  /// Build an HTTP URL against the backend.
  http(path: string, query?: Record<string, any>): string {
    const qs =
      query != null
        ? '?' +
          Object.entries(query)
            .filter(([, v]) => v != null)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(`${v}`)}`)
            .join('&')
        : '';
    return `http://${this.backendHost}:${this.backendPort}${path}${qs}`;
  },

  /// The realtime endpoint for a given role.
  ws(role: string): string {
    return `ws://${this.backendHost}:${this.backendPort}/ws?role=${encodeURIComponent(role)}`;
  },

  /// Absolutize a possibly-relative media path (`/media/...`) served by the box.
  media(pathOrUrl: string, host?: string): string {
    if (pathOrUrl.startsWith('http')) return pathOrUrl;
    const h = host ?? this.backendHost;
    return `http://${h}:${this.backendPort}${pathOrUrl}`;
  },
};
