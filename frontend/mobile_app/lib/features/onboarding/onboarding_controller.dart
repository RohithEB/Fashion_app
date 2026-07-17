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

  bool _hasAny(List<String?> values) =>
      values.any((String? v) => v != null && v.trim().isNotEmpty);

  /// Capture the guest and mark onboarding complete for [sessionId]. If nothing
  /// was entered this behaves like [skip] (no pointless empty record). Returns
  /// true when the flow may advance; false only when a save was attempted and
  /// failed (so the associate can retry or skip).
  Future<bool> submit({
    required String? sessionId,
    String? name,
    String? mobile,
    String? gender,
    String? ageRange,
    String? personality,
  }) async {
    error = null;
    if (!_hasAny(<String?>[name, mobile, gender, ageRange, personality])) {
      skip(sessionId);
      return true;
    }

    submitting = true;
    notifyListeners();
    try {
      customer = await _repo.create(
        name: name,
        mobile: mobile,
        gender: gender,
        ageRange: ageRange,
        personality: personality,
        sessionId: sessionId,
      );
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

  /// Proceed without saving a profile.
  void skip(String? sessionId) {
    customer = null;
    _completedForSessionId = sessionId;
    error = null;
    notifyListeners();
  }
}
