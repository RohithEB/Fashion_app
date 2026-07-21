import { AppConfig } from '../config/appConfig';
import { Category } from '../models/category';
import { Product } from '../models/product';
import { BackendDto } from './backendDto';
import { CatalogRepository, RecommendationQuery, TalkingPointQuery } from './catalogRepository';

/// CatalogRepository backed by the Node backend's HTTP API. Ported from the
/// Flutter mobile `HttpCatalogRepository`.
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
    return ((body.categories as any[]) ?? []).map((e) => BackendDto.category(e));
  }

  async products(opts?: { categoryId?: string; query?: string; color?: string }): Promise<Product[]> {
    const q: Record<string, any> = { limit: 100 };
    if (opts?.categoryId != null) q.category = opts.categoryId;
    if (opts?.query != null && opts.query.trim().length > 0) q.q = opts.query.trim();
    if (opts?.color != null && opts.color.trim().length > 0) q.color = opts.color.trim();
    const body = await this.getJson(AppConfig.http('/api/products', q));
    if (body == null) return [];
    return ((body.items as any[]) ?? []).map((e) => BackendDto.fromListItem(e));
  }

  async productById(id: string): Promise<Product | undefined> {
    const body = await this.getJson(AppConfig.http(`/api/products/${id}`));
    if (body == null) return undefined;
    return BackendDto.fromDetail(body);
  }

  async recommendations(rq?: RecommendationQuery): Promise<Product[]> {
    const q: Record<string, any> = { limit: rq?.limit ?? 12 };
    if (rq?.gender) q.gender = rq.gender;
    if (rq?.ageRange) q.ageRange = rq.ageRange;
    if (rq?.personality) q.personality = rq.personality;
    if (rq?.customerId) q.customerId = rq.customerId;
    if (rq?.styleHints && rq.styleHints.length > 0) q.hints = rq.styleHints.join(',');
    const body = await this.getJson(AppConfig.http('/api/recommendations', q));
    if (body == null) return [];
    return ((body.items as any[]) ?? []).map((e) => BackendDto.fromListItem(e));
  }

  async talkingPoint(tq: TalkingPointQuery): Promise<string | undefined> {
    const q: Record<string, any> = { productId: tq.productId };
    if (tq.customerId) q.customerId = tq.customerId;
    if (tq.personality) q.personality = tq.personality;
    if (tq.name) q.name = tq.name;
    const body = await this.getJson(AppConfig.http('/api/talking-point', q));
    if (body == null) return undefined;
    return body.compliment as string | undefined;
  }
}
