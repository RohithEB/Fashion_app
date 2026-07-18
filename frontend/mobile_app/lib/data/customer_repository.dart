import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/config/app_config.dart';
import '../models/customer.dart';

/// Customer onboarding data access: the option lists and customer capture.
/// Swapped for [MockCustomerRepository] in standalone mode.
abstract interface class CustomerRepository {
  Future<OnboardingOptions> options();

  Future<Customer?> create({
    String? name,
    String? mobile,
    String? gender,
    String? ageRange,
    String? personality,
    String? currentOutfit,
    String? styling,
    String? wearingColor,
    String? occasion,
    String? sessionId,
  });
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

  @override
  Future<Customer?> create({
    String? name,
    String? mobile,
    String? gender,
    String? ageRange,
    String? personality,
    String? currentOutfit,
    String? styling,
    String? wearingColor,
    String? occasion,
    String? sessionId,
  }) async {
    final Map<String, dynamic> body = <String, dynamic>{
      if (_has(name)) 'name': name!.trim(),
      if (_has(mobile)) 'mobile': mobile!.trim(),
      if (_has(gender)) 'gender': gender,
      if (_has(ageRange)) 'ageRange': ageRange,
      if (_has(personality)) 'personality': personality,
      if (_has(currentOutfit)) 'currentOutfit': currentOutfit!.trim(),
      if (_has(styling)) 'styling': styling!.trim(),
      if (_has(wearingColor)) 'wearingColor': wearingColor!.trim(),
      if (_has(occasion)) 'occasion': occasion!.trim(),
      if (_has(sessionId)) 'sessionId': sessionId,
    };
    final http.Response res = await _client
        .post(
          AppConfig.http('/api/customers'),
          headers: <String, String>{'content-type': 'application/json'},
          body: jsonEncode(body),
        )
        .timeout(_timeout);
    if (res.statusCode != 200 && res.statusCode != 201) {
      throw Exception('Failed to save customer (${res.statusCode})');
    }
    return Customer.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  bool _has(String? v) => v != null && v.trim().isNotEmpty;
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
  Future<Customer?> create({
    String? name,
    String? mobile,
    String? gender,
    String? ageRange,
    String? personality,
    String? currentOutfit,
    String? styling,
    String? wearingColor,
    String? occasion,
    String? sessionId,
  }) async => Customer(
    id: 'mock_customer',
    name: name,
    mobile: mobile,
    gender: gender,
    ageRange: ageRange,
    personality: personality,
    currentOutfit: currentOutfit,
    styling: styling,
    wearingColor: wearingColor,
    occasion: occasion,
  );
}
