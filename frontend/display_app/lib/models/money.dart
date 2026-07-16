/// Immutable money value object stored in **minor units** (e.g. cents) to avoid
/// floating-point rounding. All monetary math goes through here.
class Money {
  const Money({required this.minorUnits, this.currency = 'USD'});

  const Money.zero({this.currency = 'USD'}) : minorUnits = 0;

  factory Money.fromMajor(num amount, {String currency = 'USD'}) =>
      Money(minorUnits: (amount * 100).round(), currency: currency);

  factory Money.fromJson(Map<String, dynamic> json) => Money(
    minorUnits: (json['minorUnits'] as num).toInt(),
    currency: json['currency'] as String? ?? 'USD',
  );

  final int minorUnits;
  final String currency;

  double get major => minorUnits / 100;

  Money operator +(Money other) =>
      Money(minorUnits: minorUnits + other.minorUnits, currency: currency);

  Money operator *(int qty) =>
      Money(minorUnits: minorUnits * qty, currency: currency);

  Money percent(double pct) =>
      Money(minorUnits: (minorUnits * pct).round(), currency: currency);

  /// Formatted for display, e.g. `$1,299.00`.
  String get formatted {
    final String symbol = switch (currency) {
      'USD' => r'$',
      'EUR' => '€',
      'GBP' => '£',
      'INR' => '₹',
      _ => '$currency ',
    };
    final List<String> parts = major.toStringAsFixed(2).split('.');
    final String intPart = parts[0].replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+$)'),
      (Match m) => '${m[1]},',
    );
    return '$symbol$intPart.${parts[1]}';
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
    'minorUnits': minorUnits,
    'currency': currency,
  };

  @override
  bool operator ==(Object other) =>
      other is Money &&
      other.minorUnits == minorUnits &&
      other.currency == currency;

  @override
  int get hashCode => Object.hash(minorUnits, currency);
}
