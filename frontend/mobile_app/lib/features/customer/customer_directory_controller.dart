import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../models/customer.dart';

/// A saved book of customer profiles the associate can build up over time.
///
/// The backend has no multi-profile endpoint yet, so the book is persisted
/// **locally** with [SharedPreferences]. Each entry is a full [Customer], so the
/// same model (and `toJson`) will POST unchanged once an API exists.
class CustomerDirectoryController extends ChangeNotifier {
  CustomerDirectoryController() {
    _restore();
  }

  static const String _kProfiles = 'customers.saved';

  List<Customer> _profiles = <Customer>[];
  bool _loaded = false;

  /// Saved profiles, most recently updated first.
  List<Customer> get profiles => List<Customer>.unmodifiable(_profiles);
  bool get isLoaded => _loaded;
  bool get isEmpty => _profiles.isEmpty;

  Future<void> _restore() async {
    try {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      final String? raw = prefs.getString(_kProfiles);
      if (raw != null && raw.isNotEmpty) {
        final List<dynamic> list = jsonDecode(raw) as List<dynamic>;
        _profiles = list
            .map((dynamic e) => Customer.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {
      _profiles = <Customer>[];
    }
    _loaded = true;
    notifyListeners();
  }

  Future<void> _persist() async {
    try {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _kProfiles,
        jsonEncode(_profiles.map((Customer c) => c.toJson()).toList()),
      );
    } catch (_) {
      // Best-effort; the in-memory book still works for this session.
    }
  }

  /// Insert or update [customer] by id and persist. Returns the stored record
  /// (with a generated id when the draft didn't have a real one yet).
  Future<Customer> save(Customer customer) async {
    final bool needsId =
        customer.id.isEmpty || customer.id == 'draft';
    final Customer record = needsId
        ? customer.copyWith(id: 'local_${DateTime.now().microsecondsSinceEpoch}')
        : customer;

    final int index = _profiles.indexWhere((Customer c) => c.id == record.id);
    if (index >= 0) {
      _profiles[index] = record;
    } else {
      _profiles.insert(0, record);
    }
    notifyListeners();
    await _persist();
    return record;
  }

  Future<void> remove(String id) async {
    _profiles.removeWhere((Customer c) => c.id == id);
    notifyListeners();
    await _persist();
  }

  Customer? byId(String? id) {
    if (id == null) return null;
    for (final Customer c in _profiles) {
      if (c.id == id) return c;
    }
    return null;
  }

  /// A short human label for list rows.
  static String labelFor(Customer c) {
    final String name = (c.name ?? '').trim();
    if (name.isNotEmpty) return name;
    final String mobile = (c.mobile ?? '').trim();
    if (mobile.isNotEmpty) return mobile;
    return 'Unnamed guest';
  }

  /// A one-line summary of the guest's strongest preferences.
  static String summaryFor(Customer c) {
    final List<String> bits = <String>[
      ...c.fashionStyles.take(2),
      ?c.preferredFit,
      ?c.budgetRange,
      ...c.favoriteColors.take(2),
    ];
    return bits.isEmpty ? 'No preferences captured yet' : bits.join(' · ');
  }
}
