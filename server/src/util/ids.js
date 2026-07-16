import { randomUUID, randomBytes } from 'node:crypto';

export const uuid = () => randomUUID();

// Short, URL-safe token for pairing (shown inside the QR).
export const pairingToken = () => randomBytes(9).toString('base64url');

// Prefixed short id for readable seed rows, e.g. prefixId('prod') -> 'prod_a1b2c3'.
export const prefixId = (prefix) => `${prefix}_${randomBytes(4).toString('hex')}`;

export const nowIso = () => new Date().toISOString();
