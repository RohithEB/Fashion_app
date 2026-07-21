/// Minimal ChangeNotifier equivalent: subscribers are notified on every change.
/// Ported to back the same imperative controllers the Flutter app used.
///
/// `version` increments once per notifyListeners() and is a stable snapshot
/// between notifications — used by useSyncExternalStore to detect changes.
export class Listenable {
  private listeners = new Set<() => void>();
  version = 0;

  addListener(cb: () => void): void {
    this.listeners.add(cb);
  }

  removeListener(cb: () => void): void {
    this.listeners.delete(cb);
  }

  protected notifyListeners(): void {
    this.version++;
    for (const cb of Array.from(this.listeners)) cb();
  }
}
