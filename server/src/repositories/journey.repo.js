// P2 journey log. Thin insert helper; safe to call from anywhere (best-effort analytics).
import { getDb } from '../db/index.js';
import { uuid, nowIso } from '../util/ids.js';

export function logEvent({ customerId = null, sessionId = null, eventType, refId = null, meta = null }) {
  getDb().prepare(
    `INSERT INTO journey_events (id, customerId, sessionId, ts, eventType, refId, meta)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(uuid(), customerId, sessionId, nowIso(), eventType, refId,
        meta == null ? null : JSON.stringify(meta));
}

export function listEvents({ sessionId, customerId, limit = 200 } = {}) {
  const db = getDb();
  if (sessionId) {
    return db.prepare('SELECT * FROM journey_events WHERE sessionId = ? ORDER BY ts ASC LIMIT ?')
      .all(sessionId, limit);
  }
  if (customerId) {
    return db.prepare('SELECT * FROM journey_events WHERE customerId = ? ORDER BY ts ASC LIMIT ?')
      .all(customerId, limit);
  }
  return db.prepare('SELECT * FROM journey_events ORDER BY ts DESC LIMIT ?').all(limit);
}
