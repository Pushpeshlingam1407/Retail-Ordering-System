import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuth } from "../context/AuthContext";
import { getOrders } from "../api/orders";
import { getCoupons } from "../api/coupons";
import type { CouponResponse, OrderResponse } from "../types";
import StatusBadge from "../components/StatusBadge";

function currency(value: number) {
  return `INR ${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getCoupons()])
      .then(([orderList, couponList]) => {
        setOrders(orderList);
        setCoupons(couponList);
      })
      .finally(() => setLoading(false));
  }, []);

  const deliveredTotal = useMemo(
    () =>
      orders
        .filter((o) => o.status === "DELIVERED")
        .reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0),
    [orders],
  );

  const activeCoupons = coupons.filter((c) => c.active).length;
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "50vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: "16px",
          color: "#1d1d1f",
          background: "#F5F3EB", // Claude sand warm beige
          border: "1px solid rgba(25, 25, 25, 0.08)",
          mb: 4,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            letterSpacing: 2,
            color: "text.secondary",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          CUSTOMER OVERVIEW
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
          Welcome, {user?.name ?? "User"}
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
          Track your active operator requests, apply promo entries, and audit
          previous purchases in the console.
        </Typography>
      </Paper>

      <Alert severity="info" sx={{ mb: 3.5, borderRadius: "8px" }}>
        You are logged in as a user account. Coupon announcements and order
        status emails will be sent automatically.
      </Alert>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: 3,
          mb: 4,
        }}
      >
        <Card
          elevation={0}
          sx={{
            transition: "all var(--t-fast)",
            "&:hover": {
              transform: "translateY(-2px)",
              borderColor: "#c8c6be",
              boxShadow: "0 8px 20px -6px rgba(25,25,25,0.04)",
            },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    fontSize: 11,
                    letterSpacing: "0.05em",
                  }}
                >
                  Orders placed
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "#1d1d1f",
                    mt: 0.75,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {orders.length}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
                >
                  {pendingOrders} pending confirmation
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "8px",
                  bgcolor: "#f5f5f7",
                  color: "#1d1d1f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShoppingCartIcon fontSize="small" />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            transition: "all var(--t-fast)",
            "&:hover": {
              transform: "translateY(-2px)",
              borderColor: "#c8c6be",
              boxShadow: "0 8px 20px -6px rgba(25,25,25,0.04)",
            },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    fontSize: 11,
                    letterSpacing: "0.05em",
                  }}
                >
                  Total Spent
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "#34c759",
                    mt: 0.75,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {currency(deliveredTotal)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
                >
                  From delivered orders
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "8px",
                  bgcolor: "rgba(52, 199, 89, 0.08)",
                  color: "#34c759",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AccountCircleIcon fontSize="small" />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            transition: "all var(--t-fast)",
            "&:hover": {
              transform: "translateY(-2px)",
              borderColor: "#c8c6be",
              boxShadow: "0 8px 20px -6px rgba(25,25,25,0.04)",
            },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    fontSize: 11,
                    letterSpacing: "0.05em",
                  }}
                >
                  Active Coupons
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "#0071e3",
                    mt: 0.75,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {activeCoupons}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block", mt: 0.5 }}
                >
                  Apply code at checkout
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "8px",
                  bgcolor: "rgba(0, 113, 227, 0.08)",
                  color: "#0071e3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LocalOfferIcon fontSize="small" />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
        }}
      >
        <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid #e6e4dd" }}>
          <Typography sx={{ fontWeight: 600, color: "#1d1d1f" }}>
            Recent Orders
          </Typography>
        </Box>
        <Box sx={{ p: 3 }}>
          {orders.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", textAlign: "center", py: 4 }}
            >
              No orders yet.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {orders.slice(0, 8).map((order) => (
                <Box
                  key={order.id}
                  sx={{
                    p: 2,
                    border: "1px solid #e6e4dd",
                    borderRadius: "10px",
                    bgcolor: "rgba(255, 255, 255, 0.4)",
                    transition: "all var(--t-fast)",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.75)",
                      transform: "translateY(-1px)",
                      borderColor: "#cbd5e1",
                      boxShadow: "0 4px 12px -4px rgba(25, 25, 25, 0.02)",
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "#1d1d1f" }}
                      >
                        Order #{order.id}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}
                      >
                        {new Date(order.placedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </Typography>
                    </Box>
                    <Stack
                      direction="row"
                      spacing={3}
                      sx={{ alignItems: "center" }}
                    >
                      <Typography
                        sx={{ fontWeight: 700, color: "#1d1d1f", fontSize: 15 }}
                      >
                        {currency(Number(order.totalAmount ?? 0))}
                      </Typography>
                      <StatusBadge status={order.status} size="sm" />
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
