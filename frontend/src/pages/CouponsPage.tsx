import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  setCouponActive,
  deleteCoupon,
} from "../api/coupons";
import type { CouponRequest, CouponResponse, DiscountType } from "../types";
import ConfirmDialog from "../components/ConfirmDialog";
import notify from "../utils/notify";
import { SearchBar } from "../components/SearchBar";
import { TableSkeleton } from "../components/SkeletonLoaders";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toErr(e: any, fallback: string) {
  return e?.response?.data?.message || e?.message || fallback;
}
function emptyForm(): CouponRequest {
  return {
    code: "",
    type: "PERCENTAGE",
    value: 0,
    expiryDate: new Date().toISOString().split("T")[0],
    active: true,
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
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(false);
  const [editCoupon, setEditCoupon] = useState<CouponResponse | null>(null);
  const [form, setForm] = useState<CouponRequest>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setCoupons(await getCoupons());
    } catch (e) {
      notify.error(toErr(e, "Failed to load coupons"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const openCreate = () => {
    setEditCoupon(null);
    setForm(emptyForm());
    setDialog(true);
  };
  const openEdit = (c: CouponResponse) => {
    setEditCoupon(c);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      expiryDate: c.expiryDate,
      active: c.active,
      usageLimit: c.usageLimit,
    });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      notify.warning("Code is required");
      return;
    }
    try {
      setSaving(true);
      const payload = { ...form, code: form.code.trim().toUpperCase() };
      if (editCoupon) {
        const updated = await updateCoupon(editCoupon.id, payload);
        setCoupons((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
        notify.success("Coupon updated");
      } else {
        const created = await createCoupon(payload);
        setCoupons((cs) => [created, ...cs]);
        notify.success("Coupon created");
      }
      setDialog(false);
    } catch (e) {
      notify.error(toErr(e, "Failed to save coupon"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c: CouponResponse) => {
    if (togglingIds.has(c.id)) return;
    const next = !c.active;
    setTogglingIds((s) => new Set(s).add(c.id));
    setCoupons((cs) =>
      cs.map((x) => (x.id === c.id ? { ...x, active: next } : x)),
    );
    try {
      await setCouponActive(c.id, next);
      notify.success(`Coupon ${next ? "activated" : "deactivated"}`);
    } catch (e) {
      setCoupons((cs) =>
        cs.map((x) => (x.id === c.id ? { ...x, active: c.active } : x)),
      );
      notify.error(toErr(e, "Failed to toggle coupon"));
    } finally {
      setTogglingIds((s) => {
        const n = new Set(s);
        n.delete(c.id);
        return n;
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCoupon(deleteId);
      setCoupons((cs) => cs.filter((c) => c.id !== deleteId));
      notify.success("Coupon deleted");
    } catch (e) {
      notify.error(toErr(e, "Failed to delete coupon"));
    } finally {
      setDeleteId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => notify.info(`Copied ${code}`));
  };
  const filtered = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 4,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: "#191919", letterSpacing: "-0.02em" }}
        >
          Coupons
        </Typography>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            width: { xs: "100%", sm: "auto" },
            justifyContent: "space-between",
          }}
        >
          <SearchBar
            placeholder="Search by code..."
            value={search}
            onSearchChange={setSearch}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{
              fontWeight: 500,
              borderRadius: "999px",
              whiteSpace: "nowrap",
            }}
          >
            New Coupon
          </Button>
        </Stack>
      </Box>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : (
        <TableContainer component={Paper}>
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
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 4, color: "text.secondary" }}
                  >
                    No coupons found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => {
                  const expired = isExpired(c.expiryDate);
                  const pct = usagePct(c.usedCount, c.usageLimit);
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            sx={{
                              fontFamily: '"Anthropic", "Cohere"',
                              fontWeight: 600,
                              fontSize: 13,
                              color:
                                c.active && !expired
                                  ? "#1d1d1f"
                                  : "text.secondary",
                              px: 1,
                              py: 0.5,
                              bgcolor: "#f3f1eb",
                              borderRadius: "4px",
                              border: "1px solid rgba(0,0,0,0.01)",
                            }}
                          >
                            {c.code}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => copyCode(c.code)}
                            sx={{ color: "text.secondary" }}
                          >
                            <ContentCopyIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            c.type === "PERCENTAGE" ? "Percentage" : "Flat"
                          }
                          size="small"
                          sx={{
                            bgcolor: "#f3f1eb",
                            color: "#5e5e5e",
                            fontWeight: 500,
                            fontSize: 12,
                            border: "1px solid rgba(0,0,0,0.01)",
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {c.type === "PERCENTAGE"
                          ? `${c.value}%`
                          : `₹${c.value}`}
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: 13,
                            color: expired ? "error.main" : "text.secondary",
                          }}
                        >
                          {c.expiryDate} {expired && "(Expired)"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "text.secondary",
                            mb: 0.5,
                          }}
                        >
                          {c.usedCount} / {c.usageLimit ?? "∞"}
                        </Typography>
                        {c.usageLimit && (
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          size="small"
                          checked={c.active}
                          disabled={togglingIds.has(c.id)}
                          onChange={() => handleToggle(c)}
                          color="success"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => openEdit(c)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteId(c.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#191919" }}>
            {editCoupon ? "Edit Coupon" : "New Coupon"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1.5 }}>
            <TextField
              label="Code"
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  code: e.target.value.toUpperCase().replace(/\s/g, ""),
                }))
              }
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as DiscountType,
                    value: 0,
                  }))
                }
              >
                <MenuItem value="PERCENTAGE">Percentage (%)</MenuItem>
                <MenuItem value="FLAT">Flat Amount (₹)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={
                form.type === "PERCENTAGE" ? "Discount (%)" : "Discount (₹)"
              }
              type="number"
              value={form.value || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  value: parseFloat(e.target.value) || 0,
                }))
              }
              fullWidth
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={form.expiryDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, expiryDate: e.target.value }))
              }
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Usage Limit (blank = unlimited)"
              type="number"
              value={form.usageLimit ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  usageLimit: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                }))
              }
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.active ?? true}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, active: e.target.checked }))
                  }
                  color="success"
                />
              }
              label={
                <Typography
                  sx={{ fontSize: 14, fontWeight: 500, color: "#191919" }}
                >
                  Active
                </Typography>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1.5, gap: 1 }}>
          <Button
            onClick={() => setDialog(false)}
            variant="text"
            color="secondary"
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ fontWeight: 500 }}
          >
            Save Coupon
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Coupon"
        message="Permanently delete this coupon?"
        confirmLabel="Delete"
        confirmColor="error"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
