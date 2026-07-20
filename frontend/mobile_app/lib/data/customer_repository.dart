import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/config/app_config.dart';
import '../models/customer.dart';

/// Customer onboarding data access: the option lists and customer capture.
/// Swapped for [MockCustomerRepository] in standalone mode.
///
/// [create] persists the full (all-optional) profile once; [update] applies a
/// partial change to an existing record — so the associate can fill parts of the
/// form across multiple saves (sizes now, colours later) without losing anything.
abstract interface class CustomerRepository {
  Future<OnboardingOptions> options();

  Future<Customer?> create(Customer draft, {String? sessionId});

  Future<Customer?> update(Customer draft, {String? sessionId});
}

/// [CustomerRepository] backed by the Node backend (`/api/customers*`).
class HttpCustomerRepository implements CustomerRepository {
  HttpCustomerRepository({http.Client? client})
    : _client = client ?? http.Client();

  final http.Client _client;
  static const Duration _timeout = Duration(seconds: 8);

  @override
  Future<OnboardingOptions> options() async {
    try {
      final http.Response res = await _client
          .get(AppConfig.http('/api/customers/options'))
          .timeout(_timeout);
      if (res.statusCode != 200) return OnboardingOptions.empty;
      return OnboardingOptions.fromJson(
        jsonDecode(res.body) as Map<String, dynamic>,
      );
    } catch (_) {
      return OnboardingOptions.empty;
    }
  }

  /// POST the full profile (partial bodies are fine — every field is optional).
  @override
  Future<Customer?> create(Customer draft, {String? sessionId}) async {
    final Map<String, dynamic> body = _body(draft, sessionId);
    final http.Response res = await _client
        .post(
          AppConfig.http('/api/customers'),
          headers: _jsonHeaders,
          body: jsonEncode(body),
        )
        .timeout(_timeout);
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw Exception('Failed to save customer (${res.statusCode})');
    }
    return Customer.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  /// PUT a partial update onto an existing record. Only the fields present on
  /// [draft] change server-side; untouched fields are preserved.
  @override
  Future<Customer?> update(Customer draft, {String? sessionId}) async {
    if (draft.id.isEmpty || draft.id == 'draft') {
      // No server id yet — fall back to a create so nothing is lost.
      return create(draft, sessionId: sessionId);
    }
    final Map<String, dynamic> body = _body(draft, sessionId);
    final http.Response res = await _client
        .put(
          AppConfig.http('/api/customers/${draft.id}'),
          headers: _jsonHeaders,
          body: jsonEncode(body),
        )
        .timeout(_timeout);
    if (res.statusCode != 200) {
      throw Exception('Failed to update customer (${res.statusCode})');
    }
    return Customer.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  static const Map<String, String> _jsonHeaders = <String, String>{
    'content-type': 'application/json',
  };

  /// The customer's partial JSON plus an optional sessionId link. [Customer.toJson]
  /// already omits null/empty fields, giving us a clean partial body.
  Map<String, dynamic> _body(Customer draft, String? sessionId) {
    final Map<String, dynamic> body = draft.toJson();
    if (sessionId != null && sessionId.isNotEmpty) body['sessionId'] = sessionId;
    return body;
  }
}

/// Offline/demo customer capture: local option lists, synthetic customer id.
class MockCustomerRepository implements CustomerRepository {
  const MockCustomerRepository();

  @override
  Future<OnboardingOptions> options() async => const OnboardingOptions(
    genders: <String>['Female', 'Male', 'Non-binary', 'Prefer not to say'],
    ageRanges: <String>['Under 18', '18-24', '25-34', '35-44', '45-54', '55+'],
    personalities: <String>[
      'Classic',
      'Minimalist',
      'Trendsetter',
      'Bold',
      'Romantic',
      'Sporty',
    ],
  );

  @override
  Future<Customer?> create(Customer draft, {String? sessionId}) async =>
      draft.id.isEmpty || draft.id == 'draft'
      ? draft.copyWith(id: 'mock_customer')
      : draft;

  @override
  Future<Customer?> update(Customer draft, {String? sessionId}) async => draft;
}
