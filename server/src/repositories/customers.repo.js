import { getDb } from '../db/index.js';
import { uuid, nowIso } from '../util/ids.js';

export function createCustomer({ name = null, mobile = null, gender = null, age = null } = {}) {
  const id = uuid();
  const createdAt = nowIso();
  getDb().prepare(
    `INSERT INTO customers (id, name, mobile, gender, age, createdAt)
     VALUES (@id, @name, @mobile, @gender, @age, @createdAt)`
  ).run({ id, name, mobile, gender, age: age == null ? null : Number(age), createdAt });
  return getCustomer(id);
}

export function getCustomer(id) {
  return getDb().prepare('SELECT * FROM customers WHERE id = ?').get(id);
}
