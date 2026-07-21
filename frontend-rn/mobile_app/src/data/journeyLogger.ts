import { AppConfig } from '../config/appConfig';

/// Fire-and-forget salesperson clickstream logger (backend mode only). Records
/// controller-side actions that don't pass through the WS relay so the CMS
/// activity log is a complete journey. Ported 1:1 from `JourneyLogger`.
export class JourneyLogger {
  log(opts: {
    eventType: string;
    token?: string | null;
    sessionId?: string;
    refId?: string;
    meta?: Record<string, any>;
  }): void {
    if (!AppConfig.backendMode || opts.token == null || opts.token.length === 0) return;
    const body: Record<string, any> = { eventType: opts.eventType };
    if (opts.sessionId != null) body.sessionId = opts.sessionId;
    if (opts.refId != null) body.refId = opts.refId;
    if (opts.meta != null) body.meta = opts.meta;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    void fetch(AppConfig.http('/api/journey'), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.token}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
      .catch(() => undefined)
      .finally(() => clearTimeout(t));
  }
}
