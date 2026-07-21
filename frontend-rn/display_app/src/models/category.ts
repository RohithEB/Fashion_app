/// A product category / collection. Ported from the Flutter `Category`.
export class Category {
  readonly id: string;
  readonly name: string;
  readonly tagline?: string;
  readonly imageUrl?: string;

  constructor(init: { id: string; name: string; tagline?: string; imageUrl?: string }) {
    this.id = init.id;
    this.name = init.name;
    this.tagline = init.tagline;
    this.imageUrl = init.imageUrl;
  }

  static fromJson(json: any): Category {
    return new Category({
      id: json.id as string,
      name: json.name as string,
      tagline: json.tagline as string | undefined,
      imageUrl: json.imageUrl as string | undefined,
    });
  }
}
