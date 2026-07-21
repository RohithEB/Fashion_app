import { Platform } from 'react-native';

/// App configuration and the box-as-server / backend mode switch.
/// Ported 1:1 from the Flutter `AppConfig` (same defaults, URLs and topology).
///
/// * **Backend (DEFAULT):** the Node server on the box owns the catalogue (HTTP,
///   fed from the CMS) and the realtime channel (`ws://<box>:3000/ws`). This is
///   the deployed topology — the box is the server. On the web build the host is
///   resolved from the serving origin (the box), falling back to the LAN IP.
/// * **Box-as-server offline:** pass `?backend=0` on web (or set backendMode
///   false) to fall back to the bundled catalogue snapshot + display loopback.

function webQuery(): URLSearchParams | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search);
  }
  return null;
}

function resolveHost(): string {
  const q = webQuery();
  const override = q?.get('host');
  if (override) return override;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    // Served from the box → same origin is the box. Falls back to the LAN IP.
    return window.location.hostname || '10.0.1.45';
  }
  return '10.0.1.45'; // the box (matches the Flutter default)
}

function resolvePort(): number {
  const q = webQuery();
  const override = q?.get('port');
  if (override) {
    const p = parseInt(override, 10);
    if (!Number.isNaN(p)) return p;
  }
  return 3000; // fixed, matching the Flutter AppConfig default
}

function resolveBackendMode(): boolean {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search);
    if (q.get('backend') === '1' || q.get('backend') === 'true') return true;
    if (q.get('backend') === '0' || q.get('backend') === 'false') return false;
  }
  return true; // backend is the deployed topology (box owns catalogue + realtime)
}

export const AppConfig = {
  backendMode: resolveBackendMode(),
  backendHost: resolveHost(),
  backendPort: resolvePort(),

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
