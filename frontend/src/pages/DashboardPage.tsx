import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
  Tooltip,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import InventoryIcon from "@mui/icons-material/Inventory";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Link } from "react-router-dom";
import { getOrders } from "../api/orders";
import { getCoupons } from "../api/coupons";
import { getProducts } from "../api/products";
import type { CouponResponse, OrderResponse, Product } from "../types";
import StatusBadge from "../components/StatusBadge";
import notify from "../utils/notify";

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function StatCard({
  title,
  value,
  icon,
  color,
  bgColor,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <Paper sx={{ p: 3, borderRadius: "12px" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {title}
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 700, mt: 0.75, color: "#191919", letterSpacing: "-0.02em" }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "10px",
            bgcolor: bgColor,
            color: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(0,0,0,0.01)"
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [o, c, p] = await Promise.all([
        getOrders(),
        getCoupons(),
        getProducts(),
      ]);
      setOrders(o);
      setCoupons(c);
      setProducts(p);
    } catch {
      notify.error("Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((o) => o.status === "DELIVERED")
        .reduce((s, o) => s + Number(o.totalAmount ?? 0), 0),
    [orders],
  );

  const activeCoupons = useMemo(
    () => coupons.filter((c) => c.active).length,
    [coupons],
  );

  const statusGroups = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    });
    return counts;
  }, [orders]);

  if (loading) {
    return (
      <Box>
        <Skeleton width={200} height={32} sx={{ mb: 3 }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 2,
            mb: 3,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={100} variant="rounded" />
          ))}
        </Box>
      </Box>
    );
  }

  const recentOrders = [...orders].sort((a, b) => b.id - a.id).slice(0, 8);

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h5">Operations Dashboard</Typography>
        <Tooltip title="Refresh">
          <IconButton
            size="small"
            onClick={() => load()}
            sx={{ color: "text.secondary" }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2.5,
          mb: 4,
        }}
      >
        <StatCard
          title="Total Orders"
          value={String(orders.length)}
          icon={<ShoppingCartIcon fontSize="small" />}
          color="#191919"
          bgColor="#f0ede6"
        />
        <StatCard
          title="Revenue"
          value={formatINR(totalRevenue)}
          icon={<TrendingUpIcon fontSize="small" />}
          color="#15803d"
          bgColor="#edf7ed"
        />
        <StatCard
          title="Products"
          value={String(products.length)}
          icon={<InventoryIcon fontSize="small" />}
          color="#b45309"
          bgColor="#fdf6e2"
        />
        <StatCard
          title="Active Coupons"
          value={String(activeCoupons)}
          icon={<LocalOfferIcon fontSize="small" />}
          color="#1d4ed8"
          bgColor="#edf2fe"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          gap: 3,
        }}
      >
        <Paper sx={{ borderRadius: "12px" }}>
          <Box
            sx={{
              px: 3,
              py: 2.5,
              borderBottom: "1px solid #e6e4dd",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography sx={{ fontWeight: 600, color: "#191919" }}>Recent Orders</Typography>
            <Button
              component={Link}
              to="/orders"
              size="small"
              endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
            >
              View all
            </Button>
          </Box>
          {recentOrders.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
              No orders yet
            </Box>
          ) : (
            <Box>
              {recentOrders.map((o, i) => (
                <Box
                  key={o.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 3,
                    py: 2.25,
                    borderBottom:
                      i < recentOrders.length - 1
                        ? "1px solid #e6e4dd"
                        : "none",
                    transition: "background var(--t-fast)",
                    "&:hover": {
                      bgcolor: "var(--bg-hover)"
                    }
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#191919" }}>
                      Order #{o.id}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}>
                      User #{o.userId} ·{" "}
                      {new Date(o.placedAt).toLocaleDateString("en-IN")}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 600, mr: 3, color: "#191919" }}>
                    {formatINR(Number(o.totalAmount))}
                  </Typography>
                  <StatusBadge status={o.status} size="sm" />
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: "12px" }}>
            <Typography sx={{ fontWeight: 600, mb: 2.5, color: "#191919" }}>
              Status Overview
            </Typography>
            <Stack spacing={1.75}>
              {[
                { status: "PENDING", label: "Pending", color: "#b45309" },
                { status: "CONFIRMED", label: "Confirmed", color: "#1d4ed8" },
                { status: "SHIPPED", label: "Shipped", color: "#8b5cf6" },
                { status: "DELIVERED", label: "Delivered", color: "#15803d" },
                { status: "CANCELLED", label: "Cancelled", color: "#b91c1c" },
              ].map((s) => {
                const count = statusGroups[s.status] ?? 0;
                return (
                  <Box
                    key={s.status}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
                      {s.label}
                    </Typography>
                    <Chip
                      label={count}
                      size="small"
                      sx={{
                        bgcolor: `${s.color}10`,
                        color: s.color,
                        fontWeight: 600,
                        border: "1px solid rgba(0,0,0,0.01)"
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: "12px" }}>
            <Typography sx={{ fontWeight: 600, mb: 2.5, color: "#191919" }}>
              Quick Actions
            </Typography>
            <Stack spacing={1.25}>
              <Button
                component={Link}
                to="/orders"
                variant="outlined"
                fullWidth
                sx={{ justifyContent: "flex-start", py: 1.25 }}
              >
                Manage Orders
              </Button>
              <Button
                component={Link}
                to="/products"
                variant="outlined"
                fullWidth
                sx={{ justifyContent: "flex-start", py: 1.25 }}
              >
                Manage Products
              </Button>
              <Button
                component={Link}
                to="/coupons"
                variant="outlined"
                fullWidth
                sx={{ justifyContent: "flex-start", py: 1.25 }}
              >
                Manage Coupons
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
}
