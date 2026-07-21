import { AppConfig } from '../config/appConfig';
import { Category } from '../models/category';
import { Product } from '../models/product';
import { BackendDto } from './backendDto';
import { CatalogRepository } from './catalogRepository';

/// CatalogRepository backed by the Node backend's HTTP API. Selected when
/// AppConfig.backendMode is on. Ported from the Flutter `HttpCatalogRepository`.
export class HttpCatalogRepository implements CatalogRepository {
  private static readonly timeoutMs = 8000;

  private async getJson(url: string): Promise<any | null> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), HttpCatalogRepository.timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (res.status !== 200) return null;
      return await res.json();
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  }

  async categories(): Promise<Category[]> {
    const body = await this.getJson(AppConfig.http('/api/categories'));
    if (body == null) return [];
    const items = (body.categories as any[]) ?? [];
    return items.map((e) => BackendDto.category(e));
  }

  async products(opts?: { categoryId?: string; query?: string }): Promise<Product[]> {
    const query: Record<string, any> = { limit: 100 };
    if (opts?.categoryId != null) query.category = opts.categoryId;
    if (opts?.query != null && opts.query.trim().length > 0) query.q = opts.query.trim();
    const body = await this.getJson(AppConfig.http('/api/products', query));
    if (body == null) return [];
    const items = (body.items as any[]) ?? [];
    return items.map((e) => BackendDto.fromListItem(e));
  }

  async productById(id: string): Promise<Product | undefined> {
    const body = await this.getJson(AppConfig.http(`/api/products/${id}`));
    if (body == null) return undefined;
    return BackendDto.fromDetail(body);
  }
}
