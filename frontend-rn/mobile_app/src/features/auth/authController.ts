import AsyncStorage from '@react-native-async-storage/async-storage';
import { Listenable } from '../../core/listenable';
import { AuthException, AuthRepository, AuthResult } from '../../data/authRepository';
import { Salesperson } from '../../models/session';

/// Single source of truth for salesperson authentication. Login gates the whole
/// app. Token + salesperson persisted across restarts. Ported from `AuthController`.
export class AuthController extends Listenable {
  private static readonly K_TOKEN = 'auth.token';
  private static readonly K_SALESPERSON = 'auth.salesperson';

  salesperson: Salesperson | null = null;
  token: string | null = null;
  isBusy = false;
  bootstrapped = false;
  error: string | null = null;

  constructor(private readonly repo: AuthRepository) {
    super();
    void this.restore();
  }

  get isAuthenticated(): boolean {
    return this.salesperson != null && this.token != null;
  }

  private async restore(): Promise<void> {
    try {
      const [token, spJson] = await Promise.all([
        AsyncStorage.getItem(AuthController.K_TOKEN),
        AsyncStorage.getItem(AuthController.K_SALESPERSON),
      ]);
      if (token != null && spJson != null) {
        this.token = token;
        this.salesperson = Salesperson.fromJson(JSON.parse(spJson));
      }
    } catch {
      // Corrupt/unavailable storage → start signed out.
    } finally {
      this.bootstrapped = true;
      this.notifyListeners();
    }
  }

  private async persist(): Promise<void> {
    if (this.token != null && this.salesperson != null) {
      await AsyncStorage.setItem(AuthController.K_TOKEN, this.token);
      await AsyncStorage.setItem(AuthController.K_SALESPERSON, JSON.stringify(this.salesperson.toJson()));
    } else {
      await AsyncStorage.multiRemove([AuthController.K_TOKEN, AuthController.K_SALESPERSON]);
    }
  }

  login(opts: { username: string; password: string }): Promise<boolean> {
    return this.run(() => this.repo.login(opts));
  }

  register(opts: { name: string; title?: string; username: string; password: string }): Promise<boolean> {
    return this.run(() => this.repo.register(opts));
  }

  private async run(request: () => Promise<AuthResult>): Promise<boolean> {
    this.isBusy = true;
    this.error = null;
    this.notifyListeners();
    try {
      const result = await request();
      this.salesperson = result.salesperson;
      this.token = result.token;
      await this.persist();
      this.isBusy = false;
      this.notifyListeners();
      return true;
    } catch (e) {
      this.error = e instanceof AuthException ? e.message : 'Something went wrong. Please try again.';
      this.isBusy = false;
      this.notifyListeners();
      return false;
    }
  }

  async logout(): Promise<void> {
    const token = this.token;
    this.salesperson = null;
    this.token = null;
    this.error = null;
    await this.persist();
    this.notifyListeners();
    if (token != null) await this.repo.logout(token);
  }

  clearError(): void {
    if (this.error == null) return;
    this.error = null;
    this.notifyListeners();
  }
}
