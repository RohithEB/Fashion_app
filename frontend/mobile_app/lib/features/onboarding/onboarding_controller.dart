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
      final Customer? created = await _repo.create(
        name: draft.name,
        mobile: draft.mobile,
        gender: draft.gender,
        ageRange: draft.ageRange,
        personality: draft.personality,
        currentOutfit: draft.currentOutfit,
        styling: draft.styling,
        wearingColor: draft.wearingColor,
        occasion: draft.occasion,
        sessionId: sessionId,
      );
      if (created == null) {
        error = 'Could not save the guest profile. Try again or skip.';
        submitting = false;
        notifyListeners();
        return false;
      }
      customer = _mergeSessionFields(created, draft);
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

  /// Carry the session-only styling fields from [draft] onto the persisted
  /// [saved] record returned by the API.
  Customer _mergeSessionFields(Customer saved, Customer draft) => saved.copyWith(
    dateOfBirth: draft.dateOfBirth,
    occupation: draft.occupation,
    fashionStyles: draft.fashionStyles,
    favoriteColors: draft.favoriteColors,
    preferredFit: draft.preferredFit,
    topSize: draft.topSize,
    bottomSize: draft.bottomSize,
    shoeSize: draft.shoeSize,
    favoriteCategories: draft.favoriteCategories,
    preferredFabrics: draft.preferredFabrics,
    budgetRange: draft.budgetRange,
    preferredBrands: draft.preferredBrands,
    notes: draft.notes,
    isRepeatCustomer: draft.isRepeatCustomer,
  );

  /// Replace the session's customer profile (used by the Customer Profile page).
  /// Applies immediately so recommendations improve straight away; API-backed
  /// fields are left as saved until an update endpoint exists.
  void updateProfile(Customer next) {
    customer = next;
    notifyListeners();
  }

  /// Proceed without saving a profile.
  void skip(String? sessionId) {
    customer = null;
    _completedForSessionId = sessionId;
    error = null;
    notifyListeners();
  }
}
