import { AppConfig } from '../config/appConfig';
import { Category } from '../models/category';
import { Money } from '../models/money';
import { Product, ProductDetail, ProductMedia, ProductVariant } from '../models/product';

/// Maps the Node backend's JSON shapes onto the app's domain models. Ported 1:1
/// from the Flutter `BackendDto` so the wire format handling is identical.
export const BackendDto = {
  category(json: any): Category {
    const name = json.category as string;
    return new Category({ id: name, name });
  },

  price(json: any): Money {
    // Backend stores basePrice in WHOLE currency units; Money holds minor units.
    const base = (json.basePrice as number) ?? 0;
    const cur = (json.currency as string) ?? 'INR';
    return new Money(Math.round(base * 100), cur);
  },

  image(url: string): ProductMedia {
    return new ProductMedia({
      id: `${hashCode(url)}`,
      type: 'image',
      url: AppConfig.media(url),
      thumbnailUrl: AppConfig.media(url),
    });
  },

  /// Summary product from `GET /api/products` list items (no variants/media).
  fromListItem(json: any): Product {
    const colors = (json.colors as any[]) ?? [];
    const sizes = ((json.sizes as any[]) ?? []).map((e) => e as string);
    const hero = json.heroImage as string | undefined;

    const variants: ProductVariant[] =
      colors.length === 0
        ? [
            new ProductVariant({
              id: 'default',
              colorName: 'Default',
              colorHex: '#141210',
              sizes: sizes.length === 0 ? ['One Size'] : sizes,
              media: hero != null ? [BackendDto.image(hero)] : [],
            }),
          ]
        : colors.map((c: any) => {
            return new ProductVariant({
              id: c.name as string,
              colorName: c.name as string,
              colorHex: (c.hex as string) ?? '#141210',
              sizes: sizes.length === 0 ? ['One Size'] : sizes,
              media: hero != null ? [BackendDto.image(hero)] : [],
            });
          });

    return new Product({
      id: json.id as string,
      name: json.name as string,
      brand: (json.brand as string) ?? '',
      categoryId: (json.category as string) ?? '',
      price: BackendDto.price(json),
      variants,
      isNew: ((json.tags as any[]) ?? []).includes('new'),
    });
  },

  /// Rich product from `GET /api/products/:id` (variants + media + enrichment).
  fromDetail(json: any): Product {
    const colors = (json.colors as any[]) ?? [];
    const rawVariants = (json.variants as any[]) ?? [];
    const rawMedia = (json.media as any[]) ?? [];
    const enrichment = (json.enrichment as any[]) ?? [];
    const allSizes = ((json.sizes as any[]) ?? []).map((e) => e as string);

    // Shared video (if any) across colour variants.
    let video: ProductMedia | undefined;
    for (const mm of rawMedia) {
      if (mm.type === 'video') {
        video = new ProductMedia({
          id: mm.id as string,
          type: 'video',
          url: AppConfig.media(mm.url as string),
          thumbnailUrl: mm.posterUrl != null ? AppConfig.media(mm.posterUrl as string) : undefined,
          caption: mm.label as string | undefined,
        });
        break;
      }
    }

    const variants: ProductVariant[] = colors.map((c: any) => {
      const colorName = c.name as string;
      const colorVariants = rawVariants.filter((v: any) => v.color === colorName);
      const sizeSet = new Set<string>();
      for (const v of colorVariants) sizeSet.add(v.size as string);
      const sizes = Array.from(sizeSet);

      const images: ProductMedia[] = [];
      const seenImg = new Set<string>();
      const addImage = (url?: string | null) => {
        if (url == null || url.length === 0 || seenImg.has(url)) return;
        seenImg.add(url);
        images.push(BackendDto.image(url));
      };

      for (const v of colorVariants) addImage(v.mediaUrl as string | undefined);
      for (const mm of rawMedia) {
        if (mm.type !== 'image') continue;
        const label = mm.label as string | undefined;
        if (label == null || label.length === 0 || label === colorName) {
          addImage(mm.url as string | undefined);
        }
      }
      if (images.length === 0) addImage(json.heroImage as string | undefined);

      return new ProductVariant({
        id: colorVariants.length > 0 ? (colorVariants[0].id as string) : colorName,
        colorName,
        colorHex: (c.hex as string) ?? '#141210',
        sizes: sizes.length === 0 ? (allSizes.length === 0 ? ['One Size'] : allSizes) : sizes,
        media: video != null ? [...images, video] : images,
      });
    });

    const highlights: string[] = [];
    const materials: string[] = [];
    const details: ProductDetail[] = [];
    for (const em of enrichment) {
      const key = (em.key as string) ?? '';
      const value = (em.value as string) ?? '';
      if (value.length === 0) continue;
      const lk = key.toLowerCase();
      if (lk === 'highlight') {
        highlights.push(value);
      } else {
        details.push({ label: key, value });
        if (lk.includes('fabric') || lk.includes('material') || lk.includes('composition')) {
          materials.push(value);
        }
      }
    }
    if (highlights.length === 0) {
      highlights.push(
        ...details
          .filter(
            (d) => !d.label.toLowerCase().includes('material') && !d.label.toLowerCase().includes('fabric'),
          )
          .map((d) => d.value)
          .slice(0, 4),
      );
    }

    const finalVariants =
      variants.length === 0
        ? [
            new ProductVariant({
              id: 'default',
              colorName: 'Default',
              colorHex: '#141210',
              sizes: allSizes.length === 0 ? ['One Size'] : allSizes,
              media: json.heroImage != null ? [BackendDto.image(json.heroImage as string)] : [],
            }),
          ]
        : variants;

    return new Product({
      id: json.id as string,
      name: json.name as string,
      brand: (json.brand as string) ?? '',
      categoryId: (json.category as string) ?? '',
      price: BackendDto.price(json),
      variants: finalVariants,
      description: (json.description as string) ?? '',
      aiHighlights: highlights,
      materials,
      details,
    });
  },
};

/// Dart `String.hashCode`-style stable id from a url (only needs to be stable).
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}
