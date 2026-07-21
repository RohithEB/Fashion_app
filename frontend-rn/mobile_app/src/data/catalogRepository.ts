import { Category } from '../models/category';
import { Product, ProductVariant } from '../models/product';
import { MockCatalog } from './mockCatalog';

export interface RecommendationQuery {
  gender?: string;
  ageRange?: string;
  personality?: string;
  customerId?: string;
  limit?: number;
  styleHints?: string[];
}

export interface TalkingPointQuery {
  productId: string;
  customerId?: string;
  personality?: string;
  name?: string;
}

/// Contract for catalog access. Ported from the Flutter mobile `CatalogRepository`.
export interface CatalogRepository {
  categories(): Promise<Category[]>;
  products(opts?: { categoryId?: string; query?: string; color?: string }): Promise<Product[]>;
  productById(id: string): Promise<Product | undefined>;
  recommendations(q?: RecommendationQuery): Promise<Product[]>;
  talkingPoint(q: TalkingPointQuery): Promise<string | undefined>;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/// In-memory implementation backed by MockCatalog with simulated latency.
export class MockCatalogRepository implements CatalogRepository {
  private static readonly latency = 350;

  async categories(): Promise<Category[]> {
    await delay(MockCatalogRepository.latency);
    return MockCatalog.categories;
  }

  async products(opts?: { categoryId?: string; query?: string; color?: string }): Promise<Product[]> {
    await delay(MockCatalogRepository.latency);
    const q = opts?.query?.trim().toLowerCase();
    const color = opts?.color;
    return MockCatalog.products.filter((p) => {
      const matchesCategory = opts?.categoryId == null || p.categoryId === opts.categoryId;
      const matchesColor =
        color == null ||
        p.variants.some((v: ProductVariant) => v.colorName.toLowerCase() === color.toLowerCase());
      const matchesQuery =
        q == null ||
        q.length === 0 ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.aiHighlights.some((h) => h.toLowerCase().includes(q));
      return matchesCategory && matchesColor && matchesQuery;
    });
  }

  async productById(id: string): Promise<Product | undefined> {
    await delay(MockCatalogRepository.latency);
    return MockCatalog.products.find((p) => p.id === id);
  }

  async recommendations(q?: RecommendationQuery): Promise<Product[]> {
    await delay(MockCatalogRepository.latency);
    return MockCatalog.products.slice(0, q?.limit ?? 12);
  }

  async talkingPoint(q: TalkingPointQuery): Promise<string | undefined> {
    await delay(MockCatalogRepository.latency);
    const p = MockCatalog.products.find((x) => x.id === q.productId);
    if (p == null) return undefined;
    const who = q.name != null && q.name.trim().length > 0 ? q.name.trim() : 'They';
    const hl = p.aiHighlights.length > 0 ? ` ${p.aiHighlights[0]}` : '';
    return `Say this: “${who}, the ${p.name} feels made for you.”${hl}`;
  }
}
