'use client';

import { createTheme, type Theme } from '@mui/material/styles';

export type Mode = 'light' | 'dark';

// Professional slate + blue palette.
//  Light: white cards on a light-grey canvas, blue accent.
//  Dark:  slate-blue surfaces on a dark grey-blue canvas, brighter blue accent.
export function getTheme(mode: Mode): Theme {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? '#3b82f6' : '#2563eb', contrastText: '#ffffff' },
      secondary: { main: isDark ? '#38bdf8' : '#0ea5e9' },
      background: {
        default: isDark ? '#0f172a' : '#f3f5f9',
        paper: isDark ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e6edf6' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#516072',
      },
      divider: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.10)',
      success: { main: isDark ? '#34d399' : '#059669' },
      warning: { main: isDark ? '#fbbf24' : '#d97706' },
      error: { main: isDark ? '#f87171' : '#dc2626' },
      action: {
        hover: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(37,99,235,0.05)',
        selected: isDark ? 'rgba(59,130,246,0.16)' : 'rgba(37,99,235,0.10)',
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
