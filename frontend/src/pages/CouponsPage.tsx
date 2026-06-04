import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, FormControlLabel,
  IconButton, InputAdornment, InputLabel, LinearProgress, MenuItem,
  Paper, Select, Skeleton, Stack, Switch, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField,
  Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { getCoupons, createCoupon, updateCoupon, setCouponActive, deleteCoupon } from '../api/coupons';
import type { CouponRequest, CouponResponse, DiscountType } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import notify from '../utils/notify';

function toErr(e: any, fallback: string) {
  return e?.response?.data?.message || e?.message || fallback;
}

function emptyForm(): CouponRequest {
  return {
    code: '',
    type: 'PERCENTAGE',
    value: 0,
    expiryDate: new Date().toISOString().split('T')[0],
    active: true,
    usageLimit: undefined,
  };
}

function isExpired(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function usagePct(used: number, limit?: number) {
  if (!limit) return 0;
  return Math.min((used / limit) * 100, 100);
}

export default function CouponsPage() {
  const [coupons, setCoupons]       = useState<CouponResponse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [dialog, setDialog]         = useState(false);
  const [editCoupon, setEditCoupon] = useState<CouponResponse | null>(null);
  const [form, setForm]             = useState<CouponRequest>(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [deleteId, setDeleteId]     = useState<number | null>(null);
  const [deleting, setDeleting]     = useState(false);
  // Track which toggles are in-flight so we don't double-fire
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setCoupons(await getCoupons());
    } catch (e) {
      notify.error(toErr(e, 'Failed to load coupons'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditCoupon(null); setForm(emptyForm()); setDialog(true); };

  const openEdit = (c: CouponResponse) => {
    setEditCoupon(c);
    setForm({ code: c.code, type: c.type, value: c.value, expiryDate: c.expiryDate, active: c.active, usageLimit: c.usageLimit });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.code.trim())                            { notify.warning('Coupon code is required'); return; }
    if (form.value <= 0)                              { notify.warning('Value must be greater than 0'); return; }
    if (form.type === 'PERCENTAGE' && form.value > 100) { notify.warning('Percentage cannot exceed 100'); return; }
    if (!form.expiryDate)                             { notify.warning('Expiry date is required'); return; }
    const payload: CouponRequest = { ...form, code: form.code.trim().toUpperCase() };
    try {
      setSaving(true);
      if (editCoupon) {
        const updated = await updateCoupon(editCoupon.id, payload);
        setCoupons(cs => cs.map(c => c.id === updated.id ? updated : c));
        notify.success('Coupon updated');
      } else {
        const created = await createCoupon(payload);
        setCoupons(cs => [created, ...cs]);
        notify.success('Coupon created');
      }
      setDialog(false);
    } catch (e) {
      notify.error(toErr(e, 'Failed to save coupon'));
    } finally {
      setSaving(false);
    }
  };

  // Optimistic toggle — flip immediately, revert on error
  const handleToggle = async (c: CouponResponse) => {
    if (togglingIds.has(c.id)) return;
    const next = !c.active;
    setTogglingIds(s => new Set(s).add(c.id));
    // Optimistic update
    setCoupons(cs => cs.map(x => x.id === c.id ? { ...x, active: next } : x));
    try {
      await setCouponActive(c.id, next);
      notify.info(`Coupon ${c.code} ${next ? 'activated' : 'deactivated'}`);
    } catch (e) {
      // Revert on failure
      setCoupons(cs => cs.map(x => x.id === c.id ? { ...x, active: c.active } : x));
      notify.error(toErr(e, 'Failed to toggle coupon'));
    } finally {
      setTogglingIds(s => { const n = new Set(s); n.delete(c.id); return n; });
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await deleteCoupon(deleteId);
      setCoupons(cs => cs.filter(c => c.id !== deleteId));
      notify.success('Coupon deleted');
    } catch (e) {
      notify.error(toErr(e, 'Failed to delete coupon'));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => notify.info(`Copied ${code}`));
  };

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ animation: 'fadeInUp 0.4s ease both' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="overline" sx={{ color: '#6366f1' }}>DISCOUNTS</Typography>
          <Typography variant="h5" sx={{ color: '#f1f5f9' }}>Coupons</Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            size="small" placeholder="Search by code…"
            value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 15, color: '#475569' }} /></InputAdornment> }}
            sx={{ width: 200 }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} size="small">
            New Coupon
          </Button>
        </Stack>
      </Box>

      {/* Summary row */}
      {!loading && coupons.length > 0 && (
        <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
          <Chip label={`${coupons.filter(c => c.active).length} active`} size="small" color="success" />
          <Chip label={`${coupons.filter(c => !c.active).length} inactive`} size="small" />
          <Chip label={`${coupons.filter(c => isExpired(c.expiryDate)).length} expired`} size="small" color="error" />
        </Stack>
      )}

      {loading ? (
        <Stack spacing={1.5}>
          {[0,1,2,3].map(i => <Skeleton key={i} height={68} variant="rounded" sx={{ borderRadius: '10px' }} />)}
        </Stack>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell>Expiry</TableCell>
                <TableCell>Usage</TableCell>
                <TableCell align="center">Active</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8, color: '#475569' }}>
                    {search ? 'No coupons match your search' : 'No coupons yet — create your first one'}
                  </TableCell>
                </TableRow>
              ) : filtered.map(c => {
                const expired = isExpired(c.expiryDate);
                const pct     = usagePct(c.usedCount, c.usageLimit);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          sx={{
                            fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                            color: c.active && !expired ? '#818cf8' : '#475569',
                            px: 1.25, py: 0.4, borderRadius: '6px',
                            background: c.active && !expired ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)',
                            border: '1px solid',
                            borderColor: c.active && !expired ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {c.code}
                        </Typography>
                        <Tooltip title="Copy code">
                          <IconButton size="small" onClick={() => copyCode(c.code)} sx={{ color: '#334155', '&:hover': { color: '#6366f1' } }}>
                            <ContentCopyIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.type === 'PERCENTAGE' ? 'Percentage' : 'Flat'}
                        size="small"
                        sx={{
                          fontSize: 11, fontWeight: 700,
                          background: c.type === 'PERCENTAGE' ? 'rgba(139,92,246,0.12)' : 'rgba(6,182,212,0.12)',
                          color: c.type === 'PERCENTAGE' ? '#a78bfa' : '#22d3ee',
                          border: `1px solid ${c.type === 'PERCENTAGE' ? 'rgba(139,92,246,0.25)' : 'rgba(6,182,212,0.25)'}`,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>
                        {c.type === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography sx={{ fontSize: 13, color: expired ? '#ef4444' : '#94a3b8' }}>
                          {c.expiryDate}
                        </Typography>
                        {expired && <Typography sx={{ fontSize: 10.5, color: '#ef4444', fontWeight: 600 }}>EXPIRED</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ minWidth: 100 }}>
                        <Typography sx={{ fontSize: 12, color: '#94a3b8', mb: 0.5 }}>
                          {c.usedCount} / {c.usageLimit ?? '∞'}
                        </Typography>
                        {c.usageLimit && (
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              height: 4, borderRadius: 99,
                              '& .MuiLinearProgress-bar': {
                                background: pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#10b981',
                              },
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        size="small"
                        checked={c.active}
                        disabled={togglingIds.has(c.id)}
                        onChange={() => handleToggle(c)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: '#10b981' },
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Edit coupon">
                          <IconButton size="small" onClick={() => openEdit(c)} sx={{ color: '#6366f1' }}>
                            <EditIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete coupon">
                          <IconButton size="small" onClick={() => setDeleteId(c.id)} sx={{ color: '#ef4444' }}>
                            <DeleteIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ─── Create / Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editCoupon ? 'Edit Coupon' : 'New Coupon'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Code" value={form.code} required autoFocus
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
              fullWidth
              helperText="Uppercase letters and numbers only"
              inputProps={{ style: { fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' } }}
            />
            <FormControl fullWidth>
              <InputLabel>Discount Type</InputLabel>
              <Select
                label="Discount Type" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as DiscountType, value: 0 }))}
              >
                <MenuItem value="PERCENTAGE">Percentage (%)</MenuItem>
                <MenuItem value="FLAT">Flat Amount (₹)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={form.type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (₹)'}
              type="number" value={form.value || ''}
              onChange={e => setForm(f => ({ ...f, value: parseFloat(e.target.value) || 0 }))}
              fullWidth inputProps={{ min: 0, max: form.type === 'PERCENTAGE' ? 100 : undefined }}
            />
            <TextField
              label="Expiry Date" type="date" value={form.expiryDate}
              onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
              fullWidth InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Usage Limit (blank = unlimited)"
              type="number" value={form.usageLimit ?? ''}
              onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value ? parseInt(e.target.value) : undefined }))}
              fullWidth inputProps={{ min: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.active ?? true}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: '#10b981' } }}
                />
              }
              label={<Typography sx={{ fontSize: 13.5 }}>Active on creation</Typography>}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={16} color="inherit" /> : (editCoupon ? 'Save Changes' : 'Create Coupon')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirm ─────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Coupon"
        message={`Delete coupon "${coupons.find(c => c.id === deleteId)?.code}"? Any users who have this code will no longer be able to apply it.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleting}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
