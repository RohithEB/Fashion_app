'use client';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import GridViewIcon from '@mui/icons-material/GridView';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import CollectionsIcon from '@mui/icons-material/Collections';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PersonAddIcon from '@mui/icons-material/PersonAddAlt';
import CircleIcon from '@mui/icons-material/FiberManualRecord';
import type { JourneyEvent } from '@/lib/salespeople';

type Meta = { icon: React.ReactNode; color: string; label: (e: JourneyEvent) => string };

const META: Record<string, Meta> = {
  session_start: { icon: <LoginIcon fontSize="small" />, color: '#0ea5e9', label: () => 'Started a session' },
  session_end: { icon: <LogoutIcon fontSize="small" />, color: '#0ea5e9', label: () => 'Ended the session' },
  catalog_shown: { icon: <GridViewIcon fontSize="small" />, color: '#3b82f6', label: () => 'Showed the collection' },
  product_shown: { icon: <CheckroomIcon fontSize="small" />, color: '#3b82f6', label: (e) => `Showed ${e.name ?? 'a product'}` },
  details_toggled: { icon: <InfoIcon fontSize="small" />, color: '#3b82f6', label: (e) => `${metaExpanded(e) ? 'Expanded' : 'Collapsed'} details` },
  cart_shown: { icon: <ShoppingCartIcon fontSize="small" />, color: '#3b82f6', label: () => 'Showed the cart on screen' },
  related_shown: { icon: <CollectionsIcon fontSize="small" />, color: '#3b82f6', label: () => 'Showed related media' },
  display_cleared: { icon: <ClearAllIcon fontSize="small" />, color: '#64748b', label: () => 'Cleared the screen' },
  cart_add: { icon: <AddShoppingCartIcon fontSize="small" />, color: '#10b981', label: (e) => `Added ${e.name ?? 'an item'} to cart` },
  recommendations_opened: { icon: <AutoAwesomeIcon fontSize="small" />, color: '#3b82f6', label: () => 'Opened recommendations' },
  checkout: { icon: <ReceiptLongIcon fontSize="small" />, color: '#10b981', label: (e) => `Checkout · #${e.refId ?? ''}` },
  customer_captured: { icon: <PersonAddIcon fontSize="small" />, color: '#0ea5e9', label: () => 'Captured a guest' },
};

function metaExpanded(e: JourneyEvent): boolean {
  try {
    return e.meta ? Boolean((JSON.parse(e.meta) as { expanded?: boolean }).expanded) : false;
  } catch {
    return false;
  }
}

function fallback(type: string): Meta {
  return { icon: <CircleIcon sx={{ fontSize: 12 }} />, color: '#64748b', label: () => type.replace(/_/g, ' ') };
}

function time(ts: string): string {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleTimeString();
}

// Group by session, newest session first, events oldest→newest within a session.
function groupBySession(journey: JourneyEvent[]): Array<{ sessionId: string | null; events: JourneyEvent[] }> {
  const order: Array<string | null> = [];
  const map = new Map<string | null, JourneyEvent[]>();
  for (const e of journey) {
    const key = e.sessionId ?? '—';
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key === '—' ? null : key);
    }
    map.get(key)!.push(e);
  }
  return order.map((sid) => ({
    sessionId: sid,
    events: [...(map.get(sid ?? '—') ?? [])].reverse(),
  }));
}

export function ActivityLogDialog({
  open,
  onClose,
  journey,
  name,
}: {
  open: boolean;
  onClose: () => void;
  journey: JourneyEvent[];
  name: string;
}) {
  const groups = groupBySession(journey);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ pr: 6 }}>
        Activity log — {name}
        <Typography variant="body2" color="text.secondary">
          {journey.length} events · what they clicked and showed, session by session
        </Typography>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {journey.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No activity recorded yet.
          </Typography>
        ) : (
          <Stack spacing={3}>
            {groups.map((g, gi) => (
              <Box key={gi}>
                <Chip
                  size="small"
                  label={`Session ${g.sessionId ? g.sessionId.slice(0, 12) : '—'} · ${g.events.length} steps`}
                  sx={{ mb: 1.5 }}
                />
                <Box sx={{ borderLeft: '2px solid', borderColor: 'divider', pl: 2 }}>
                  {g.events.map((e) => {
                    const m = META[e.eventType] ?? fallback(e.eventType);
                    return (
                      <Box key={e.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                        <Box
                          sx={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: m.color, bgcolor: 'action.hover',
                          }}
                        >
                          {m.icon}
                        </Box>
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          {m.label(e)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {time(e.ts)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
