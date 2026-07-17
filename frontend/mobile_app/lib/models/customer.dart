/// Onboarding choice lists served by the backend (`GET /api/customers/options`).
/// Both apps render these; kept server-side so they can evolve without a release.
class OnboardingOptions {
  const OnboardingOptions({
    required this.genders,
    required this.ageRanges,
    required this.personalities,
  });

  factory OnboardingOptions.fromJson(Map<String, dynamic> json) {
    List<String> list(String key) =>
        ((json[key] as List<dynamic>?) ?? const <dynamic>[])
            .map((dynamic e) => '$e')
            .toList();
    return OnboardingOptions(
      genders: list('genders'),
      ageRanges: list('ageRanges'),
      personalities: list('personalities'),
    );
  }

  final List<String> genders;
  final List<String> ageRanges;
  final List<String> personalities;

  static const OnboardingOptions empty = OnboardingOptions(
    genders: <String>[],
    ageRanges: <String>[],
    personalities: <String>[],
  );
}

/// A captured customer/guest for the session. All fields optional except [id].
class Customer {
  const Customer({
    required this.id,
    this.name,
    this.mobile,
    this.gender,
    this.ageRange,
    this.personality,
  });

  factory Customer.fromJson(Map<String, dynamic> json) => Customer(
    id: json['id'] as String,
    name: json['name'] as String?,
    mobile: json['mobile'] as String?,
    gender: json['gender'] as String?,
    ageRange: json['ageRange'] as String?,
    personality: json['personality'] as String?,
  );

  final String id;
  final String? name;
  final String? mobile;
  final String? gender;
  final String? ageRange;
  final String? personality;
}
