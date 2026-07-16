/// A product category / collection (e.g. "Ready-to-Wear", "Leather Goods").
class Category {
  const Category({
    required this.id,
    required this.name,
    this.tagline,
    this.imageUrl,
  });

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id'] as String,
        name: json['name'] as String,
        tagline: json['tagline'] as String?,
        imageUrl: json['imageUrl'] as String?,
      );

  final String id;
  final String name;
  final String? tagline;
  final String? imageUrl;

  @override
  bool operator ==(Object other) => other is Category && other.id == id;

  @override
  int get hashCode => id.hashCode;
}
