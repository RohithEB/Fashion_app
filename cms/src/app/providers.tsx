'use client';

import { useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme, type Mode } from '@/theme';
import { NavShell } from '@/components/NavShell';
import { ColorModeContext } from '@/app/color-mode';

const STORAGE_KEY = 'cms.colorMode';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('dark');

  // Restore the saved mode (or fall back to the OS preference) after mount.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      setMode(stored);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setMode('light');
    }
  }, []);

  const toggle = () =>
    setMode((m) => {
      const next: Mode = m === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NavShell>{children}</NavShell>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
