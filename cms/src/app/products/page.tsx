import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { listProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

function inr(n: number, c: string): string {
  return (c === 'INR' ? '₹' : c + ' ') + Math.round(n).toLocaleString('en-IN');
}

export default function ProductsPage() {
  const products = listProducts();

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4">Products</Typography>
        <Button component={Link} href="/products/new" variant="contained" startIcon={<AddBoxIcon />}>
          Add product
        </Button>
      </Box>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Style</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="center">AI</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No products yet — add your first one.
                </TableCell>
              </TableRow>
            )}
            {products.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 44, height: 56, borderRadius: 1, overflow: 'hidden',
                        bgcolor: 'action.hover', flexShrink: 0,
                      }}
                    >
                      {p.heroImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.heroImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {p.name}
                      </Typography>
                      {p.brand && (
                        <Typography variant="caption" color="text.secondary">
                          {p.brand}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{p.gender}</TableCell>
                <TableCell>{p.styleArchetype || '—'}</TableCell>
                <TableCell align="right">{inr(p.basePrice, p.currency)}</TableCell>
                <TableCell align="center">
                  {p.aiEnriched ? <Chip label="AI" color="primary" size="small" /> : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Stack>
  );
}
