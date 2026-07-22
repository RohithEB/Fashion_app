import { Money } from './money';

/// Kind of media attached to a product.
export type ProductMediaType = 'image' | 'video' | 'lookbook';

/// A single media asset (image or video) for a product/colorway.
export class ProductMedia {
  readonly id: string;
  readonly type: ProductMediaType;
  readonly url: string;
  readonly thumbnailUrl?: string;
  readonly caption?: string;
  readonly durationSeconds?: number;

  constructor(init: {
    id: string;
    type: ProductMediaType;
    url: string;
    thumbnailUrl?: string;
    caption?: string;
    durationSeconds?: number;
  }) {
    this.id = init.id;
    this.type = init.type;
    this.url = init.url;
    this.thumbnailUrl = init.thumbnailUrl;
    this.caption = init.caption;
    this.durationSeconds = init.durationSeconds;
  }

  static fromJson(json: any): ProductMedia {
    return new ProductMedia({
      id: json.id as string,
      type: json.type as ProductMediaType,
      url: json.url as string,
      thumbnailUrl: json.thumbnailUrl as string | undefined,
      caption: json.caption as string | undefined,
      durationSeconds: json.durationSeconds != null ? Math.trunc(json.durationSeconds) : undefined,
    });
  }

  get isVideo(): boolean {
    return this.type === 'video';
  }
}

/// A purchasable colorway/size combination of a Product.
export class ProductVariant {
  readonly id: string;
  readonly colorName: string;
  readonly colorHex: string;
  readonly sizes: string[];
  readonly media: ProductMedia[];
  readonly price?: Money;

  constructor(init: {
    id: string;
    colorName: string;
    colorHex: string;
    sizes: string[];
    media: ProductMedia[];
    price?: Money;
  }) {
    this.id = init.id;
    this.colorName = init.colorName;
    this.colorHex = init.colorHex;
    this.sizes = init.sizes;
    this.media = init.media;
    this.price = init.price;
  }

  static fromJson(json: any): ProductVariant {
    return new ProductVariant({
      id: json.id as string,
      colorName: json.colorName as string,
      colorHex: json.colorHex as string,
      sizes: (json.sizes as any[]).map((e) => e as string),
      media: (json.media as any[]).map((e) => ProductMedia.fromJson(e)),
      price: json.price == null ? undefined : Money.fromJson(json.price),
    });
  }

  get images(): ProductMedia[] {
    return this.media.filter((m) => m.type === 'image');
  }

  get video(): ProductMedia | undefined {
    return this.media.find((m) => m.isVideo);
  }
}

/// A labeled enrichment attribute (e.g. Fabric → "100% linen").
export interface ProductDetail {
  label: string;
  value: string;
}

/// A catalog product, enriched with AI-generated highlights and related media.
export class Product {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  readonly categoryId: string;
  readonly price: Money;
  readonly variants: ProductVariant[];
  readonly description: string;
  readonly aiHighlights: string[];
  readonly materials: string[];
  readonly details: ProductDetail[];
  readonly isNew: boolean;
  // In-store placement, shown to the salesperson (never mirrored to the display).
  readonly storeSection?: string;
  readonly storeRack?: string;
  readonly storeColumn?: string;

  constructor(init: {
    id: string;
    name: string;
    brand: string;
    categoryId: string;
    price: Money;
    variants: ProductVariant[];
    description?: string;
    aiHighlights?: string[];
    materials?: string[];
    details?: ProductDetail[];
    isNew?: boolean;
    storeSection?: string;
    storeRack?: string;
    storeColumn?: string;
  }) {
    this.id = init.id;
    this.name = init.name;
    this.brand = init.brand;
    this.categoryId = init.categoryId;
    this.price = init.price;
    this.variants = init.variants;
    this.description = init.description ?? '';
    this.aiHighlights = init.aiHighlights ?? [];
    this.materials = init.materials ?? [];
    this.details = init.details ?? [];
    this.isNew = init.isNew ?? false;
    this.storeSection = init.storeSection;
    this.storeRack = init.storeRack;
    this.storeColumn = init.storeColumn;
  }

  /// Human-readable placement line, e.g. "Women · Formals · Rack B3 · Col 4".
  get locationLabel(): string | undefined {
    const parts: string[] = [];
    if (this.storeSection) parts.push(this.storeSection);
    if (this.storeRack) parts.push(`Rack ${this.storeRack}`);
    if (this.storeColumn) parts.push(`Col ${this.storeColumn}`);
    return parts.length > 0 ? parts.join(' · ') : undefined;
  }

  static fromJson(json: any): Product {
    return new Product({
      id: json.id as string,
      name: json.name as string,
      brand: json.brand as string,
      categoryId: json.categoryId as string,
      price: Money.fromJson(json.price),
      variants: (json.variants as any[]).map((e) => ProductVariant.fromJson(e)),
      description: (json.description as string) ?? '',
      aiHighlights: (json.aiHighlights as any[] | undefined)?.map((e) => e as string) ?? [],
      materials: (json.materials as any[] | undefined)?.map((e) => e as string) ?? [],
      isNew: (json.isNew as boolean) ?? false,
    });
  }

  get defaultVariant(): ProductVariant {
    return this.variants[0];
  }

  variantById(id?: string | null): ProductVariant {
    return this.variants.find((v) => v.id === id) ?? this.defaultVariant;
  }

  /// Primary display image (first image of the first variant).
  get heroImage(): string | undefined {
    return this.defaultVariant.images[0]?.url;
  }
}
