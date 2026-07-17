// Password hashing with node:crypto scrypt — no external dependency, offline-safe.
import { scryptSync, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

const KEYLEN = 64;

// Returns { salt, hash } (both hex). Store both on the salesperson row.
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(password), salt, KEYLEN).toString('hex');
  return { salt, hash };
}

// Constant-time compare of a candidate password against a stored salt/hash.
export function verifyPassword(password, salt, hash) {
  if (!salt || !hash) return false;
  const candidate = scryptSync(String(password), salt, KEYLEN);
  const known = Buffer.from(hash, 'hex');
  return candidate.length === known.length && timingSafeEqual(candidate, known);
}

// Opaque bearer token (URL-safe) for the auth_tokens table.
export const authToken = () => randomUUID().replace(/-/g, '') + randomBytes(8).toString('hex');
