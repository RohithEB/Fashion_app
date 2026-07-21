import AsyncStorage from '@react-native-async-storage/async-storage';
import { Listenable } from '../../core/listenable';
import { Customer } from '../../models/customer';

/// A saved book of customer profiles persisted locally with AsyncStorage. Ported
/// 1:1 from `CustomerDirectoryController`.
export class CustomerDirectoryController extends Listenable {
  private static readonly K_PROFILES = 'customers.saved';

  private _profiles: Customer[] = [];
  private _loaded = false;
  private seq = 0;

  get profiles(): Customer[] {
    return this._profiles;
  }
  get isLoaded(): boolean {
    return this._loaded;
  }
  get isEmpty(): boolean {
    return this._profiles.length === 0;
  }

  constructor() {
    super();
    void this.restore();
  }

  private async restore(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(CustomerDirectoryController.K_PROFILES);
      if (raw != null && raw.length > 0) {
        const list = JSON.parse(raw) as any[];
        this._profiles = list.map((e) => Customer.fromJson(e));
      }
    } catch {
      this._profiles = [];
    }
    this._loaded = true;
    this.notifyListeners();
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        CustomerDirectoryController.K_PROFILES,
        JSON.stringify(this._profiles.map((c) => c.toJson())),
      );
    } catch {
      // Best-effort.
    }
  }

  async save(customer: Customer): Promise<Customer> {
    const needsId = customer.id.length === 0 || customer.id === 'draft';
    const record = needsId ? customer.copyWith({ id: `local_${Date.now()}_${this.seq++}` }) : customer;
    const index = this._profiles.findIndex((c) => c.id === record.id);
    if (index >= 0) {
      this._profiles = this._profiles.map((c, i) => (i === index ? record : c));
    } else {
      this._profiles = [record, ...this._profiles];
    }
    this.notifyListeners();
    await this.persist();
    return record;
  }

  async remove(id: string): Promise<void> {
    this._profiles = this._profiles.filter((c) => c.id !== id);
    this.notifyListeners();
    await this.persist();
  }

  byId(id: string | null | undefined): Customer | null {
    if (id == null) return null;
    return this._profiles.find((c) => c.id === id) ?? null;
  }

  static labelFor(c: Customer): string {
    const name = (c.name ?? '').trim();
    if (name.length > 0) return name;
    const mobile = (c.mobile ?? '').trim();
    if (mobile.length > 0) return mobile;
    return 'Unnamed guest';
  }

  static summaryFor(c: Customer): string {
    const bits = [
      ...c.fashionStyles.slice(0, 2),
      c.preferredFit,
      c.budgetRange,
      ...c.favoriteColors.slice(0, 2),
    ].filter((x): x is string => x != null);
    return bits.length === 0 ? 'No preferences captured yet' : bits.join(' · ');
  }
}
