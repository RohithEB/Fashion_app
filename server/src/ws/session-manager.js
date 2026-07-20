// Owns pairing + one live session per display + the idle/grace lifecycle.
// Transport-agnostic: it's handed `send`/`isOpen` fns so it can be unit-tested without real sockets.
import QRCode from 'qrcode';
import { config } from '../config.js';
import { logger } from '../util/logger.js';
import { prefixId, pairingToken as makeToken, nowIso } from '../util/ids.js';
import { lanIp } from '../util/network.js';
import { IN, OUT, encode } from './protocol.js';
import { logEvent } from '../repositories/journey.repo.js';
import { getSalespersonById } from '../repositories/salespeople.repo.js';

// Controller commands worth journaling as the salesperson's presentation journey.
const JOURNAL_TYPES = {
  [IN.SHOW_CATALOG]: 'catalog_shown',
  [IN.SHOW_CART]: 'cart_shown',
  [IN.SHOW_PRODUCT]: 'product_shown',
  [IN.SHOW_DETAILS]: 'details_toggled',
  [IN.SHOW_RELATED]: 'related_shown',
  [IN.CLEAR]: 'display_cleared',
};

export class SessionManager {
  constructor({ idleMs = config.idleMs, graceMs = config.graceMs } = {}) {
    this.idleMs = idleMs;
    this.graceMs = graceMs;
    this.displays = new Map();  // displayId -> { ws, token, sessionId|null }
    this.tokens = new Map();    // token     -> displayId
    this.sessions = new Map();  // sessionId -> session
  }

  _send(ws, type, sessionId, payload) {
    if (ws && ws.readyState === 1 /* OPEN */) ws.send(encode(type, sessionId, payload));
  }

  // ─── Display registration ────────────────────────────────────────
  async registerDisplay(ws) {
    const displayId = prefixId('disp');
    const token = makeToken();
    this.displays.set(displayId, { ws, token, sessionId: null });
    this.tokens.set(token, displayId);
    ws._role = 'display';
    ws._displayId = displayId;

    const controllerUrl =
      `http://${lanIp()}:${config.port}${config.controllerPath}?token=${token}`;
    let qrDataUrl = null;
    try { qrDataUrl = await QRCode.toDataURL(controllerUrl, { margin: 1, width: 480 }); }
    catch (e) { logger.warn('QR generation failed:', e.message); }

    this._send(ws, OUT.DISPLAY_REGISTERED, null, { displayId, pairingToken: token, controllerUrl, qrDataUrl });
    logger.info(`Display registered ${displayId} -> ${controllerUrl}`);
    return { displayId, token, controllerUrl, qrDataUrl };
  }

  // ─── Pairing ─────────────────────────────────────────────────────
  pair(controllerWs, pairingToken, salespersonId = null, salespersonNameHint = null) {
    const displayId = this.tokens.get(pairingToken);
    const display = displayId && this.displays.get(displayId);
    if (!display) {
      this._send(controllerWs, OUT.ERROR, null, { message: 'Invalid or expired pairing token' });
      return null;
    }
    // One active session per display: end any prior one first.
    if (display.sessionId) this.endSession(display.sessionId, 'superseded');

    const sessionId = prefixId('sess');
    const session = {
      id: sessionId, displayId, displayWs: display.ws, controllerWs, salespersonId,
      warned: false, idleTimer: null, graceTimer: null, createdAt: nowIso(),
    };
    this.sessions.set(sessionId, session);
    display.sessionId = sessionId;
    // consume the token so it can't be reused
    this.tokens.delete(pairingToken);

    controllerWs._role = 'controller';
    controllerWs._sessionId = sessionId;

    // Look up the associate's display name so the screen can greet the guest with
    // it ("You are now connected with <name>") instead of a generic label.
    // Prefer the stored record; fall back to the name the controller sent so the
    // display still greets by name when the id isn't in this box's DB (e.g. the
    // associate signed in against another backend).
    let salespersonName = null;
    if (salespersonId) {
      try { salespersonName = getSalespersonById(salespersonId)?.name ?? null; }
      catch { salespersonName = null; }
    }
    if (!salespersonName && salespersonNameHint) salespersonName = salespersonNameHint;

    this._send(session.displayWs, OUT.PAIRED, sessionId, { sessionId, displayId, salespersonName });
    this._send(session.controllerWs, OUT.PAIRED, sessionId, { sessionId, displayId, salespersonName });
    this._armIdle(session);
    logEvent({ sessionId, salespersonId, eventType: 'session_start', refId: displayId });
    logger.info(`Paired session ${sessionId} (display ${displayId})`);
    return session;
  }

