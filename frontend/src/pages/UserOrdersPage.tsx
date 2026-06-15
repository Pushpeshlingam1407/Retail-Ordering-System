import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../context/AuthContext";
import { getOrdersByUser } from "../api/orders";
import type { OrderResponse } from "../types";
import StatusBadge from "../components/StatusBadge";
import notify from "../utils/notify";
import { useNavigate } from "react-router-dom";

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function UserOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getOrdersByUser(user.id)
      .then((data) => setOrders(data.sort((a, b) => b.id - a.id)))
      .catch(() => notify.error("Failed to load your orders"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={120}
              sx={{ borderRadius: "12px" }}
            />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#191919", letterSpacing: "-0.02em" }}>
          My Orders
        </Typography>
        <Typography sx={{ color: "text.secondary", mt: 0.5, fontSize: 14 }}>
          View and manage your previous orders
        </Typography>
      </Box>

      {orders.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            border: "1px solid #e6e4dd",
            borderRadius: "12px",
          }}
        >
          <SearchIcon sx={{ fontSize: 44, color: "text.secondary", mb: 2, opacity: 0.6 }} />
          <Typography
            sx={{ fontSize: 18, fontWeight: 600, color: "#191919", mb: 1 }}
          >
            No orders found
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 3, fontSize: 14 }}>
            You haven't placed any orders yet.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/shop")}
            sx={{
              bgcolor: "#191919",
              textTransform: "none",
              borderRadius: "8px",
              px: 4,
              py: 1.2,
              "&:hover": { bgcolor: "#2e2e2e" },
            }}
          >
            Start Shopping
          </Button>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {orders.map((order) => (
            <Paper
              key={order.id}
              elevation={0}
              sx={{
                p: 3,
                border: "1px solid #e6e4dd",
                borderRadius: "12px",
                transition: "all var(--t-base)",
                "&:hover": {
                  borderColor: "#c8c6be",
                  boxShadow: "0 12px 24px -10px rgba(25, 25, 25, 0.04), 0 4px 8px -2px rgba(25, 25, 25, 0.02)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    sx={{ fontSize: 16, fontWeight: 600, color: "#191919" }}
                  >
                    Order #{order.id}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}
                  >
                    Placed on {new Date(order.placedAt).toLocaleString()}
                  </Typography>
                </Box>
                <StatusBadge status={order.status} />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 3,
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
                      mb: 2,
                    }}
                  >
                    Items Ordered
                  </Typography>
                  <Stack spacing={1.5}>
                    {order.items.map((item) => (
                      <Box
                        key={item.productId}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography sx={{ fontSize: 14, color: "#191919" }}>
                          <Typography
                            component="span"
                            sx={{
                              color: "text.secondary",
                              fontWeight: 600,
                              mr: 1,
                            }}
                          >
                            {item.quantity}x
                          </Typography>{" "}
                          Product #{item.productId}
                        </Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#191919" }}>
                          {formatINR(Number(item.priceAtTime) * item.quantity)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Box
                  sx={{
                    bgcolor: "#faf9f6",
                    p: 2,
                    borderRadius: "10px",
                    border: "1px solid #e6e4dd",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mb: 2,
                    }}
                  >
                    Order Summary
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1.25,
                    }}
                  >
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                      Subtotal
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "#191919" }}>
                      {formatINR(
                        Number(order.totalAmount) +
                          (Number(order.discount) || 0),
                      )}
                    </Typography>
                  </Box>
                  {Number(order.discount) > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1.25,
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 13, color: "text.secondary" }}
                      >
                        Discount {order.couponCode && `(${order.couponCode})`}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "success.main",
                          fontWeight: 600,
                        }}
                      >
                        -{formatINR(Number(order.discount))}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1.25 }} />
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography
                      sx={{ fontSize: 14, fontWeight: 600, color: "#191919" }}
                    >
                      Total
                    </Typography>
                    <Typography
                      sx={{ fontSize: 15, fontWeight: 700, color: "#191919" }}
                    >
                      {formatINR(Number(order.totalAmount))}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<ReplayIcon />}
                  onClick={() => {
                    navigate("/shop");
                    notify.info(`We'll add a reorder feature soon!`);
                  }}
                  sx={{
                    textTransform: "none",
                    borderRadius: "8px",
                    fontWeight: 500,
                    borderColor: "#e6e4dd",
                    color: "#5e5e5e",
                    "&:hover": { bgcolor: "#f3f1eb", borderColor: "#c8c6be", color: "#191919" },
                  }}
                >
                  Order Again
                </Button>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
