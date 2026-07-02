import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  MenuItem,
  Select,
  Stack,
  InputLabel,
  TextField,
  Skeleton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  createOrder,
} from "../api/orders";
import { getProducts } from "../api/products";
import type {
  OrderResponse,
  OrderRequest,
  OrderStatus,
  Product,
  OrderItemRequest,
} from "../types";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import notify from "../utils/notify";
import { SearchBar } from "../components/SearchBar";
import { TableSkeleton } from "../components/SkeletonLoaders";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function formatINR(v?: number) {
  return `₹${(v ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");

  const [createDialog, setCreateDialog] = useState(false);
  const [form, setForm] = useState<OrderRequest>({
    userId: 1,
    deliveryAddress: "",
    couponCode: "",
    status: "PENDING",
    items: [{ productId: 0, quantity: 1, priceAtTime: 0 }],
  });
  const [saving, setSaving] = useState(false);

  const [detailDialog, setDetailDialog] = useState(false);
  const [detailOrder, setDetailOrder] = useState<OrderResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [statusDialog, setStatusDialog] = useState(false);
  const [statusOrder, setStatusOrder] = useState<OrderResponse | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("PENDING");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [actionIds, setActionIds] = useState<
    Record<number, "accepting" | "rejecting" | "processing">
  >({});

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [o, p] = await Promise.all([getOrders(), getProducts()]);
      setOrders(o.sort((a, b) => b.id - a.id));
      setProducts(p);
    } catch {
      notify.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        String(o.id).includes(q) ||
        o.deliveryAddress.toLowerCase().includes(q) ||
        (o.couponCode ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, search, statusFilter]);

  const resetForm = () =>
    setForm({
      userId: 1,
      deliveryAddress: "",
      couponCode: "",
      status: "PENDING",
      items: [{ productId: 0, quantity: 1, priceAtTime: 0 }],
    });
  const addItem = () =>
    setForm((f) => ({
      ...f,
      items: [...f.items, { productId: 0, quantity: 1, priceAtTime: 0 }],
    }));
  const removeItem = (i: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, patch: Partial<OrderItemRequest>) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    }));

  const handleCreate = async () => {
    if (!form.deliveryAddress.trim()) {
      notify.warning("Delivery address required");
      return;
    }
    try {
      setSaving(true);
      const created = await createOrder(form);
      setOrders((os) => [created, ...os]);
      setCreateDialog(false);
      notify.success(`Order #${created.id} created`);
    } catch {
      notify.error("Failed to create order");
    } finally {
      setSaving(false);
    }
  };

  const viewDetails = async (orderId: number) => {
    try {
      setDetailLoading(true);
      setDetailDialog(true);
      setDetailOrder(await getOrderById(orderId));
    } catch {
      notify.error("Failed to load details");
      setDetailDialog(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openStatusDialog = (o: OrderResponse) => {
    setStatusOrder(o);
    setNewStatus(o.status);
    setStatusDialog(true);
  };

  const handleStatusUpdate = async () => {
    if (!statusOrder) return;
    try {
      const updated = await updateOrderStatus(statusOrder.id, newStatus);
      setOrders((os) => os.map((o) => (o.id === updated.id ? updated : o)));
      if (detailOrder?.id === statusOrder.id) setDetailOrder(updated);
      setStatusDialog(false);
      notify.success("Status updated");
    } catch {
      notify.error("Failed to update status");
    }
  };

  const quickAction = async (order: OrderResponse, status: OrderStatus) => {
    if (actionIds[order.id]) return;
    setActionIds((p) => ({ ...p, [order.id]: "processing" }));
    try {
      const updated = await updateOrderStatus(order.id, status);
      setOrders((os) => os.map((o) => (o.id === updated.id ? updated : o)));
      if (detailOrder?.id === order.id) setDetailOrder(updated);
      notify.success(`Order marked as ${status.toLowerCase()}`);
    } catch {
      notify.error("Failed to update order");
    } finally {
      setActionIds((p) => {
        const n = { ...p };
        delete n[order.id];
        return n;
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteOrder(deleteId);
      setOrders((os) => os.filter((o) => o.id !== deleteId));
      notify.success("Order deleted");
    } catch {
      notify.error("Failed to delete order");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 4,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.02em" }}
        >
          Order Management
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: "stretch" }}
        >
          <SearchBar
            placeholder="Search orders..."
            value={search}
            onSearchChange={setSearch}
            sx={{ flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as OrderStatus | "ALL")
              }
              sx={{ borderRadius: "8px" }}
            >
              <MenuItem value="ALL">All statuses</MenuItem>
              {ALL_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={() => {
              resetForm();
              setCreateDialog(true);
            }}
            sx={{
              fontWeight: 500,
              borderRadius: "999px",
              whiteSpace: "nowrap",
            }}
          >
            New Order
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
                <TableCell>Order ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Address</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell sx={{ fontWeight: 600 }}>#{o.id}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={o.status}
                        onClick={() => openStatusDialog(o)}
                      />
                    </TableCell>
                    <TableCell>User #{o.userId}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 200,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {o.deliveryAddress}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatINR(o.totalAmount)}
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ justifyContent: "center" }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => viewDetails(o.id)}
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>

                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={o.status}
                            onChange={(e) =>
                              quickAction(o, e.target.value as OrderStatus)
                            }
                            disabled={!!actionIds[o.id]}
                            sx={{
                              height: 30,
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: "6px",
                              "& .MuiSelect-select": {
                                py: "4px",
                                px: "8px",
                              },
                            }}
                          >
                            {ALL_STATUSES.map((status) => (
                              <MenuItem
                                key={status}
                                value={status}
                                sx={{ fontSize: 12 }}
                              >
                                {status.charAt(0) +
                                  status.slice(1).toLowerCase()}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteId(o.id)}
                          title="Delete Order"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#1d1d1f" }}>
            Order #{detailOrder?.id}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          {detailLoading ? (
            <Skeleton height={200} />
          ) : (
            detailOrder && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box>
                      <StatusBadge status={detailOrder.status} />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>
                      {formatINR(detailOrder.totalAmount)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Placed
                    </Typography>
                    <Typography>
                      {new Date(detailOrder.placedAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Delivery
                    </Typography>
                    <Typography>{detailOrder.deliveryAddress}</Typography>
                  </Box>
                </Box>
                <Divider />
                <Typography variant="subtitle2">Items</Typography>
                {detailOrder.items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      p: 1.25,
                      bgcolor: "rgba(25, 25, 25, 0.02)",
                      borderRadius: 1,
                    }}
                  >
                    <Typography>
                      {productMap[item.productId]?.name ??
                        `Product #${item.productId}`}{" "}
                      (x{item.quantity})
                    </Typography>
                    <Typography sx={{ fontWeight: 600 }}>
                      {formatINR(item.priceAtTime * item.quantity)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1.5 }}>
          <Button
            onClick={() => setDetailDialog(false)}
            variant="outlined"
            sx={{ color: "text.secondary", borderColor: "#e6e4dd" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog */}
      <Dialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#1d1d1f" }}>
            New Order
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="User ID"
              type="number"
              value={form.userId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((f) => ({
                  ...f,
                  userId: parseInt(e.target.value) || 1,
                }))
              }
              fullWidth
            />
            <TextField
              label="Address"
              value={form.deliveryAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((f) => ({ ...f, deliveryAddress: e.target.value }))
              }
              fullWidth
            />
            <Divider>Items</Divider>
            {form.items.map((item, idx) => (
              <Stack key={idx} direction="row" spacing={1}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={item.productId}
                    onChange={(e) => {
                      const pid = Number(e.target.value);
                      updateItem(idx, {
                        productId: pid,
                        priceAtTime:
                          products.find((p) => p.id === pid)?.price ?? 0,
                      });
                    }}
                  >
                    {products.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  type="number"
                  size="small"
                  label="Qty"
                  value={item.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateItem(idx, { quantity: parseInt(e.target.value) || 1 })
                  }
                  sx={{ width: 80 }}
                />
                <IconButton
                  color="error"
                  onClick={() => removeItem(idx)}
                  disabled={form.items.length === 1}
                >
                  <RemoveCircleIcon />
                </IconButton>
              </Stack>
            ))}
            <Button startIcon={<AddCircleIcon />} onClick={addItem}>
              Add Item
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1.5, gap: 1 }}>
          <Button
            onClick={() => setCreateDialog(false)}
            variant="text"
            color="secondary"
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={saving}
            sx={{ fontWeight: 500 }}
          >
            Place Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialog}
        onClose={() => setStatusDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#1d1d1f" }}>
            Update Status
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 2 }}>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="order-status-label">Order Status</InputLabel>
            <Select
              labelId="order-status-label"
              label="Order Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              sx={{ borderRadius: "8px" }}
            >
              {ALL_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1.5, gap: 1 }}>
          <Button
            onClick={() => setStatusDialog(false)}
            variant="text"
            color="secondary"
            sx={{ color: "text.secondary" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusUpdate}
            sx={{ fontWeight: 500 }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Order"
        message="Permanently delete this order? This cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
