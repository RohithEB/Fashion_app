// Data access for salesperson credentials + bearer tokens. Pure SQL.
import { getDb } from '../db/index.js';
import { prefixId, nowIso } from '../util/ids.js';

export function createSalesperson({ name, title = null, username, passwordHash, passwordSalt }) {
  const id = prefixId('sp');
  const createdAt = nowIso();
  getDb().prepare(
    `INSERT INTO salespeople (id, name, title, username, passwordHash, passwordSalt, createdAt)
     VALUES (@id, @name, @title, @username, @passwordHash, @passwordSalt, @createdAt)`
  ).run({ id, name, title, username, passwordHash, passwordSalt, createdAt });
  return getSalespersonById(id);
}

export function getSalespersonById(id) {
  return getDb().prepare('SELECT * FROM salespeople WHERE id = ?').get(id);
}

export function getSalespersonByUsername(username) {
  return getDb().prepare('SELECT * FROM salespeople WHERE username = ?').get(username);
}

// ─── Bearer tokens ─────────────────────────────────────────────────
export function createToken(token, salespersonId) {
  getDb().prepare(
    'INSERT INTO auth_tokens (token, salespersonId, createdAt) VALUES (?, ?, ?)'
  ).run(token, salespersonId, nowIso());
  return token;
}

// Resolve a token to its salesperson row (or undefined).
export function getSalespersonByToken(token) {
  return getDb().prepare(
    `SELECT s.* FROM salespeople s
     JOIN auth_tokens t ON t.salespersonId = s.id
     WHERE t.token = ?`
  ).get(token);
}

export function deleteToken(token) {
  getDb().prepare('DELETE FROM auth_tokens WHERE token = ?').run(token);
}
