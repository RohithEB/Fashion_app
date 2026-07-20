import { getDb } from '../db/index.js';
import { uuid, nowIso } from '../util/ids.js';

// Scalar profile columns (stored as-is) and list columns (stored as JSON strings).
const SCALAR_FIELDS = [
  'name', 'mobile', 'gender', 'age', 'ageRange', 'personality',
  'currentOutfit', 'styling', 'wearingColor', 'occasion',
  'dateOfBirth', 'occupation', 'preferredFit', 'topSize', 'bottomSize',
  'shoeSize', 'budgetRange', 'notes',
];
const LIST_FIELDS = [
  'fashionStyles', 'favoriteColors', 'preferredBrands',
  'favoriteCategories', 'preferredFabrics',
];

// Turn a stored row into the API shape: JSON list columns → arrays, the flag → bool.
function hydrate(row) {
  if (!row) return row;
  const out = { ...row };
  for (const f of LIST_FIELDS) {
    try { out[f] = row[f] ? JSON.parse(row[f]) : []; }
    catch { out[f] = []; }
  }
  out.isRepeatCustomer = !!row.isRepeatCustomer;
  return out;
}

// Coerce a single field's incoming value to its storable form.
function serializeField(field, value) {
  if (LIST_FIELDS.includes(field)) {
    const arr = Array.isArray(value) ? value.filter((v) => v != null && `${v}`.trim() !== '') : [];
    return JSON.stringify(arr);
  }
  if (field === 'age') return value == null || value === '' ? null : Number(value);
  if (field === 'isRepeatCustomer') return value ? 1 : 0;
  return value == null ? null : value;
}

export function createCustomer(data = {}) {
  const id = uuid();
  const createdAt = nowIso();
  const cols = ['id', 'createdAt', 'isRepeatCustomer', ...SCALAR_FIELDS, ...LIST_FIELDS];
  const row = { id, createdAt, isRepeatCustomer: serializeField('isRepeatCustomer', data.isRepeatCustomer) };
  for (const f of [...SCALAR_FIELDS, ...LIST_FIELDS]) {
    row[f] = f in data ? serializeField(f, data[f]) : (LIST_FIELDS.includes(f) ? JSON.stringify([]) : null);
  }
  const placeholders = cols.map((c) => `@${c}`).join(', ');
  getDb()
    .prepare(`INSERT INTO customers (${cols.join(', ')}) VALUES (${placeholders})`)
    .run(row);
  return getCustomer(id);
}

// Partial update: only the provided fields are written. Idempotent + repeatable,
// so the associate can fill parts of the profile across multiple saves (PUT).
export function updateCustomer(id, patch = {}) {
  const existing = getDb().prepare('SELECT id FROM customers WHERE id = ?').get(id);
  if (!existing) return null;

  const sets = [];
  const params = { id, updatedAt: nowIso() };
  const updatable = [...SCALAR_FIELDS, ...LIST_FIELDS, 'isRepeatCustomer'];
  for (const f of updatable) {
    if (f in patch) {
      sets.push(`${f} = @${f}`);
      params[f] = serializeField(f, patch[f]);
    }
  }
  sets.push('updatedAt = @updatedAt');
  getDb().prepare(`UPDATE customers SET ${sets.join(', ')} WHERE id = @id`).run(params);
  return getCustomer(id);
}

export function getCustomer(id) {
  return hydrate(getDb().prepare('SELECT * FROM customers WHERE id = ?').get(id));
}
