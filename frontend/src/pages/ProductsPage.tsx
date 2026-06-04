import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, Paper, Skeleton, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products';
import { getInventory, upsertInventory } from '../api/inventory';
import type { Product, ProductRequest, InventoryDTO, Inventory } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import notify from '../utils/notify';

export default function ProductsPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [inventories, setInventories] = useState<Record<number, Inventory>>({});
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductRequest>({ name: '', price: 0 });
  const [invForm, setInvForm] = useState<InventoryDTO>({ productId: 0, quantity: 0, lowStockThreshold: 10 });
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      const invMap: Record<number, Inventory> = {};
      await Promise.all(data.map(async p => {
        try {
          const inv = await getInventory(p.id);
          invMap[p.id] = inv;
        } catch { /* ignore */ }
      }));
      setInventories(invMap);
    } catch {
      notify.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditProduct(null);
    setForm({ name: '', price: 0 });
    setInvForm({ productId: 0, quantity: 0, lowStockThreshold: 10 });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.name, price: p.price });
    const inv = inventories[p.id];
    setInvForm({ productId: p.id, quantity: inv?.quantity ?? 0, lowStockThreshold: inv?.lowStockThreshold ?? 10 });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.price <= 0) { notify.warning('Enter valid name and price'); return; }
    try {
      setSaving(true);
      let pId = editProduct?.id;
      if (editProduct) {
        const updated = await updateProduct(editProduct.id, form);
        setProducts(ps => ps.map(x => x.id === updated.id ? updated : x));
      } else {
        const created = await createProduct(form);
        setProducts(ps => [...ps, created]);
        pId = created.id;
      }
      if (pId) {
        const updatedInv = await upsertInventory({ ...invForm, productId: pId });
        setInventories(prev => ({ ...prev, [pId!]: updatedInv }));
      }
      notify.success(editProduct ? 'Product updated' : 'Product created');
      setDialogOpen(false);
    } catch {
      notify.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct(deleteId);
      setProducts(ps => ps.filter(p => p.id !== deleteId));
      notify.success('Product deleted');
    } catch {
      notify.error('Failed to delete product');
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Products & Inventory</Typography>
        <Stack direction="row" spacing={1.5}>
          <TextField
            size="small" placeholder="Search products..."
            value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>New Product</Button>
        </Stack>
      </Box>

      {loading ? (
        <Stack spacing={1}>
          {[1,2,3,4].map(i => <Skeleton key={i} height={60} variant="rounded" />)}
        </Stack>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No products found</TableCell></TableRow>
              ) : filtered.map(p => {
                const inv = inventories[p.id];
                const isLowStock = inv && inv.quantity <= inv.lowStockThreshold;
                return (
                  <TableRow key={p.id}>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>#{p.id}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                    <TableCell align="right">₹{p.price.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <Typography sx={{ fontWeight: 600 }}>{inv?.quantity ?? 0}</Typography>
                        <Tooltip title="Update stock">
                          <IconButton size="small" onClick={() => openEdit(p)}><SyncAltIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {isLowStock ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: 'warning.main' }}>
                          <WarningAmberIcon fontSize="small" />
                          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Low Stock</Typography>
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: 12, color: 'success.main', fontWeight: 600 }}>In Stock</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(p)} sx={{ mr: 1 }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setDeleteId(p.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editProduct ? 'Edit Product' : 'New Product'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Product Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth />
            <TextField label="Price (₹)" type="number" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} fullWidth />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="Current Stock" type="number" value={invForm.quantity} onChange={e => setInvForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} fullWidth />
              <TextField label="Low Stock Threshold" type="number" value={invForm.lowStockThreshold} onChange={e => setInvForm(f => ({ ...f, lowStockThreshold: parseInt(e.target.value) || 0 }))} fullWidth />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null} title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete" confirmColor="error" danger
        onConfirm={confirmDelete} onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
