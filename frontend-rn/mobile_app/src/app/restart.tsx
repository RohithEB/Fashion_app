import { createContext, useContext } from 'react';

/// Remounts the DI graph (AppProviders) so repositories re-resolve after the
/// server settings change. The RN equivalent of the Flutter `RestartWidget`.
export const RestartContext = createContext<() => void>(() => {});

export function useRestart(): () => void {
  return useContext(RestartContext);
}
