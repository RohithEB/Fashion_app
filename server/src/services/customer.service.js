// Customer capture. Everything optional except an auto id; light validation only.
import * as customers from '../repositories/customers.repo.js';
import * as cart from '../repositories/cart.repo.js';
import { badRequest, notFound } from '../util/errors.js';

export function createCustomer({ name, mobile, gender, age, sessionId } = {}) {
  if (age != null && age !== '' && Number.isNaN(Number(age))) {
    throw badRequest('age must be a number');
  }
  const customer = customers.createCustomer({
    name: name?.trim() || null,
    mobile: mobile?.trim() || null,
    gender: gender?.trim() || null,
    age: age == null || age === '' ? null : Number(age),
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
