import React, { useEffect, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography, Chip,
  CircularProgress, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import { toast } from 'react-toastify';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products';
import { upsertInventory, getInventory } from '../api/inventory';
import type { Product, ProductRequest, Inventory, InventoryDTO } from '../types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Product dialog
  const [prodDialog, setProdDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState<ProductRequest>({ name: '', price: 0 });
  const [saving, setSaving] = useState(false);

  // Inventory dialog
  const [invDialog, setInvDialog] = useState(false);
  const [invProduct, setInvProduct] = useState<Product | null>(null);
  const [invForm, setInvForm] = useState<InventoryDTO>({ productId: 0, quantity: 0, lowStockThreshold: 5 });
  const [currentInv, setCurrentInv] = useState<Inventory | null>(null);
  const [invSaving, setInvSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditProduct(null);
    setProdForm({ name: '', price: 0 });
    setProdDialog(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setProdForm({ name: p.name, price: p.price });
    setProdDialog(true);
  };

  const handleSave = async () => {
    if (!prodForm.name.trim()) { toast.warning('Name is required'); return; }
    if (prodForm.price <= 0) { toast.warning('Price must be positive'); return; }
    try {
      setSaving(true);
      if (editProduct) {
        await updateProduct(editProduct.id, prodForm);
        toast.success('Product updated!');
      } else {
        await createProduct(prodForm);
        toast.success('Product created!');
      }
      setProdDialog(false);
      load();
    } catch {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      load();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const openInventory = async (p: Product) => {
    setInvProduct(p);
    setInvForm({ productId: p.id, quantity: 0, lowStockThreshold: 5 });
    setCurrentInv(null);
    try {
      const inv = await getInventory(p.id);
      setCurrentInv(inv);
      setInvForm({ productId: p.id, quantity: inv.quantity, lowStockThreshold: inv.lowStockThreshold });
    } catch {
      // no inventory yet — that's fine
    }
    setInvDialog(true);
  };

  const handleInvSave = async () => {
    try {
      setInvSaving(true);
      await upsertInventory(invForm);
      toast.success('Inventory updated!');
      setInvDialog(false);
    } catch {
      toast.error('Failed to update inventory');
    } finally {
      setInvSaving(false);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>
          Products
        </Typography>
        <TextField
          size="small"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 220 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Product
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: 'primary.main', color: 'white' } }}>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="right">Price (₹)</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No products found
                  </TableCell>
                </TableRow>
              ) : filtered.map((p, idx) => (
                <TableRow
                  key={p.id}
                  sx={{
                    bgcolor: idx % 2 === 0 ? 'background.paper' : 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <TableCell>
                    <Chip label={`#${p.id}`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                  <TableCell align="right">₹{p.price.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEdit(p)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Inventory"><IconButton size="small" color="success" onClick={() => openInventory(p)}><InventoryIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Product Dialog */}
      <Dialog open={prodDialog} onClose={() => setProdDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editProduct ? 'Edit Product' : 'New Product'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Product Name"
            value={prodForm.name}
            onChange={e => setProdForm(f => ({ ...f, name: e.target.value }))}
            fullWidth required
          />
          <TextField
            label="Price (₹)"
            type="number"
            value={prodForm.price}
            onChange={e => setProdForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
            fullWidth required
            inputProps={{ min: 0, step: 0.01 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProdDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Dialog */}
      <Dialog open={invDialog} onClose={() => setInvDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Inventory — <em>{invProduct?.name}</em>
          {currentInv && (
            <Typography variant="caption" display="block" color="text.secondary">
              Current stock: {currentInv.quantity} units
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Quantity"
            type="number"
            value={invForm.quantity}
            onChange={e => setInvForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
            fullWidth inputProps={{ min: 0 }}
          />
          <TextField
            label="Low Stock Threshold"
            type="number"
            value={invForm.lowStockThreshold}
            onChange={e => setInvForm(f => ({ ...f, lowStockThreshold: parseInt(e.target.value) || 0 }))}
            fullWidth inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleInvSave} disabled={invSaving}>
            {invSaving ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
