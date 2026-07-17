'use client';

import { createTheme, type Theme } from '@mui/material/styles';

export type Mode = 'light' | 'dark';

// Deep indigo / violet palette.
//  Light: white cards on a soft violet-tinted canvas, violet accent + indigo-blue secondary.
//  Dark:  indigo-violet surfaces on a near-black blue-violet canvas, brighter violet accent.
export function getTheme(mode: Mode): Theme {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? '#a78bfa' : '#7c3aed', contrastText: '#ffffff' },
      secondary: { main: isDark ? '#60a5fa' : '#4f46e5' },
      background: {
        default: isDark ? '#0d0b1f' : '#f5f4fb',
        paper: isDark ? '#171331' : '#ffffff',
      },
      text: {
        primary: isDark ? '#ece9f7' : '#1a1633',
        secondary: isDark ? '#a9a3c9' : '#575277',
      },
      divider: isDark ? 'rgba(167,139,250,0.20)' : 'rgba(26,22,51,0.10)',
      success: { main: isDark ? '#34d399' : '#059669' },
      warning: { main: isDark ? '#fbbf24' : '#d97706' },
      error: { main: isDark ? '#f87171' : '#dc2626' },
      action: {
        hover: isDark ? 'rgba(167,139,250,0.10)' : 'rgba(124,58,237,0.05)',
        selected: isDark ? 'rgba(139,92,246,0.18)' : 'rgba(124,58,237,0.10)',
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      h4: { fontWeight: 700, letterSpacing: -0.5 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      overline: { fontWeight: 600, letterSpacing: 1 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: isDark ? 'none' : '0 1px 2px rgba(15,23,42,0.06)',
          }),
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: ({ theme }) => ({ borderColor: theme.palette.divider }),
          head: ({ theme }) => ({ color: theme.palette.text.secondary, fontWeight: 600 }),
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    },
  });
}
