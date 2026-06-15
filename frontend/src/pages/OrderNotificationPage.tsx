import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  Paper,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { OrderResponse, OrderStatus } from "../types";

function formatINR(v?: number) {
  return `₹${(v ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function OrderNotificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as {
    order?: OrderResponse;
    outcome?: Extract<OrderStatus, "CONFIRMED" | "CANCELLED">;
  };
  const order = state.order;
  const outcome = state.outcome ?? order?.status;
  const isCancelled = outcome === "CANCELLED";
  const hasState = !!order;

  if (!hasState) {
    return (
      <Box sx={{ maxWidth: 480, mx: "auto", mt: 8, textAlign: "center" }}>
        <ShoppingBagIcon
          sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
        />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          No order data
        </Typography>
        <Typography sx={{ color: "text.secondary", mt: 1, mb: 3 }}>
          Please return to the orders dashboard.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/orders")}
        >
          Back to Orders
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Paper 
        sx={{ 
          overflow: "hidden", 
          borderRadius: "12px",
          border: "1px solid #e6e4dd",
          boxShadow: "0 12px 24px -10px rgba(25, 25, 25, 0.04)"
        }}
      >
        <Box
          sx={{
            p: 4,
            bgcolor: isCancelled ? "#fdf2f2" : "#edf7ed",
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderBottom: "1px solid #e6e4dd",
          }}
        >
          {isCancelled ? (
            <CancelIcon color="error" sx={{ fontSize: 32 }} />
          ) : (
            <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
          )}
          <Box>
            <Typography
              variant="h5"
              sx={{ color: isCancelled ? "#b91c1c" : "#15803d", mb: 0.5, fontWeight: 600, letterSpacing: "-0.02em" }}
            >
              Order {isCancelled ? "Cancelled" : "Confirmed"}
            </Typography>
            <Typography
              sx={{ fontSize: 14, color: isCancelled ? "#8a1c1c" : "#1e5e3a" }}
            >
              {isCancelled
                ? "The order has been cancelled."
                : "The order has been successfully confirmed."}
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {order && (
            <Stack spacing={3}>
              <Stack direction="row" spacing={1.5}>
                <Chip 
                  label={`Order #${order.id}`} 
                  size="small" 
                  sx={{ bgcolor: "#faf9f6", color: "#191919", border: "1px solid #e6e4dd", fontWeight: 600 }} 
                />
                <Chip
                  label={outcome}
                  size="small"
                  sx={{
                    bgcolor: isCancelled ? "#fdf2f2" : "#edf7ed",
                    color: isCancelled ? "#b91c1c" : "#15803d",
                    border: "1px solid rgba(0,0,0,0.02)",
                    fontWeight: 600
                  }}
                />
              </Stack>
              <Divider sx={{ borderColor: "#e6e4dd" }} />
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5 }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Placed
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: "#191919", mt: 0.5 }}>
                    {new Date(order.placedAt).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Total
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#191919", mt: 0.5 }}>
                    {formatINR(order.totalAmount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Coupon
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: "#191919", mt: 0.5 }}>{order.couponCode ?? "None"}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Address
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#191919", mt: 0.5 }}>{order.deliveryAddress}</Typography>
              </Box>
              <Divider sx={{ borderColor: "#e6e4dd" }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#191919" }}>Items</Typography>
              <Stack spacing={1.25}>
                {order.items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      px: 2,
                      py: 1.5,
                      bgcolor: "#faf9f6",
                      borderRadius: "8px",
                      border: "1px solid #e6e4dd",
                    }}
                  >
                    <Typography sx={{ fontSize: 14, color: "#191919" }}>
                      Product #{item.productId} (x{item.quantity})
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#191919" }}>
                      {formatINR(item.priceAtTime * item.quantity)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              <Divider sx={{ borderColor: "#e6e4dd" }} />
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ justifyContent: "flex-end" }}
              >
                <Button 
                  variant="outlined" 
                  onClick={() => navigate("/orders")}
                  sx={{ borderColor: "#e6e4dd", color: "#5e5e5e", "&:hover": { bgcolor: "#f3f1eb", borderColor: "#cbd5e1" } }}
                >
                  Back to Orders
                </Button>
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Paper>
    </Box>
  );
}
