// WebSocket endpoint. Displays connect with ?role=display; controllers with ?role=controller.
// Wires raw socket events to the transport-agnostic SessionManager.
import { WebSocketServer } from 'ws';
import { logger } from '../util/logger.js';
import { SessionManager } from './session-manager.js';
import { IN, OUT, RELAY_TYPES, encode } from './protocol.js';

export function attachWs(httpServer, { manager = new SessionManager() } = {}) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const role = new URL(req.url, 'http://x').searchParams.get('role') || 'controller';

    if (role === 'display') {
      manager.registerDisplay(ws).catch((e) => logger.error('registerDisplay:', e));
    }

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); }
      catch { return ws.send(encode(OUT.ERROR, null, { message: 'Malformed JSON' })); }

      const type = msg?.type;
      const payload = msg?.payload || {};
      const sid = ws._sessionId || msg?.sessionId; // controller's bound session is authoritative

      switch (type) {
        case IN.PAIR:
          manager.pair(ws, payload.pairingToken);
          break;
        case IN.ACTIVITY:
        case IN.KEEP_ALIVE:
          manager.touch(sid);
          break;
        default:
          if (RELAY_TYPES.has(type)) {
            if (!manager.relay(sid, type, payload)) {
              ws.send(encode(OUT.ERROR, sid, { message: 'No active session for command' }));
            }
          } else {
            ws.send(encode(OUT.ERROR, sid, { message: `Unknown message type: ${type}` }));
          }
      }
    });

    ws.on('close', () => manager.handleDisconnect(ws));
    ws.on('error', (e) => logger.warn('WS error:', e.message));
  });

  logger.info('WebSocket server attached at /ws');
  return { wss, manager };
}
