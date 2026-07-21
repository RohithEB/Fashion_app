/// The signed-in sales associate. Ported from the Flutter mobile `Salesperson`.
export class Salesperson {
  readonly id: string;
  readonly name: string;
  readonly title?: string;
  /// Login handle returned by the auth API; used to pre-fill the profile.
  readonly username?: string;

  constructor(init: { id: string; name: string; title?: string; username?: string }) {
    this.id = init.id;
    this.name = init.name;
    this.title = init.title;
    this.username = init.username;
  }

  static fromJson(json: any): Salesperson {
    return new Salesperson({
      id: json.id as string,
      name: json.name as string,
      title: json.title as string | undefined,
      username: json.username as string | undefined,
    });
  }

  toJson(): Record<string, any> {
    const out: Record<string, any> = { id: this.id, name: this.name, title: this.title ?? null };
    if (this.username != null) out.username = this.username;
    return out;
  }
}

/// Parsed content of a pairing QR code:
/// `http://<box-ip>:<port>/pair?token=<pairingToken>`.
export class PairingInfo {
  readonly host: string;
  readonly port: number;
  readonly token: string;

  constructor(init: { host: string; port: number; token: string }) {
    this.host = init.host;
    this.port = init.port;
    this.token = init.token;
  }

  static tryParse(raw: string): PairingInfo | null {
    let uri: URL;
    try {
      uri = new URL(raw.trim());
    } catch {
      return null;
    }
    const token = uri.searchParams.get('token');
    if (token == null || token.length === 0) return null;
    const port = uri.port ? parseInt(uri.port, 10) : 8080;
    return new PairingInfo({ host: uri.hostname, port, token });
  }

  get wsUrl(): string {
    return `ws://${this.host}:${this.port}/ws`;
  }
}

/// An active showroom session binding a salesperson to a display.
export class SessionInfo {
  readonly sessionId: string;
  readonly displayId: string;
  readonly salesperson: Salesperson;

  constructor(init: { sessionId: string; displayId: string; salesperson: Salesperson }) {
    this.sessionId = init.sessionId;
    this.displayId = init.displayId;
    this.salesperson = init.salesperson;
  }
}