  // ─── Command relay (controller -> display) ───────────────────────
  relay(sessionId, type, payload) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    this._send(session.displayWs, type, sessionId, payload);
    // Record what the salesperson did on the display (the sales journey), so the
    // CMS can replay each associate's presentation strategy.
    const journalType = JOURNAL_TYPES[type];
    if (journalType) {
      logEvent({
        sessionId,
        salespersonId: session.salespersonId,
        eventType: journalType,
        refId: payload?.productId ?? null,
        meta: type === IN.SHOW_DETAILS
          ? { expanded: !!payload?.expanded }
          : (payload?.variantId ? { variantId: payload.variantId } : null),
      });
    }
    this.touch(sessionId); // every command counts as activity
    return true;
  }

  // ─── Idle / grace lifecycle ──────────────────────────────────────
  touch(sessionId) {           // activity or keep_alive -> reset the clock
    const session = this.sessions.get(sessionId);
    if (session) this._armIdle(session);
  }

  _armIdle(session) {
    this._clearTimers(session);
    session.warned = false;
    session.idleTimer = setTimeout(() => this._onIdle(session), this.idleMs);
  }

  _onIdle(session) {
    session.warned = true;
    this._send(session.controllerWs, OUT.SESSION_WARNING, session.id,
      { secondsLeft: Math.round(this.graceMs / 1000) });
    session.graceTimer = setTimeout(() => this.endSession(session.id, 'timeout'), this.graceMs);
    logger.info(`Session ${session.id} idle -> warning`);
  }

  _clearTimers(session) {
    if (session.idleTimer) clearTimeout(session.idleTimer);
    if (session.graceTimer) clearTimeout(session.graceTimer);
    session.idleTimer = session.graceTimer = null;
  }

  // ─── End + re-arm display for the next user ──────────────────────
  async endSession(sessionId, reason = 'ended') {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    this._clearTimers(session);
    this.sessions.delete(sessionId);

    this._send(session.controllerWs, OUT.SESSION_END, sessionId, { reason });
    this._send(session.displayWs, OUT.SESSION_END, sessionId, { reason });
    logEvent({ sessionId, eventType: 'session_end', meta: { reason } });
    logger.info(`Session ${sessionId} ended (${reason})`);

    // Free the display and re-issue a fresh pairing token so the TV shows a new QR.
    const display = this.displays.get(session.displayId);
    if (display) {
      display.sessionId = null;
      if (display.ws && display.ws.readyState === 1) {
        await this.registerDisplay(display.ws); // replaces token + pushes new QR
      } else {
        this.displays.delete(session.displayId);
      }
    }
  }

  // ─── Disconnect handling ─────────────────────────────────────────
  handleDisconnect(ws) {
    if (ws._role === 'display' && ws._displayId) {
      const display = this.displays.get(ws._displayId);
      if (display) {
        if (display.token) this.tokens.delete(display.token);
        if (display.sessionId) this.endSession(display.sessionId, 'display_disconnected');
        this.displays.delete(ws._displayId);
      }
    } else if (ws._role === 'controller' && ws._sessionId) {
      this.endSession(ws._sessionId, 'controller_disconnected');
    }
  }

  getSession(sessionId) { return this.sessions.get(sessionId); }
}
