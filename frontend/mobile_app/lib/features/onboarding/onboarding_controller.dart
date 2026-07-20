import 'package:flutter/foundation.dart';

import '../../data/customer_repository.dart';
import '../../models/customer.dart';

/// Owns the post-pairing onboarding: loads the backend option lists and captures
/// the guest for the current session. Every field is optional — the associate
/// can submit a partial profile or skip entirely and still proceed to the
/// catalogue. Completion is tracked per session id so a new pairing re-prompts.
class OnboardingController extends ChangeNotifier {
  OnboardingController(this._repo) {
    loadOptions();
  }

  final CustomerRepository _repo;

  OnboardingOptions options = OnboardingOptions.empty;
  bool optionsLoading = false;
  bool submitting = false;
  String? error;

  Customer? customer;
  String? _completedForSessionId;

  /// True when onboarding is done for [sessionId] (drives the router guard).
  bool isCompletedFor(String? sessionId) =>
      sessionId != null && _completedForSessionId == sessionId;

  Future<void> loadOptions() async {
    optionsLoading = true;
    notifyListeners();
    options = await _repo.options();
    optionsLoading = false;
    notifyListeners();
  }

  /// Capture the guest and mark onboarding complete for [sessionId]. If nothing
  /// was entered this behaves like [skip] (no pointless empty record). Returns
  /// true when the flow may advance; false only when a save was attempted and
  /// failed (so the associate can retry or skip).
  /// Only the fields the customers API supports are POSTed; the richer styling
  /// preferences on [draft] are merged back onto the saved record and live for
  /// the duration of the shopping session.
  Future<bool> submit({
    required String? sessionId,
    required Customer draft,
  }) async {
    error = null;
    if (draft.isEmpty) {
      skip(sessionId);
      return true;
    }

    submitting = true;
    notifyListeners();
    try {
      // The whole profile is persisted now (all fields optional), so the record
      // the API returns is complete — no client-side field merge needed.
      final Customer? created = await _repo.create(draft, sessionId: sessionId);
      if (created == null) {
        error = 'Could not save the guest profile. Try again or skip.';
        submitting = false;
        notifyListeners();
        return false;
      }
      customer = created;
      _completedForSessionId = sessionId;
      submitting = false;
      notifyListeners();
      return true;
    } catch (_) {
      error = 'Could not save the guest profile. Try again or skip.';
      submitting = false;
      notifyListeners();
      return false;
    }
  }

  /// Set the active in-session guest **locally** (switching to a saved profile,
  /// or starting a blank draft). No network — recommendations sharpen at once.
  void updateProfile(Customer next) {
    customer = next;
    notifyListeners();
  }

  /// Persist a partial edit of the active guest to the backend: PUTs only the
  /// changed fields (falls back to a create if there's no server id yet), so the
  /// associate can fill the form across multiple saves. Returns true on a
  /// successful persist; the in-session profile updates either way so
  /// recommendations still sharpen even if the network hiccups.
  Future<bool> persistProfileUpdate(Customer draft, {String? sessionId}) async {
    submitting = true;
    notifyListeners();
    try {
      final Customer? saved = await _repo.update(draft, sessionId: sessionId);
      customer = saved ?? draft;
      submitting = false;
      notifyListeners();
      return saved != null;
    } catch (_) {
      customer = draft;
      submitting = false;
      notifyListeners();
      return false;
    }
  }

  /// Proceed without saving a profile.
  void skip(String? sessionId) {
    customer = null;
    _completedForSessionId = sessionId;
    error = null;
    notifyListeners();
  }
}
