'use client';

import { createContext, useContext } from 'react';
import type { Mode } from '@/theme';

export const ColorModeContext = createContext<{ mode: Mode; toggle: () => void }>({
  mode: 'dark',
  toggle: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);
