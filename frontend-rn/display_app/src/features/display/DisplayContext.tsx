import React, { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react';
import { AppConfig } from '../../config/appConfig';
import { BundledCatalogRepository } from '../../data/bundledCatalogRepository';
import { CatalogRepository } from '../../data/catalogRepository';
import { HttpCatalogRepository } from '../../data/httpCatalogRepository';
import { createDisplayRealtime } from '../../realtime/displayRealtime';
import { BackendDisplayRealtime } from '../../realtime/backendDisplayRealtime';
import { RealtimeService } from '../../realtime/realtimeService';
import { DisplayController } from './displayController';

const DisplayControllerContext = createContext<DisplayController | null>(null);

export function DisplayProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<DisplayController | null>(null);
  if (ref.current == null) {
    const catalog: CatalogRepository = AppConfig.backendMode
      ? new HttpCatalogRepository()
      : new BundledCatalogRepository();
    const realtime: RealtimeService = AppConfig.backendMode
      ? new BackendDisplayRealtime()
      : createDisplayRealtime();
    ref.current = new DisplayController(realtime, catalog, !AppConfig.backendMode);
  }

  useEffect(() => {
    const ctrl = ref.current;
    return () => {
      ctrl?.dispose();
    };
  }, []);

  return (
    <DisplayControllerContext.Provider value={ref.current}>
      {children}
    </DisplayControllerContext.Provider>
  );
}

function useController(): DisplayController {
  const ctrl = useContext(DisplayControllerContext);
  if (ctrl == null) throw new Error('DisplayProvider missing');
  return ctrl;
}

/// Subscribe to the whole controller (re-render on any notifyListeners()).
export function useDisplayController(): DisplayController {
  const ctrl = useController();
  useSyncExternalStore(
    (cb) => {
      ctrl.addListener(cb);
      return () => ctrl.removeListener(cb);
    },
    () => ctrl.version,
    () => ctrl.version,
  );
  return ctrl;
}

/// Subscribe to a derived slice (mirrors Flutter's context.select). The selected
/// value must be a primitive or a stable reference between notifications.
export function useDisplaySelector<T>(selector: (c: DisplayController) => T): T {
  const ctrl = useController();
  return useSyncExternalStore(
    (cb) => {
      ctrl.addListener(cb);
      return () => ctrl.removeListener(cb);
    },
    () => selector(ctrl),
    () => selector(ctrl),
  );
}
