import React, { createContext, useContext, useMemo } from 'react';
import { AppColors, darkColors, lightColors } from './colors';
import { makeTextTheme, TextTheme } from './typography';

export interface Theme {
  colors: AppColors;
  text: TextTheme;
}

const darkTheme: Theme = { colors: darkColors, text: makeTextTheme(darkColors.textPrimary) };
const lightTheme: Theme = { colors: lightColors, text: makeTextTheme(lightColors.textPrimary) };

const ThemeContext = createContext<Theme>(darkTheme);

/// The customer display is always dark (gallery-at-night); the light theme is
/// exported for reuse by the mobile controller port.
export function ThemeProvider({
  mode = 'dark',
  children,
}: {
  mode?: 'light' | 'dark';
  children: React.ReactNode;
}) {
  const value = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
