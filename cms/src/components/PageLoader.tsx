import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

/// Full-height centered spinner shown by route-level `loading.tsx` files while a
/// server component awaits box data. Keeps the nav shell visible (Next streams
/// this in place of the page content) so the CMS never looks frozen.
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
