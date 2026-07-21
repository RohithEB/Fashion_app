import React, { createContext, useContext, useEffect, useRef } from 'react';
import { AppConfig } from '../config/appConfig';
import { BundledCatalogRepository } from '../data/bundledCatalogRepository';
import { CatalogRepository } from '../data/catalogRepository';
import { HttpCatalogRepository } from '../data/httpCatalogRepository';
import { AuthRepository, HttpAuthRepository, MockAuthRepository } from '../data/authRepository';
import { CheckoutRepository, HttpCheckoutRepository, MockCheckoutRepository } from '../data/checkoutRepository';
import { CustomerRepository, HttpCustomerRepository, MockCustomerRepository } from '../data/customerRepository';
import { JourneyLogger } from '../data/journeyLogger';
import { BackendControllerRealtime } from '../realtime/backendControllerRealtime';
import { RealtimeService } from '../realtime/realtimeService';
import { AuthController } from '../features/auth/authController';
import { CartController } from '../features/cart/cartController';
import { CatalogController } from '../features/catalog/catalogController';
import { ConnectionController } from '../features/connection/connectionController';
import { OnboardingController } from '../features/onboarding/onboardingController';
import { PresentationController } from '../features/presentation/presentationController';
import { CustomerDirectoryController } from '../features/customer/customerDirectoryController';

/// The full dependency-injection graph — the RN equivalent of the Flutter
/// MultiProvider in `app.dart`. Repositories resolve by AppConfig.backendMode
/// (backend is the mandatory default), controllers wrap them.
export interface Deps {
  realtime: RealtimeService;
  catalogRepo: CatalogRepository;
  checkoutRepo: CheckoutRepository;
  journey: JourneyLogger;
  auth: AuthController;
  catalog: CatalogController;
  cart: CartController;
  onboarding: OnboardingController;
  customerDirectory: CustomerDirectoryController;
  connection: ConnectionController;
  presentation: PresentationController;
}

function buildDeps(): Deps {
  const catalogRepo: CatalogRepository = AppConfig.backendMode
    ? new HttpCatalogRepository()
    : new BundledCatalogRepository();
  const authRepo: AuthRepository = AppConfig.backendMode ? new HttpAuthRepository() : new MockAuthRepository();
  const checkoutRepo: CheckoutRepository = AppConfig.backendMode
    ? new HttpCheckoutRepository()
    : new MockCheckoutRepository();
  const customerRepo: CustomerRepository = AppConfig.backendMode
    ? new HttpCustomerRepository()
    : new MockCustomerRepository();
  const realtime: RealtimeService = new BackendControllerRealtime();

  const catalog = new CatalogController(catalogRepo);
  void catalog.load();

  return {
    realtime,
    catalogRepo,
    checkoutRepo,
    journey: new JourneyLogger(),
    auth: new AuthController(authRepo),
    catalog,
    cart: new CartController(),
    onboarding: new OnboardingController(customerRepo),
    customerDirectory: new CustomerDirectoryController(),
    connection: new ConnectionController(realtime),
    presentation: new PresentationController(realtime),
  };
}

const DepsContext = createContext<Deps | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const ref = useRef<Deps | null>(null);
  if (ref.current == null) ref.current = buildDeps();

  useEffect(() => {
    const d = ref.current!;
    return () => {
      d.catalog.dispose();
      d.presentation.dispose();
      d.connection.dispose();
      void d.realtime.dispose();
    };
  }, []);

  return <DepsContext.Provider value={ref.current}>{children}</DepsContext.Provider>;
}

export function useDeps(): Deps {
  const d = useContext(DepsContext);
  if (d == null) throw new Error('AppProviders missing');
  return d;
}
