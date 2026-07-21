import { Listenable } from '../../core/listenable';
import { CatalogRepository } from '../../data/catalogRepository';
import { Category } from '../../models/category';
import { Product } from '../../models/product';

export enum LoadState {
  idle = 'idle',
  loading = 'loading',
  ready = 'ready',
  error = 'error',
}

/// Owns the private (salesperson-only) catalog browsing state. Browsing never
/// touches the display. Ported 1:1 from `CatalogController`.
export class CatalogController extends Listenable {
  state = LoadState.idle;
  categories: Category[] = [];
  products: Product[] = [];
  selectedCategoryId: string | null = null;
  query = '';
  error: string | null = null;
  /// The last product opened in detail (route recovery aid).
  lastViewedProduct: Product | null = null;

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly repo: CatalogRepository) {
    super();
    this.refreshTimer = setInterval(() => void this.refreshSilently(), 2 * 60 * 1000);
  }

  async load(): Promise<void> {
    this.state = LoadState.loading;
    this.notifyListeners();
    try {
      this.categories = await this.repo.categories();
      this.products = await this.repo.products();
      this.state = LoadState.ready;
    } catch {
      this.error = 'Unable to load the collection.';
      this.state = LoadState.error;
    }
    this.notifyListeners();
  }

  async selectCategory(id: string | null): Promise<void> {
    this.selectedCategoryId = id;
    await this.refreshInternal();
  }

  async search(q: string): Promise<void> {
    this.query = q;
    await this.refreshInternal();
  }

  refresh(): Promise<void> {
    return this.refreshInternal();
  }

  private async refreshInternal(): Promise<void> {
    this.state = LoadState.loading;
    this.notifyListeners();
    try {
      this.products = await this.repo.products({
        categoryId: this.selectedCategoryId ?? undefined,
        query: this.query,
      });
      this.state = LoadState.ready;
    } catch {
      this.error = 'Unable to load the collection.';
      this.state = LoadState.error;
    }
    this.notifyListeners();
  }

  async refreshSilently(): Promise<void> {
    try {
      const [cats, prods] = [
        await this.repo.categories(),
        await this.repo.products({ categoryId: this.selectedCategoryId ?? undefined, query: this.query }),
      ];
      this.categories = cats;
      this.products = prods;
      if (this.state !== LoadState.error) this.state = LoadState.ready;
      this.notifyListeners();
    } catch {
      // Keep showing the last good data on a transient failure.
    }
  }

  dispose(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }
}
