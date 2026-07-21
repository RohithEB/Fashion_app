import { Listenable } from '../../core/listenable';
import { CustomerRepository } from '../../data/customerRepository';
import { Customer, OnboardingOptions } from '../../models/customer';

/// Owns the post-pairing onboarding. Every field is optional; completion tracked
/// per session id so a new pairing re-prompts. Ported 1:1 from `OnboardingController`.
export class OnboardingController extends Listenable {
  options = OnboardingOptions.empty;
  optionsLoading = false;
  submitting = false;
  error: string | null = null;
  customer: Customer | null = null;
  private completedForSessionId: string | null = null;

  constructor(private readonly repo: CustomerRepository) {
    super();
    void this.loadOptions();
  }

  isCompletedFor(sessionId: string | null | undefined): boolean {
    return sessionId != null && this.completedForSessionId === sessionId;
  }

  async loadOptions(): Promise<void> {
    this.optionsLoading = true;
    this.notifyListeners();
    this.options = await this.repo.options();
    this.optionsLoading = false;
    this.notifyListeners();
  }

  async submit(opts: { sessionId: string | null; draft: Customer }): Promise<boolean> {
    this.error = null;
    if (opts.draft.isEmpty) {
      this.skip(opts.sessionId);
      return true;
    }
    this.submitting = true;
    this.notifyListeners();
    try {
      const created = await this.repo.create(opts.draft, { sessionId: opts.sessionId ?? undefined });
      if (created == null) {
        this.error = 'Could not save the guest profile. Try again or skip.';
        this.submitting = false;
        this.notifyListeners();
        return false;
      }
      this.customer = created;
      this.completedForSessionId = opts.sessionId;
      this.submitting = false;
      this.notifyListeners();
      return true;
    } catch {
      this.error = 'Could not save the guest profile. Try again or skip.';
      this.submitting = false;
      this.notifyListeners();
      return false;
    }
  }

  /// Set the active in-session guest locally (no network).
  updateProfile(next: Customer): void {
    this.customer = next;
    this.notifyListeners();
  }

  async persistProfileUpdate(draft: Customer, opts?: { sessionId?: string }): Promise<boolean> {
    this.submitting = true;
    this.notifyListeners();
    try {
      const saved = await this.repo.update(draft, opts);
      this.customer = saved ?? draft;
      this.submitting = false;
      this.notifyListeners();
      return saved != null;
    } catch {
      this.customer = draft;
      this.submitting = false;
      this.notifyListeners();
      return false;
    }
  }

  skip(sessionId: string | null): void {
    this.customer = null;
    this.completedForSessionId = sessionId;
    this.error = null;
    this.notifyListeners();
  }
}
