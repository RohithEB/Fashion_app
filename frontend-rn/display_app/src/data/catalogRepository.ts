import { Category } from '../models/category';
import { Product } from '../models/product';
import { MockCatalog } from './mockCatalog';

/// Contract for catalog access. The UI depends only on this interface. Ported
/// from the Flutter `CatalogRepository`.
export interface CatalogRepository {
  categories(): Promise<Category[]>;
  products(opts?: { categoryId?: string; query?: string }): Promise<Product[]>;
  productById(id: string): Promise<Product | undefined>;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/// In-memory implementation backed by MockCatalog with simulated latency.
export class MockCatalogRepository implements CatalogRepository {
  private static readonly latency = 350;

  async categories(): Promise<Category[]> {
    await delay(MockCatalogRepository.latency);
    return MockCatalog.categories;
  }

  async products(opts?: { categoryId?: string; query?: string }): Promise<Product[]> {
    await delay(MockCatalogRepository.latency);
    const q = opts?.query?.trim().toLowerCase();
    return MockCatalog.products.filter((p) => {
      const matchesCategory = opts?.categoryId == null || p.categoryId === opts.categoryId;
      const matchesQuery =
        q == null ||
        q.length === 0 ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.aiHighlights.some((h) => h.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }

  async productById(id: string): Promise<Product | undefined> {
    await delay(MockCatalogRepository.latency);
    return MockCatalog.products.find((p) => p.id === id);
  }
}
