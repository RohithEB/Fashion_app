// Customer capture. Everything optional except an auto id; light validation only.
// The mobile form saves a rich, all-optional profile and may fill it across
// multiple partial saves (create once, then PUT to refine).
import * as customers from '../repositories/customers.repo.js';
import * as cart from '../repositories/cart.repo.js';
import { badRequest, notFound } from '../util/errors.js';
import { logger } from '../util/logger.js';

// Onboarding option lists — both apps render these; kept server-side so they can
// evolve without a client release. Every field remains optional.
const ONBOARDING_OPTIONS = {
  genders: ['Female', 'Male', 'Non-binary', 'Prefer not to say'],
  ageRanges: ['Under 18', '18-24', '25-34', '35-44', '45-54', '55+'],
  personalities: ['Classic', 'Minimalist', 'Trendsetter', 'Bold', 'Romantic', 'Sporty'],
};

export function getOnboardingOptions() {
  return ONBOARDING_OPTIONS;
}

const STRING_FIELDS = [
  'name', 'mobile', 'gender', 'ageRange', 'personality',
  'currentOutfit', 'styling', 'wearingColor', 'occasion',
  'dateOfBirth', 'occupation', 'preferredFit', 'topSize', 'bottomSize',
  'shoeSize', 'budgetRange', 'notes',
];
const LIST_FIELDS = [
  'fashionStyles', 'favoriteColors', 'preferredBrands',
  'favoriteCategories', 'preferredFabrics',
];

// Build a clean, storable object from a request body, keeping ONLY the keys that
// were actually present (so a partial PUT never clobbers untouched fields).
function normalize(body = {}, { partial = false } = {}) {
  if (body.age != null && body.age !== '' && Number.isNaN(Number(body.age))) {
    throw badRequest('age must be a number');
  }
  const out = {};
  const take = (key) => partial ? key in body : true;

  for (const f of STRING_FIELDS) {
    if (take(f)) {
      const v = body[f];
      out[f] = typeof v === 'string' ? (v.trim() || null) : (v ?? null);
    }
  }
  for (const f of LIST_FIELDS) {
    if (take(f)) {
      out[f] = Array.isArray(body[f])
        ? body[f].map((s) => `${s}`.trim()).filter(Boolean)
        : [];
    }
  }
  if (take('age')) out.age = body.age == null || body.age === '' ? null : Number(body.age);
  if (take('isRepeatCustomer')) out.isRepeatCustomer = !!body.isRepeatCustomer;
  return out;
}

export function createCustomer(body = {}) {
  const clean = normalize(body, { partial: false });
  const customer = customers.createCustomer(clean);

  // Optionally link the customer to the session's cart so the journey ties together.
  if (body.sessionId) cart.getOrCreateCart(body.sessionId, customer.id);

  logger.info(
    `[customer] created ${customer.id}` +
    `${customer.name ? ` "${customer.name}"` : ''}` +
    ` fields=[${Object.keys(clean).filter((k) => nonEmpty(clean[k])).join(',')}]` +
    `${body.sessionId ? ` session=${body.sessionId}` : ''}`,
  );
  return customer;
}

// Partial upsert of an existing customer — only the provided fields change.
export function updateCustomer(id, body = {}) {
  const patch = normalize(body, { partial: true });
  const updated = customers.updateCustomer(id, patch);
  if (!updated) throw notFound('Customer not found');
  if (body.sessionId) cart.getOrCreateCart(body.sessionId, updated.id);

  logger.info(`[customer] updated ${id} changed=[${Object.keys(patch).join(',')}]`);
  return updated;
}

const nonEmpty = (v) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0) && v !== false;

export function getCustomer(id) {
  const c = customers.getCustomer(id);
  if (!c) throw notFound('Customer not found');
  return c;
}
