/// The signed-in sales associate.
class Salesperson {
  const Salesperson({
    required this.id,
    required this.name,
    this.title,
    this.username,
  });

  factory Salesperson.fromJson(Map<String, dynamic> json) => Salesperson(
    id: json['id'] as String,
    name: json['name'] as String,
    title: json['title'] as String?,
    username: json['username'] as String?,
  );

  final String id;
  final String name;
  final String? title;

  /// Login handle returned by the auth API; used to pre-fill the profile.
  final String? username;

  Map<String, dynamic> toJson() => <String, dynamic>{
    'id': id,
    'name': name,
    'title': title,
    if (username != null) 'username': username,
  };
}

/// Parsed content of a pairing QR code:
/// `http://<box-ip>:<port>/pair?token=<pairingToken>`.
class PairingInfo {
  const PairingInfo({
    required this.host,
    required this.port,
    required this.token,
  });

  /// Parses a pairing URL. Returns null if it isn't a valid pairing link.
  static PairingInfo? tryParse(String raw) {
    final Uri? uri = Uri.tryParse(raw.trim());
    if (uri == null) return null;
    final String? token = uri.queryParameters['token'];
    if (token == null || token.isEmpty) return null;
    return PairingInfo(
      host: uri.host,
      port: uri.hasPort ? uri.port : 8080,
      token: token,
    );
  }

  final String host;
  final int port;
  final String token;

  Uri get wsUri => Uri(scheme: 'ws', host: host, port: port, path: '/ws');
}

/// An active showroom session binding a salesperson to a display.
class SessionInfo {
  const SessionInfo({
    required this.sessionId,
    required this.displayId,
    required this.salesperson,
  });

  final String sessionId;
  final String displayId;
  final Salesperson salesperson;
}
