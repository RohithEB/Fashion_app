import { AppConfig } from '../config/appConfig';
import { Customer, OnboardingOptions } from '../models/customer';

/// Customer onboarding data access: option lists + customer capture. Ported 1:1
/// from the Flutter mobile `CustomerRepository`.
export interface CustomerRepository {
  options(): Promise<OnboardingOptions>;
  create(draft: Customer, opts?: { sessionId?: string }): Promise<Customer | undefined>;
  update(draft: Customer, opts?: { sessionId?: string }): Promise<Customer | undefined>;
}

export class HttpCustomerRepository implements CustomerRepository {
  private static readonly timeoutMs = 8000;

  private async fetchTimeout(url: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), HttpCustomerRepository.timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(t);
    }
  }

  async options(): Promise<OnboardingOptions> {
    try {
      const res = await this.fetchTimeout(AppConfig.http('/api/customers/options'));
      if (res.status !== 200) return OnboardingOptions.empty;
      return OnboardingOptions.fromJson(await res.json());
    } catch {
      return OnboardingOptions.empty;
    }
  }

  async create(draft: Customer, opts?: { sessionId?: string }): Promise<Customer | undefined> {
    const res = await this.fetchTimeout(AppConfig.http('/api/customers'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(this.body(draft, opts?.sessionId)),
    });
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Failed to save customer (${res.status})`);
    }
    return Customer.fromJson(await res.json());
  }

  async update(draft: Customer, opts?: { sessionId?: string }): Promise<Customer | undefined> {
    if (draft.id.length === 0 || draft.id === 'draft') {
      // No server id yet — fall back to a create so nothing is lost.
      return this.create(draft, opts);
    }
    const res = await this.fetchTimeout(AppConfig.http(`/api/customers/${draft.id}`), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(this.body(draft, opts?.sessionId)),
    });
    if (res.status !== 200) throw new Error(`Failed to update customer (${res.status})`);
    return Customer.fromJson(await res.json());
  }

  private body(draft: Customer, sessionId?: string): Record<string, any> {
    const body = draft.toJson();
    if (sessionId != null && sessionId.length > 0) body.sessionId = sessionId;
    return body;
  }
}

/// Offline/demo customer capture.
export class MockCustomerRepository implements CustomerRepository {
  async options(): Promise<OnboardingOptions> {
    return new OnboardingOptions({
      genders: ['Female', 'Male', 'Non-binary', 'Prefer not to say'],
      ageRanges: ['Under 18', '18-24', '25-34', '35-44', '45-54', '55+'],
      personalities: ['Classic', 'Minimalist', 'Trendsetter', 'Bold', 'Romantic', 'Sporty'],
    });
  }

  async create(draft: Customer): Promise<Customer | undefined> {
    return draft.id.length === 0 || draft.id === 'draft' ? draft.copyWith({ id: 'mock_customer' }) : draft;
  }

  async update(draft: Customer): Promise<Customer | undefined> {
    return draft;
  }
}
