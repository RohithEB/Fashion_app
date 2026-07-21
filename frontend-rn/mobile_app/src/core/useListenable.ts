import { useSyncExternalStore } from 'react';
import { Listenable } from './listenable';

/// Subscribe a component to a Listenable controller so it re-renders on every
/// notifyListeners(). The RN equivalent of `context.watch<T>()`.
export function useListenable<T extends Listenable>(controller: T): T {
  useSyncExternalStore(
    (cb) => {
      controller.addListener(cb);
      return () => controller.removeListener(cb);
    },
    () => controller.version,
    () => controller.version,
  );
  return controller;
}

/// Subscribe to a derived slice (mirrors `context.select`). The selected value
/// must be a primitive or a stable reference between notifications.
export function useListenableSelector<T extends Listenable, R>(controller: T, selector: (c: T) => R): R {
  return useSyncExternalStore(
    (cb) => {
      controller.addListener(cb);
      return () => controller.removeListener(cb);
    },
    () => selector(controller),
    () => selector(controller),
  );
}
