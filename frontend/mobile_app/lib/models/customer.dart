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

/// A captured customer/guest for the **current shopping session**.
/// All fields are optional except [id].
///
/// The fields the customers API supports are POSTed on capture; the richer
/// styling preferences below have no backend column yet, so they live for the
/// duration of the session and are shaped to POST unchanged once the API
/// supports them.
class Customer {
  const Customer({
    required this.id,
    this.name,
    this.mobile,
    this.gender,
    this.ageRange,
    this.personality,
    this.currentOutfit,
    this.styling,
    this.wearingColor,
    this.occasion,
    this.dateOfBirth,
    this.occupation,
    this.fashionStyles = const <String>[],
    this.favoriteColors = const <String>[],
    this.preferredFit,
    this.topSize,
    this.bottomSize,
    this.shoeSize,
    this.budgetRange,
    this.preferredBrands = const <String>[],
    this.favoriteCategories = const <String>[],
    this.preferredFabrics = const <String>[],
    this.notes,
    this.isRepeatCustomer = false,
    this.shoppingFor,
    this.familySize,
    this.familyMembers = const <String>[],
    this.boysCount,
    this.girlsCount,
    this.childAgeRanges = const <String>[],
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    List<String> list(String key) =>
        (json[key] as List<dynamic>?)?.cast<String>() ?? const <String>[];
    return Customer(
      id: json['id'] as String,
      name: json['name'] as String?,
      mobile: json['mobile'] as String?,
      gender: json['gender'] as String?,
      ageRange: json['ageRange'] as String?,
      personality: json['personality'] as String?,
      currentOutfit: json['currentOutfit'] as String?,
      styling: json['styling'] as String?,
      wearingColor: json['wearingColor'] as String?,
      occasion: json['occasion'] as String?,
      dateOfBirth: json['dateOfBirth'] is String
          ? DateTime.tryParse(json['dateOfBirth'] as String)
          : null,
      occupation: json['occupation'] as String?,
      fashionStyles: list('fashionStyles'),
      favoriteColors: list('favoriteColors'),
      preferredFit: json['preferredFit'] as String?,
      topSize: json['topSize'] as String?,
      bottomSize: json['bottomSize'] as String?,
      shoeSize: json['shoeSize'] as String?,
      budgetRange: json['budgetRange'] as String?,
      preferredBrands: list('preferredBrands'),
      favoriteCategories: list('favoriteCategories'),
      preferredFabrics: list('preferredFabrics'),
      notes: json['notes'] as String?,
      isRepeatCustomer: json['isRepeatCustomer'] as bool? ?? false,
      shoppingFor: json['shoppingFor'] as String?,
      familySize: (json['familySize'] as num?)?.toInt(),
      familyMembers: list('familyMembers'),
      boysCount: (json['boysCount'] as num?)?.toInt(),
      girlsCount: (json['girlsCount'] as num?)?.toInt(),
      childAgeRanges: list('childAgeRanges'),
    );
  }

  final String id;

  // ── Basic information ──────────────────────────────────────────────────
  final String? name;
  final String? mobile;
  final DateTime? dateOfBirth;
  final String? gender;
  final String? ageRange;
  final String? occupation;

  // ── Fashion preferences ────────────────────────────────────────────────
  final List<String> fashionStyles;
  final List<String> favoriteColors;
  final String? preferredFit;
  final String? topSize;
  final String? bottomSize;
  final String? shoeSize;
  final List<String> preferredBrands;
  final String? budgetRange;

  // ── Shopping preferences ───────────────────────────────────────────────
  final String? occasion;
  final List<String> favoriteCategories;
  final List<String> preferredFabrics;
  final String? personality;

  /// Whether this guest has shopped with us before.
  final bool isRepeatCustomer;

  // ── Who they're shopping for ───────────────────────────────────────────
  /// 'Myself' or 'Family' — when Family, the fields below describe the group.
  final String? shoppingFor;
  final int? familySize;

  /// Relations being shopped for (Mother, Father, Sister, …).
  final List<String> familyMembers;
  final int? boysCount;
  final int? girlsCount;

  /// Age bands of the children being shopped for.
  final List<String> childAgeRanges;

  bool get isFamilyShopping => shoppingFor == 'Family';

  // ── What they are wearing today (API-backed notes) ─────────────────────
  final String? currentOutfit;
  final String? styling;
  final String? wearingColor;

  /// Free-form observations: preferences, dislikes, sizing notes, requests.
  final String? notes;

  /// True when nothing at all has been captured.
  bool get isEmpty =>
      _blank(name) &&
      _blank(mobile) &&
      _blank(gender) &&
      _blank(ageRange) &&
      _blank(personality) &&
      dateOfBirth == null &&
      _blank(occupation) &&
      fashionStyles.isEmpty &&
      favoriteColors.isEmpty &&
      _blank(preferredFit) &&
      _blank(topSize) &&
      _blank(bottomSize) &&
      _blank(shoeSize) &&
      _blank(occasion) &&
      _blank(budgetRange) &&
      preferredBrands.isEmpty &&
      favoriteCategories.isEmpty &&
      preferredFabrics.isEmpty &&
      _blank(currentOutfit) &&
      _blank(styling) &&
      _blank(wearingColor) &&
      _blank(notes) &&
      _blank(shoppingFor) &&
      familySize == null &&
      familyMembers.isEmpty &&
      boysCount == null &&
      girlsCount == null &&
      childAgeRanges.isEmpty &&
      !isRepeatCustomer;

  static bool _blank(String? s) => s == null || s.trim().isEmpty;

  /// Free-text signals used to score recommendations on-device. Everything the
  /// associate captured contributes, so a fuller profile yields sharper picks.
  List<String> get styleHints => <String>[
    ...fashionStyles,
    ...favoriteColors,
    ...preferredBrands,
    ...favoriteCategories,
    ...preferredFabrics,
    ?occasion,
    ?preferredFit,
    ?personality,
    ?occupation,
    ...familyMembers,
    ...childAgeRanges,
  ];

  Customer copyWith({
    String? id,
    String? name,
    String? mobile,
    String? gender,
    String? ageRange,
    String? personality,
    String? currentOutfit,
    String? styling,
    String? wearingColor,
    String? occasion,
    DateTime? dateOfBirth,
    String? occupation,
    List<String>? fashionStyles,
    List<String>? favoriteColors,
    String? preferredFit,
    String? topSize,
    String? bottomSize,
    String? shoeSize,
    String? budgetRange,
    List<String>? preferredBrands,
    List<String>? favoriteCategories,
    List<String>? preferredFabrics,
    String? notes,
    bool? isRepeatCustomer,
    String? shoppingFor,
    int? familySize,
    List<String>? familyMembers,
    int? boysCount,
    int? girlsCount,
    List<String>? childAgeRanges,
  }) => Customer(
    id: id ?? this.id,
    name: name ?? this.name,
    mobile: mobile ?? this.mobile,
    gender: gender ?? this.gender,
    ageRange: ageRange ?? this.ageRange,
    personality: personality ?? this.personality,
    currentOutfit: currentOutfit ?? this.currentOutfit,
    styling: styling ?? this.styling,
    wearingColor: wearingColor ?? this.wearingColor,
    occasion: occasion ?? this.occasion,
    dateOfBirth: dateOfBirth ?? this.dateOfBirth,
    occupation: occupation ?? this.occupation,
    fashionStyles: fashionStyles ?? this.fashionStyles,
    favoriteColors: favoriteColors ?? this.favoriteColors,
    preferredFit: preferredFit ?? this.preferredFit,
    topSize: topSize ?? this.topSize,
    bottomSize: bottomSize ?? this.bottomSize,
    shoeSize: shoeSize ?? this.shoeSize,
    budgetRange: budgetRange ?? this.budgetRange,
    preferredBrands: preferredBrands ?? this.preferredBrands,
    favoriteCategories: favoriteCategories ?? this.favoriteCategories,
    preferredFabrics: preferredFabrics ?? this.preferredFabrics,
    notes: notes ?? this.notes,
    isRepeatCustomer: isRepeatCustomer ?? this.isRepeatCustomer,
    shoppingFor: shoppingFor ?? this.shoppingFor,
    familySize: familySize ?? this.familySize,
    familyMembers: familyMembers ?? this.familyMembers,
    boysCount: boysCount ?? this.boysCount,
    girlsCount: girlsCount ?? this.girlsCount,
    childAgeRanges: childAgeRanges ?? this.childAgeRanges,
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
    'id': id,
    if (name != null) 'name': name,
    if (mobile != null) 'mobile': mobile,
    if (gender != null) 'gender': gender,
    if (ageRange != null) 'ageRange': ageRange,
    if (personality != null) 'personality': personality,
    if (currentOutfit != null) 'currentOutfit': currentOutfit,
    if (styling != null) 'styling': styling,
    if (wearingColor != null) 'wearingColor': wearingColor,
    if (occasion != null) 'occasion': occasion,
    if (dateOfBirth != null) 'dateOfBirth': dateOfBirth!.toIso8601String(),
    if (occupation != null) 'occupation': occupation,
    if (fashionStyles.isNotEmpty) 'fashionStyles': fashionStyles,
    if (favoriteColors.isNotEmpty) 'favoriteColors': favoriteColors,
    if (preferredFit != null) 'preferredFit': preferredFit,
    if (topSize != null) 'topSize': topSize,
    if (bottomSize != null) 'bottomSize': bottomSize,
    if (shoeSize != null) 'shoeSize': shoeSize,
    if (budgetRange != null) 'budgetRange': budgetRange,
    if (preferredBrands.isNotEmpty) 'preferredBrands': preferredBrands,
    if (favoriteCategories.isNotEmpty) 'favoriteCategories': favoriteCategories,
    if (preferredFabrics.isNotEmpty) 'preferredFabrics': preferredFabrics,
    if (notes != null) 'notes': notes,
    if (isRepeatCustomer) 'isRepeatCustomer': isRepeatCustomer,
    if (shoppingFor != null) 'shoppingFor': shoppingFor,
    if (familySize != null) 'familySize': familySize,
    if (familyMembers.isNotEmpty) 'familyMembers': familyMembers,
    if (boysCount != null) 'boysCount': boysCount,
    if (girlsCount != null) 'girlsCount': girlsCount,
    if (childAgeRanges.isNotEmpty) 'childAgeRanges': childAgeRanges,
  };
}

/// Static choice lists for the customer-profile form that the backend's
/// `/api/customers/options` doesn't provide yet.
abstract final class CustomerOptions {
  static const List<String> occupations = <String>[
    'Student',
    'Working Professional',
    'Business Owner',
    'Self-Employed',
    'Homemaker',
    'Other',
  ];
  static const List<String> fashionStyles = <String>[
    'Casual',
    'Smart Casual',
    'Formal',
    'Streetwear',
    'Luxury',
    'Minimalist',
    'Ethnic',
    'Sporty',
  ];
  static const List<String> fits = <String>[
    'Slim',
    'Regular',
    'Relaxed',
    'Oversized',
  ];
  static const List<String> topSizes = <String>['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  static const List<String> bottomSizes = <String>[
    '28',
    '30',
    '32',
    '34',
    '36',
    '38',
    '40',
  ];
  static const List<String> shoeSizes = <String>[
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
  ];
  static const List<String> occasions = <String>[
    'Office',
    'Wedding',
    'Party',
    'Casual',
    'Travel',
    'Festival',
    'Business Meeting',
    'Date Night',
  ];
  static const List<String> budgets = <String>[
    'Under ₹5,000',
    '₹5,000 – ₹15,000',
    '₹15,000 – ₹30,000',
    '₹30,000 – ₹75,000',
    'Above ₹75,000',
  ];
  static const List<String> fabrics = <String>[
    'Cotton',
    'Linen',
    'Silk',
    'Wool',
    'Cashmere',
    'Denim',
    'Leather',
    'Viscose',
    'Blends',
  ];
  static const List<String> shoppingFor = <String>['Myself', 'Family'];
  static const List<String> familyMembers = <String>[
    'Mother',
    'Father',
    'Spouse',
    'Sister',
    'Brother',
    'Daughter',
    'Son',
    'Grandparent',
    'Friend',
  ];
  static const List<String> childAgeRanges = <String>[
    '0-2',
    '3-5',
    '6-9',
    '10-12',
    '13-17',
  ];
  static const List<String> colors = <String>[
    'Black',
    'White',
    'Navy',
    'Grey',
    'Beige',
    'Brown',
    'Red',
    'Blue',
    'Green',
    'Pink',
    'Purple',
    'Yellow',
    'Orange',
    'Gold',
  ];
}
