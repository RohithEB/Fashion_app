import { AppConfig } from '../config/appConfig';
import { Salesperson } from '../models/session';

/// A thrown auth failure carrying a human-readable message from the backend.
export class AuthException extends Error {}

/// The result of a successful register/login.
export class AuthResult {
  readonly salesperson: Salesperson;
  readonly token: string;
  constructor(init: { salesperson: Salesperson; token: string }) {
    this.salesperson = init.salesperson;
    this.token = init.token;
  }
  static fromJson(json: any): AuthResult {
    return new AuthResult({
      salesperson: Salesperson.fromJson(json.salesperson),
      token: json.token as string,
    });
  }
}

export interface AuthRepository {
  register(opts: { name: string; title?: string; username: string; password: string }): Promise<AuthResult>;
  login(opts: { username: string; password: string }): Promise<AuthResult>;
  /// Best-effort server-side token revocation. Never throws.
  logout(token: string): Promise<void>;
}

/// AuthRepository backed by the Node backend (`/api/auth/*`). Ported 1:1.
export class HttpAuthRepository implements AuthRepository {
  private static readonly timeoutMs = 8000;

  async register(opts: { name: string; title?: string; username: string; password: string }): Promise<AuthResult> {
    const body: Record<string, any> = { name: opts.name, username: opts.username, password: opts.password };
    if (opts.title != null && opts.title.trim().length > 0) body.title = opts.title.trim();
    return this.post('/api/auth/register', body);
  }

  login(opts: { username: string; password: string }): Promise<AuthResult> {
    return this.post('/api/auth/login', { username: opts.username, password: opts.password });
  }

  async logout(token: string): Promise<void> {
    try {
      await this.fetchTimeout(AppConfig.http('/api/auth/logout'), {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
      });
    } catch {
      // Logout is best-effort; the client clears local state regardless.
    }
  }

  private async fetchTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), HttpAuthRepository.timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(t);
    }
  }

  private async post(path: string, body: Record<string, any>): Promise<AuthResult> {
    let res: Response;
    try {
      res = await this.fetchTimeout(AppConfig.http(path), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new AuthException('Could not reach the server. Check the connection.');
    }
    const json = await res.json().catch(() => ({}));
    if (res.status === 200 || res.status === 201) {
      return AuthResult.fromJson(json);
    }
    const err = json.error;
    const message =
      err != null && typeof err === 'object' ? (err.message as string) ?? 'Authentication failed' : 'Authentication failed';
    throw new AuthException(message);
  }
}

/// Offline/demo auth: accepts any credentials and returns a synthetic associate.
export class MockAuthRepository implements AuthRepository {
  async register(opts: { name: string; title?: string; username: string; password: string }): Promise<AuthResult> {
    return new AuthResult({
      salesperson: new Salesperson({ id: `mock_${opts.username}`, name: opts.name, title: opts.title, username: opts.username }),
      token: `mock-token-${opts.username}`,
    });
  }

  async login(opts: { username: string; password: string }): Promise<AuthResult> {
    return new AuthResult({
      salesperson: new Salesperson({
        id: `mock_${opts.username}`,
        name: opts.username.length === 0 ? 'Associate' : opts.username,
        title: 'Studio Associate',
        username: opts.username,
      }),
      token: `mock-token-${opts.username}`,
    });
  }

  async logout(): Promise<void> {}
}
