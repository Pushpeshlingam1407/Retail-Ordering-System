import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, IconButton, InputAdornment, InputLabel, MenuItem,
  Paper, Select, Skeleton, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography, CircularProgress,
  Badge, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowUpIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownIcon from '@mui/icons-material/ArrowDownward';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products';
import { upsertInventory, getInventory } from '../api/inventory';
import type { Product, ProductRequest, Inventory, InventoryDTO } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import notify from '../utils/notify';

type SortField = 'id' | 'name' | 'price';
type SortDir   = 'asc' | 'desc';

function imageForProduct(id: number) {
  return `https://picsum.photos/seed/rp-${id}/400/300`;
}

export default function ProductsPage() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDir, setSortDir]     = useState<SortDir>('asc');
  const [viewMode, setViewMode]   = useState<'table' | 'grid'>('table');

  // Inventory map (productId → Inventory | null)
  const [invMap, setInvMap]       = useState<Record<number, Inventory | null>>({});

  // Product dialog
  const [prodDialog, setProdDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm]   = useState<ProductRequest>({ name: '', price: 0 });
  const [saving, setSaving]       = useState(false);

  // Inventory dialog
  const [invDialog, setInvDialog] = useState(false);
  const [invProduct, setInvProduct] = useState<Product | null>(null);
  const [invForm, setInvForm]     = useState<InventoryDTO>({ productId: 0, quantity: 0, lowStockThreshold: 5 });
  const [invSaving, setInvSaving] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId]   = useState<number | null>(null);
  const [deleting, setDeleting]   = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      // Load inventory for each product in parallel
      const entries = await Promise.all(
        data.map(async p => {
          try { return [p.id, await getInventory(p.id)] as const; }
          catch { return [p.id, null] as const; }
        })
      );
      setInvMap(Object.fromEntries(entries));
    } catch {
      notify.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditProduct(null); setProdForm({ name: '', price: 0 }); setProdDialog(true); };
  const openEdit   = (p: Product) => { setEditProduct(p); setProdForm({ name: p.name, price: p.price }); setProdDialog(true); };

  const handleSave = async () => {
    if (!prodForm.name.trim())  { notify.warning('Product name is required'); return; }
    if (prodForm.price <= 0)    { notify.warning('Price must be greater than 0'); return; }
    try {
      setSaving(true);
      if (editProduct) {
        const updated = await updateProduct(editProduct.id, prodForm);
        setProducts(ps => ps.map(p => p.id === updated.id ? updated : p));
        notify.success('Product updated');
      } else {
        const created = await createProduct(prodForm);
        setProducts(ps => [created, ...ps]);
        notify.success('Product created');
      }
      setProdDialog(false);
    } catch {
      notify.error(editProduct ? 'Failed to update product' : 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await deleteProduct(deleteId);
      setProducts(ps => ps.filter(p => p.id !== deleteId));
      notify.success('Product deleted');
    } catch {
      notify.error('Failed to delete product');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const openInventory = async (p: Product) => {
    setInvProduct(p);
    setInvForm({ productId: p.id, quantity: 0, lowStockThreshold: 5 });
    const existing = invMap[p.id];
    if (existing) setInvForm({ productId: p.id, quantity: existing.quantity, lowStockThreshold: existing.lowStockThreshold });
    setInvDialog(true);
  };

  const handleInvSave = async () => {
    try {
      setInvSaving(true);
      const updated = await upsertInventory(invForm);
      setInvMap(m => ({ ...m, [invForm.productId]: updated }));
      notify.success('Inventory updated');
      setInvDialog(false);
    } catch {
      notify.error('Failed to update inventory');
    } finally {
      setInvSaving(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    return products
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'name')  cmp = a.name.localeCompare(b.name);
        if (sortField === 'price') cmp = a.price - b.price;
        if (sortField === 'id')    cmp = a.id - b.id;
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [products, search, sortField, sortDir]);

  const lowStockCount = Object.values(invMap).filter(inv => inv && inv.quantity <= inv.lowStockThreshold).length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ArrowUpIcon sx={{ fontSize: 12, ml: 0.5 }} /> : <ArrowDownIcon sx={{ fontSize: 12, ml: 0.5 }} />;
  };

  const stockColor = (inv: Inventory | null) => {
    if (!inv) return '#475569';
    if (inv.quantity === 0) return '#ef4444';
    if (inv.quantity <= inv.lowStockThreshold) return '#f59e0b';
    return '#10b981';
  };

  return (
    <Box sx={{ animation: 'fadeInUp 0.4s ease both' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="overline" sx={{ color: '#6366f1' }}>CATALOGUE</Typography>
          <Typography variant="h5" sx={{ color: '#f1f5f9' }}>Products</Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          {lowStockCount > 0 && (
            <Chip
              icon={<WarningAmberIcon sx={{ fontSize: 13 }} />}
              label={`${lowStockCount} low stock`}
              size="small" color="warning"
            />
          )}
          <TextField
            size="small" placeholder="Search products…"
            value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: '#475569' }} /></InputAdornment> }}
            sx={{ minWidth: 200 }}
          />
          <ToggleButtonGroup
            size="small" value={viewMode}
            exclusive onChange={(_, v) => v && setViewMode(v)}
            sx={{ '& .MuiToggleButton-root': { border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px !important', px: 1.25, py: 0.6, color: '#475569', '&.Mui-selected': { color: '#6366f1', background: 'rgba(99,102,241,0.12)' } } }}
          >
            <ToggleButton value="table"><ViewListIcon sx={{ fontSize: 16 }} /></ToggleButton>
            <ToggleButton value="grid"><GridViewIcon sx={{ fontSize: 16 }} /></ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} size="small">
            Add Product
          </Button>
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          {[0,1,2,3,4,5].map(i => <Skeleton key={i} height={220} variant="rounded" sx={{ borderRadius: '14px' }} />)}
        </Box>
      ) : viewMode === 'table' ? (
        /* ─── Table View ─────────────────────────────────────────────────── */
        <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell onClick={() => toggleSort('id')} sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { color: '#6366f1' } }}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>ID <SortIcon field="id" /></Box>
                </TableCell>
                <TableCell>Image</TableCell>
                <TableCell onClick={() => toggleSort('name')} sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { color: '#6366f1' } }}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>Name <SortIcon field="name" /></Box>
                </TableCell>
                <TableCell onClick={() => toggleSort('price')} align="right" sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { color: '#6366f1' } }}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end' }}>Price <SortIcon field="price" /></Box>
                </TableCell>
                <TableCell align="center">Stock</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8, color: '#475569' }}>
                    {search ? 'No products match your search' : 'No products yet — add your first one'}
                  </TableCell>
                </TableRow>
              ) : filtered.map(p => {
                const inv = invMap[p.id];
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>#{p.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        component="img"
                        src={imageForProduct(p.id)}
                        alt={p.name}
                        sx={{ width: 44, height: 44, borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.07)' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13.5 }}>{p.name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#f1f5f9', fontVariantNumeric: 'tabular-nums' }}>
                      ₹{p.price.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="center">
                      {inv === undefined ? (
                        <Skeleton width={60} height={22} variant="rounded" sx={{ mx: 'auto' }} />
                      ) : (
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.4, borderRadius: 99, background: `${stockColor(inv)}18`, border: `1px solid ${stockColor(inv)}40` }}>
                          <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: stockColor(inv) }} />
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: stockColor(inv) }}>
                            {inv ? `${inv.quantity} units` : 'No record'}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Edit product"><IconButton size="small" onClick={() => openEdit(p)} sx={{ color: '#6366f1' }}><EditIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                        <Tooltip title="Manage inventory"><IconButton size="small" onClick={() => openInventory(p)} sx={{ color: '#10b981' }}><InventoryIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                        <Tooltip title="Delete product"><IconButton size="small" onClick={() => setDeleteId(p.id)} sx={{ color: '#ef4444' }}><DeleteIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* ─── Grid View ─────────────────────────────────────────────────── */
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          {filtered.map(p => {
            const inv = invMap[p.id];
            const isLow  = inv && inv.quantity <= inv.lowStockThreshold;
            const isOut  = inv && inv.quantity === 0;
            return (
              <Box
                key={p.id}
                className="glow-card"
                sx={{ borderRadius: '14px', background: '#111827', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}
              >
                <Box sx={{ position: 'relative' }}>
                  <Box component="img" src={imageForProduct(p.id)} alt={p.name} sx={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
                  {(isLow || isOut) && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <Chip label={isOut ? 'Out of stock' : 'Low stock'} size="small" color={isOut ? 'error' : 'warning'} sx={{ fontSize: 10.5 }} />
                    </Box>
                  )}
                </Box>
                <Box sx={{ p: 1.75 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#f1f5f9', mb: 0.25 }} noWrap>{p.name}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: '#475569', mb: 1 }}>#{p.id}</Typography>
                  <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#6366f1' }}>₹{p.price.toLocaleString('en-IN')}</Typography>
                  <Divider sx={{ my: 1.25, borderColor: 'rgba(255,255,255,0.06)' }} />
                  <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p)} sx={{ color: '#6366f1' }}><EditIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
                    <Tooltip title="Inventory"><IconButton size="small" onClick={() => openInventory(p)} sx={{ color: '#10b981' }}><InventoryIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteId(p.id)} sx={{ color: '#ef4444' }}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
                  </Stack>
                </Box>
              </Box>
            );
          })}
          {filtered.length === 0 && (
            <Box sx={{ gridColumn: '1 / -1', py: 8, textAlign: 'center' }}>
              <Typography sx={{ color: '#475569', fontSize: 13 }}>No products found</Typography>
            </Box>
          )}
        </Box>
      )}

      {/* ─── Product Dialog ─────────────────────────────────────────────── */}
      <Dialog open={prodDialog} onClose={() => setProdDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editProduct ? 'Edit Product' : 'New Product'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Product Name" value={prodForm.name} required autoFocus
              onChange={e => setProdForm(f => ({ ...f, name: e.target.value }))} fullWidth
            />
            <TextField
              label="Price (₹)" type="number" value={prodForm.price || ''} required
              onChange={e => setProdForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProdDialog(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={16} color="inherit" /> : (editProduct ? 'Save Changes' : 'Create Product')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Inventory Dialog ───────────────────────────────────────────── */}
      <Dialog open={invDialog} onClose={() => setInvDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box>
            Inventory — <em style={{ fontStyle: 'normal', color: '#818cf8' }}>{invProduct?.name}</em>
            {invMap[invProduct?.id ?? -1] && (
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mt: 0.25, fontStyle: 'normal' }}>
                Current: {invMap[invProduct!.id]!.quantity} units · Threshold: {invMap[invProduct!.id]!.lowStockThreshold}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Quantity" type="number" value={invForm.quantity}
              onChange={e => setInvForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
              fullWidth inputProps={{ min: 0 }}
              helperText="Total units available for this product"
            />
            <TextField
              label="Low Stock Threshold" type="number" value={invForm.lowStockThreshold}
              onChange={e => setInvForm(f => ({ ...f, lowStockThreshold: parseInt(e.target.value) || 0 }))}
              fullWidth inputProps={{ min: 0 }}
              helperText="Alert when stock drops at or below this number"
            />
            {invForm.quantity <= invForm.lowStockThreshold && invForm.quantity >= 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: '8px', background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <WarningAmberIcon sx={{ fontSize: 15, color: '#f59e0b', flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12, color: '#fbbf24' }}>
                  This quantity is at or below the low-stock threshold.
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvDialog(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" color="success" onClick={handleInvSave} disabled={invSaving}>
            {invSaving ? <CircularProgress size={16} color="inherit" /> : 'Update Inventory'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirm ─────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${products.find(p => p.id === deleteId)?.name}"? This action cannot be undone and will remove all associated inventory records.`}
        confirmLabel="Delete Product"
        confirmColor="error"
        loading={deleting}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
