// Customer capture. Everything optional except an auto id; light validation only.
import * as customers from '../repositories/customers.repo.js';
import * as cart from '../repositories/cart.repo.js';
import { badRequest, notFound } from '../util/errors.js';

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

export function createCustomer({
  name, mobile, gender, age, ageRange, personality,
  currentOutfit, styling, wearingColor, occasion, sessionId,
} = {}) {
  if (age != null && age !== '' && Number.isNaN(Number(age))) {
    throw badRequest('age must be a number');
  }
  const customer = customers.createCustomer({
    name: name?.trim() || null,
    mobile: mobile?.trim() || null,
    gender: gender?.trim() || null,
    age: age == null || age === '' ? null : Number(age),
    ageRange: ageRange?.trim() || null,
    personality: personality?.trim() || null,
    currentOutfit: currentOutfit?.trim() || null,
    styling: styling?.trim() || null,
    wearingColor: wearingColor?.trim() || null,
    occasion: occasion?.trim() || null,
  });

  // Optionally link the customer to the session's cart so the journey ties together.
  if (sessionId) cart.getOrCreateCart(sessionId, customer.id);

  return customer;
}

export function getCustomer(id) {
  const c = customers.getCustomer(id);
  if (!c) throw notFound('Customer not found');
  return c;
}
