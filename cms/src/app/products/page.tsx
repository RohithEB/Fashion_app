import Link from 'next/link';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { listProducts } from '@/lib/products';
import ProductsTable from './ProductsTable';

export const dynamic = 'force-dynamic';

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

      <Typography variant="body2" color="text.secondary">
        Click a row to see the product’s full details, images, colours and enrichment.
      </Typography>

      <ProductsTable products={products} />
    </Stack>
  );
}
