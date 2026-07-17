'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import InventoryIcon from '@mui/icons-material/Checkroom';
import AddBoxIcon from '@mui/icons-material/AddBox';
import PeopleIcon from '@mui/icons-material/Groups';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useColorMode } from '@/app/color-mode';

const DRAWER_WIDTH = 236;

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { href: '/products', label: 'Products', icon: <InventoryIcon /> },
  { href: '/products/new', label: 'Add / Enrich', icon: <AddBoxIcon /> },
  { href: '/salespeople', label: 'Salespeople', icon: <PeopleIcon /> },
];

export function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mode, toggle } = useColorMode();
  const active = (href: string) =>
    href === '/products' ? pathname === href : pathname.startsWith(href);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ color: 'primary.main', letterSpacing: 1, fontWeight: 800 }}>
            EBANI
          </Typography>
          <Typography variant="body2" sx={{ ml: 1.5, color: 'text.secondary' }}>
            Studio CMS
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={mode === 'dark' ? 'Switch to light' : 'Switch to dark'}>
            <IconButton onClick={toggle} color="inherit">
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        <Toolbar />
        <List sx={{ px: 1.5, pt: 2 }}>
          {NAV.map((item) => (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={active(item.href)}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon
                sx={{ minWidth: 40, color: active(item.href) ? 'primary.main' : 'text.secondary' }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    color: active(item.href) ? 'primary.main' : 'text.primary',
                    fontWeight: active(item.href) ? 600 : 500,
                  },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: `calc(100% - ${DRAWER_WIDTH}px)` }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
