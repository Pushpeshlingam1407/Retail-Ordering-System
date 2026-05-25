import React, { useEffect, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputLabel,
  MenuItem, Paper, Select, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
  Divider, Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { toast } from 'react-toastify';
import { getOrders, createOrder, updateOrderStatus, deleteOrder } from '../api/orders';
import { getProducts } from '../api/products';
import type { OrderResponse, OrderRequest, OrderStatus, Product, OrderItemRequest } from '../types';

const STATUS_COLORS: Record<OrderStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

const ALL_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createDialog, setCreateDialog] = useState(false);
  const [form, setForm] = useState<OrderRequest>({
    userId: 1,
    deliveryAddress: '',
    couponCode: '',
    status: 'PENDING',
    items: [{ productId: 0, quantity: 1, priceAtTime: 0 }],
  });
  const [saving, setSaving] = useState(false);

  // Detail dialog
  const [detailDialog, setDetailDialog] = useState(false);
  const [detailOrder, setDetailOrder] = useState<OrderResponse | null>(null);

  // Status dialog
  const [statusDialog, setStatusDialog] = useState(false);
  const [statusOrder, setStatusOrder] = useState<OrderResponse | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('PENDING');

  const load = async () => {
    try {
      setLoading(true);
      const [o, p] = await Promise.all([getOrders(), getProducts()]);
      setOrders(o);
      setProducts(p);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({
    userId: 1,
    deliveryAddress: '',
    couponCode: '',
    status: 'PENDING',
    items: [{ productId: 0, quantity: 1, priceAtTime: 0 }],
  });

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: 0, quantity: 1, priceAtTime: 0 }] }));
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx: number, patch: Partial<OrderItemRequest>) =>
    setForm(f => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, ...patch } : item) }));

  const handleCreate = async () => {
    if (!form.deliveryAddress.trim()) { toast.warning('Delivery address is required'); return; }
    if (form.items.some(i => !i.productId || i.quantity < 1 || i.priceAtTime <= 0)) {
      toast.warning('Please fill all item fields correctly'); return;
    }
    try {
      setSaving(true);
      await createOrder(form);
      toast.success('Order placed!');
      setCreateDialog(false);
      resetForm();
      load();
    } catch {
      toast.error('Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  const openStatus = (o: OrderResponse) => {
    setStatusOrder(o);
    setNewStatus(o.status);
    setStatusDialog(true);
  };

  const handleStatusUpdate = async () => {
    if (!statusOrder) return;
    try {
      await updateOrderStatus(statusOrder.id, newStatus);
      toast.success('Status updated!');
      setStatusDialog(false);
      load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await deleteOrder(id);
      toast.success('Order deleted');
      load();
    } catch {
      toast.error('Failed to delete order');
    }
  };

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>Orders</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetForm(); setCreateDialog(true); }}>
          New Order
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
                <TableCell>User</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total (₹)</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Placed At</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No orders yet
                  </TableCell>
                </TableRow>
              ) : orders.map((o, idx) => (
                <TableRow key={o.id}
                  sx={{ bgcolor: idx % 2 === 0 ? 'background.paper' : 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
                  <TableCell><Chip label={`#${o.id}`} size="small" variant="outlined" /></TableCell>
                  <TableCell>User #{o.userId}</TableCell>
                  <TableCell>
                    <Chip
                      label={o.status}
                      color={STATUS_COLORS[o.status]}
                      size="small"
                      onClick={() => openStatus(o)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell align="right">₹{o.totalAmount?.toFixed(2) ?? '—'}</TableCell>
                  <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.deliveryAddress}
                  </TableCell>
                  <TableCell>{new Date(o.placedAt).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="View details">
                      <IconButton size="small" color="primary" onClick={() => { setDetailOrder(o); setDetailDialog(true); }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Change status">
                      <IconButton size="small" color="warning" onClick={() => openStatus(o)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(o.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Order Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Order</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField label="User ID" type="number" value={form.userId}
            onChange={e => setForm(f => ({ ...f, userId: parseInt(e.target.value) || 1 }))} fullWidth />
          <TextField label="Delivery Address" value={form.deliveryAddress} required
            onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))} fullWidth multiline rows={2} />
          <TextField label="Coupon Code (optional)" value={form.couponCode}
            onChange={e => setForm(f => ({ ...f, couponCode: e.target.value }))} fullWidth />

          <Divider><Typography variant="caption" color="text.secondary">Order Items</Typography></Divider>

          {form.items.map((item, idx) => (
            <Stack key={idx} direction="row" spacing={1} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Product</InputLabel>
                <Select label="Product" value={item.productId}
                  onChange={e => updateItem(idx, { productId: Number(e.target.value) })}>
                  {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Qty" type="number" size="small" value={item.quantity} sx={{ width: 70 }}
                onChange={e => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })} inputProps={{ min: 1 }} />
              <TextField label="Price" type="number" size="small" value={item.priceAtTime} sx={{ width: 100 }}
                onChange={e => updateItem(idx, { priceAtTime: parseFloat(e.target.value) || 0 })} inputProps={{ min: 0, step: 0.01 }} />
              <IconButton color="error" size="small" onClick={() => removeItem(idx)} disabled={form.items.length === 1}>
                <RemoveCircleIcon />
              </IconButton>
            </Stack>
          ))}
          <Button startIcon={<AddCircleIcon />} onClick={addItem} variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}>
            Add Item
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Place Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Order #{detailOrder?.id}</DialogTitle>
        <DialogContent>
          {detailOrder && (
            <Stack spacing={1.5}>
              <Typography><b>User:</b> #{detailOrder.userId}</Typography>
              <Typography><b>Status:</b> <Chip label={detailOrder.status} color={STATUS_COLORS[detailOrder.status]} size="small" /></Typography>
              <Typography><b>Address:</b> {detailOrder.deliveryAddress}</Typography>
              {detailOrder.couponCode && <Typography><b>Coupon:</b> {detailOrder.couponCode}</Typography>}
              {detailOrder.discount != null && <Typography><b>Discount:</b> ₹{detailOrder.discount}</Typography>}
              <Typography><b>Total:</b> ₹{detailOrder.totalAmount?.toFixed(2)}</Typography>
              <Typography><b>Placed:</b> {new Date(detailOrder.placedAt).toLocaleString()}</Typography>
              <Divider />
              <Typography fontWeight={700}>Items:</Typography>
              {detailOrder.items?.map(item => (
                <Box key={item.id} sx={{ pl: 1 }}>
                  <Typography variant="body2">
                    {productMap[item.productId]?.name ?? `Product #${item.productId}`} × {item.quantity} @ ₹{item.priceAtTime}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Status — Order #{statusOrder?.id}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={newStatus} onChange={e => setNewStatus(e.target.value as OrderStatus)}>
              {ALL_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStatusUpdate}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
