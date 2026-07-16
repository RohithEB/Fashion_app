import { test, expect } from '@playwright/test';
import WebSocket from 'ws';

const PORT = process.env.E2E_PORT || '3100';
const WS_URL = (role) => `ws://127.0.0.1:${PORT}/ws?role=${role}`;

// Thin client that buffers messages and lets tests await a specific type.
class Client {
  constructor(role) {
    this.ws = new WebSocket(WS_URL(role));
    this.messages = [];
    this.ws.on('message', (raw) => this.messages.push(JSON.parse(raw.toString())));
  }
  open() {
    return new Promise((res, rej) => {
      this.ws.on('open', res);
      this.ws.on('error', rej);
    });
  }
  send(type, sessionId, payload = {}) {
    this.ws.send(JSON.stringify({ type, sessionId, payload }));
  }
  waitFor(type, timeout = 8000) {
    return new Promise((resolve, reject) => {
      const found = this.messages.find((m) => m.type === type);
      if (found) return resolve(found);
      const t = setTimeout(() => reject(new Error(`timeout waiting for ${type}`)), timeout);
      this.ws.on('message', (raw) => {
        const m = JSON.parse(raw.toString());
        if (m.type === type) { clearTimeout(t); resolve(m); }
      });
    });
  }
  close() { try { this.ws.close(); } catch { /* ignore */ } }
}

async function pair() {
  const display = new Client('display');
  await display.open();
  const reg = await display.waitFor('display_registered');
  const token = reg.payload.pairingToken;

  const controller = new Client('controller');
  await controller.open();
  controller.send('pair', null, { pairingToken: token });
  const paired = await controller.waitFor('paired');
  return { display, controller, token, sessionId: paired.payload.sessionId };
}

test.describe('WebSocket pairing + relay', () => {
  test('display registers and receives a pairing token + QR', async () => {
    const display = new Client('display');
    await display.open();
    const reg = await display.waitFor('display_registered');
    expect(reg.payload.pairingToken).toBeTruthy();
    expect(reg.payload.controllerUrl).toContain('token=');
    expect(reg.payload.qrDataUrl).toContain('data:image/png;base64');
    display.close();
  });

  test('controller pairs and both sides get paired', async () => {
    const { display, controller, sessionId } = await pair();
    expect(sessionId).toBeTruthy();
    const displayPaired = await display.waitFor('paired');
    expect(displayPaired.payload.sessionId).toBe(sessionId);
    display.close();
    controller.close();
  });

  test('invalid pairing token returns an error', async () => {
    const controller = new Client('controller');
    await controller.open();
    controller.send('pair', null, { pairingToken: 'nope' });
    const err = await controller.waitFor('error');
    expect(err.payload.message).toMatch(/invalid|expired/i);
    controller.close();
  });

  test('show_product relays controller -> display', async () => {
    const { display, controller, sessionId } = await pair();
    controller.send('show_product', sessionId, { productId: 'prod_123' });
    const relayed = await display.waitFor('show_product');
    expect(relayed.payload.productId).toBe('prod_123');
    display.close();
    controller.close();
  });

  test('show_related relays with mediaId', async () => {
    const { display, controller, sessionId } = await pair();
    controller.send('show_related', sessionId, { productId: 'prod_1', mediaId: 'med_9' });
    const relayed = await display.waitFor('show_related');
    expect(relayed.payload.mediaId).toBe('med_9');
    display.close();
    controller.close();
  });
});

test.describe('Session idle lifecycle', () => {
  // e2e server runs with IDLE_MS=3000, GRACE_MS=2000.
  test('idle -> warning -> end, and display re-arms with a new QR', async () => {
    const { display, controller } = await pair();

    const warning = await controller.waitFor('session_warning', 8000);
    expect(warning.payload.secondsLeft).toBeGreaterThan(0);

    const end = await controller.waitFor('session_end', 8000);
    expect(end.payload.reason).toBe('timeout');

    // Display gets a fresh registration so the TV shows a new QR for the next user.
    const reRegister = await display.waitFor('display_registered', 8000);
    expect(reRegister.payload.pairingToken).toBeTruthy();

    display.close();
    controller.close();
  });

  test('keep_alive during grace cancels the end', async () => {
    const { display, controller, sessionId } = await pair();
    await controller.waitFor('session_warning', 8000);
    controller.send('keep_alive', sessionId, {});

    // After keep_alive, no session_end should arrive within the old grace window.
    let ended = false;
    controller.waitFor('session_end', 3000).then(() => { ended = true; }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2500));
    expect(ended).toBe(false);

    display.close();
    controller.close();
  });
});
