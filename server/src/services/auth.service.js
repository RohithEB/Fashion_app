// Salesperson auth: register, login, logout, token verification.
// Login gates the controller app; a bearer token is issued on register/login.
import * as salespeople from '../repositories/salespeople.repo.js';
import { hashPassword, verifyPassword, authToken } from '../util/password.js';
import { badRequest, unauthorized, conflict } from '../util/errors.js';

// Shape exposed to the client — never leak the password hash/salt.
function toPublic(row) {
  return { id: row.id, name: row.name, title: row.title || null, username: row.username };
}

export function register({ name, title, username, password } = {}) {
  const cleanName = name?.trim();
  const cleanUsername = username?.trim().toLowerCase();
  if (!cleanName) throw badRequest('name is required');
  if (!cleanUsername) throw badRequest('username is required');
  if (!password || String(password).length < 4) {
    throw badRequest('password must be at least 4 characters');
  }
  if (salespeople.getSalespersonByUsername(cleanUsername)) {
    throw conflict('That username is already taken');
  }

  const { salt, hash } = hashPassword(password);
  const row = salespeople.createSalesperson({
    name: cleanName,
    title: title?.trim() || null,
    username: cleanUsername,
    passwordHash: hash,
    passwordSalt: salt,
  });

  const token = salespeople.createToken(authToken(), row.id);
  return { salesperson: toPublic(row), token };
}

export function login({ username, password } = {}) {
  const cleanUsername = username?.trim().toLowerCase();
  if (!cleanUsername || !password) throw badRequest('username and password are required');

  const row = salespeople.getSalespersonByUsername(cleanUsername);
  if (!row || !verifyPassword(password, row.passwordSalt, row.passwordHash)) {
    throw unauthorized('Invalid username or password');
  }

  const token = salespeople.createToken(authToken(), row.id);
  return { salesperson: toPublic(row), token };
}

export function logout(token) {
  if (token) salespeople.deleteToken(token);
  return { ok: true };
}

// Used by the require-auth middleware. Returns the public salesperson or throws 401.
export function verifyToken(token) {
  if (!token) throw unauthorized('Missing bearer token');
  const row = salespeople.getSalespersonByToken(token);
  if (!row) throw unauthorized('Invalid or expired token');
  return toPublic(row);
}
