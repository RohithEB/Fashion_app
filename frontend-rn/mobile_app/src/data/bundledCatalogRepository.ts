import { Category } from '../models/category';
import { Product } from '../models/product';
import { BackendDto } from './backendDto';
import { CatalogRepository, RecommendationQuery, TalkingPointQuery } from './catalogRepository';
import snapshot from '../../assets/catalog_snapshot.json';

/// Fully-offline CatalogRepository backed by a bundled catalogue snapshot. Ported
/// from the Flutter mobile `BundledCatalogRepository` (offline fallback; backend
/// mode is the mandatory default).
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

  async products(opts?: { categoryId?: string; query?: string; color?: string }): Promise<Product[]> {
    const list = this.ensure();
    const q = opts?.query?.trim().toLowerCase();
    const color = opts?.color;
    return list.filter((p) => {
      const okCat = opts?.categoryId == null || p.categoryId === opts.categoryId;
      const okColor =
        color == null || p.variants.some((v) => v.colorName.toLowerCase() === color.toLowerCase());
      const okQ =
        q == null ||
        q.length === 0 ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.aiHighlights.some((h) => h.toLowerCase().includes(q));
      return okCat && okColor && okQ;
    });
  }

  async productById(id: string): Promise<Product | undefined> {
    return this.ensure().find((p) => p.id === id);
  }

  async recommendations(rq?: RecommendationQuery): Promise<Product[]> {
    return this.ensure().slice(0, rq?.limit ?? 12);
  }

  async talkingPoint(tq: TalkingPointQuery): Promise<string | undefined> {
    const p = this.ensure().find((x) => x.id === tq.productId);
    if (p == null) return undefined;
    const who = tq.name != null && tq.name.trim().length > 0 ? tq.name.trim() : 'They';
    const hl = p.aiHighlights.length > 0 ? ` ${p.aiHighlights[0]}` : '';
    return `Say this: “${who}, the ${p.name} feels made for you.”${hl}`;
  }
}
