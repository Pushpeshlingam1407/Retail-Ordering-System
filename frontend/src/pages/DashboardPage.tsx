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
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: "16px",
        border: "1px solid rgba(25, 25, 25, 0.08)",
        transition: "all var(--t-fast)",
        "&:hover": {
          transform: "translateY(-2.5px) scale(1.01)",
          borderColor: "#c8c6be",
          boxShadow: "0 12px 28px -6px rgba(25, 25, 25, 0.05)",
        },
      }}
    >
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
              fontWeight: 700,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: 28,
              fontWeight: 700,
              mt: 0.75,
              color: "#1d1d1f",
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "12px",
            bgcolor: bgColor,
            color: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(25, 25, 25, 0.04)",
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
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: "16px",
          color: "#1d1d1f",
          background: "#F5F3EB", // Claude sand warm beige
          border: "1px solid rgba(25, 25, 25, 0.08)",
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{
              letterSpacing: 2,
              color: "text.secondary",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            ADMIN CONSOLE
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mt: 1,
              color: "#1d1d1f",
              letterSpacing: "-0.03em",
            }}
          >
            Operations Dashboard
          </Typography>
          <Typography
            sx={{
              mt: 1.5,
              color: "text.secondary",
              fontSize: 14,
              maxWidth: 520,
              lineHeight: 1.5,
            }}
          >
            Overview of real-time store performance, system revenue tracking,
            coupon activations, and order fulfillment controls.
          </Typography>
        </Box>
        <Tooltip title="Refresh console data">
          <IconButton
            onClick={() => load()}
            sx={{
              color: "text.secondary",
              bgcolor: "rgba(25, 25, 25, 0.04)",
              "&:hover": { bgcolor: "rgba(25, 25, 25, 0.08)" },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Paper>

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
          color="#1d1d1f"
          bgColor="#f5f5f7"
        />
        <StatCard
          title="Revenue"
          value={formatINR(totalRevenue)}
          icon={<TrendingUpIcon fontSize="small" />}
          color="#34c759"
          bgColor="rgba(52, 199, 89, 0.08)"
        />
        <StatCard
          title="Products"
          value={String(products.length)}
          icon={<InventoryIcon fontSize="small" />}
          color="#ff9500"
          bgColor="rgba(255, 149, 0, 0.08)"
        />
        <StatCard
          title="Active Coupons"
          value={String(activeCoupons)}
          icon={<LocalOfferIcon fontSize="small" />}
          color="#0071e3"
          bgColor="rgba(0, 113, 227, 0.08)"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          gap: 3,
        }}
      >
        <Paper sx={{ borderRadius: "16px" }}>
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
            <Typography sx={{ fontWeight: 600, color: "#1d1d1f" }}>
              Recent Orders
            </Typography>
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
                      bgcolor: "var(--bg-hover)",
                    },
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{ fontWeight: 600, fontSize: 14, color: "#1d1d1f" }}
                    >
                      Order #{o.id}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}
                    >
                      User #{o.userId} ·{" "}
                      {new Date(o.placedAt).toLocaleDateString("en-IN")}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 600, mr: 3, color: "#1d1d1f" }}>
                    {formatINR(Number(o.totalAmount))}
                  </Typography>
                  <StatusBadge status={o.status} size="sm" />
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        <Stack spacing={3}>
          <Paper sx={{ p: 3, borderRadius: "16px" }}>
            <Typography sx={{ fontWeight: 600, mb: 2.5, color: "#1d1d1f" }}>
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
                        border: "1px solid rgba(0,0,0,0.01)",
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: "16px" }}>
            <Typography sx={{ fontWeight: 600, mb: 2.5, color: "#1d1d1f" }}>
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
