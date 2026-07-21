import { Category } from '../models/category';
import { Product } from '../models/product';
import { BackendDto } from './backendDto';
import { CatalogRepository } from './catalogRepository';
// Metro bundles the JSON snapshot directly — no network, no filesystem.
import snapshot from '../../assets/catalog_snapshot.json';

/// Fully-offline CatalogRepository backed by a bundled snapshot of the real
/// catalog (exported from the backend). Ported from `BundledCatalogRepository`.
export class BundledCatalogRepository implements CatalogRepository {
  private cache: Product[] | null = null;

  private ensure(): Product[] {
    if (this.cache != null) return this.cache;
    const products = ((snapshot as any).products as any[]) ?? [];
    this.cache = products.map((e) => BackendDto.fromDetail(e));
    return this.cache;
  }

  async categories(): Promise<Category[]> {
    const list = this.ensure();
    const seen = new Set<string>();
    const cats: Category[] = [];
    for (const p of list) {
      if (p.categoryId.length > 0 && !seen.has(p.categoryId)) {
        seen.add(p.categoryId);
        cats.push(new Category({ id: p.categoryId, name: p.categoryId }));
      }
    }
    cats.sort((a, b) => a.name.localeCompare(b.name));
    return cats;
  }

  async products(opts?: { categoryId?: string; query?: string }): Promise<Product[]> {
    const list = this.ensure();
    const q = opts?.query?.trim().toLowerCase();
    return list.filter((p) => {
      const okCat = opts?.categoryId == null || p.categoryId === opts.categoryId;
      const okQ =
        q == null ||
        q.length === 0 ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.aiHighlights.some((h) => h.toLowerCase().includes(q));
      return okCat && okQ;
    });
  }

  async productById(id: string): Promise<Product | undefined> {
    const list = this.ensure();
    return list.find((p) => p.id === id);
  }
}
