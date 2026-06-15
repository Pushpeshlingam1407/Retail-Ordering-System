import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import SellIcon from "@mui/icons-material/Sell";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import { useAuth } from "../context/AuthContext";
import { getProducts } from "../api/products";
import { getInventory } from "../api/inventory";
import { getCouponByCode } from "../api/coupons";
import { createOrder } from "../api/orders";
import type { CouponResponse, Product } from "../types";
import notify from "../utils/notify";
import { useNavigate } from "react-router-dom";

interface CartLine {
  productId: number;
  quantity: number;
}
interface DeliveryForm {
  line1: string;
  landmark: string;
  city: string;
  state: string;
  postalCode: string;
}

const CART_KEY = (uid: number) => `retail_cart_${uid}`;
const DELIVERY_KEY = (uid: number) => `retail_delivery_${uid}`;

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
function imageForProduct(product: Product) {
  return `https://placehold.co/400x300/e2e8f0/0f172a?text=${encodeURIComponent(product.name)}`;
}

export default function CartPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Record<number, number | null>>({});

  const [cartLoaded, setCartLoaded] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [delivery, setDelivery] = useState<DeliveryForm>({
    line1: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [deliveryErrors, setDeliveryErrors] = useState<Partial<DeliveryForm>>(
    {},
  );

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResponse | null>(
    null,
  );
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDelivery((d) => ({
      ...d,
      line1: user.address?.trim() || d.line1,
      city: user.city?.trim() || d.city,
      state: user.state?.trim() || d.state,
      postalCode: user.postalCode?.trim() || d.postalCode,
    }));
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const raw = sessionStorage.getItem(CART_KEY(user.id));
      const rawDel = sessionStorage.getItem(DELIVERY_KEY(user.id));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setCart(JSON.parse(raw));
      if (rawDel) setDelivery(JSON.parse(rawDel));
    } catch {
      /* ignore */
    } finally {
      setCartLoaded(true);
    }
  }, [user?.id]);

  useEffect(() => {
    const load = async () => {
      try {
        const productList = await getProducts();
        setProducts(productList);
        const invEntries = await Promise.all(
          productList.map(async (p) => {
            try {
              return [p.id, (await getInventory(p.id)).quantity] as const;
            } catch {
              return [p.id, null] as const;
            }
          }),
        );
        setInventory(Object.fromEntries(invEntries));
      } catch {
        notify.error("Failed to load product details");
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!user?.id || !cartLoaded) return;
    sessionStorage.setItem(CART_KEY(user.id), JSON.stringify(cart));
    sessionStorage.setItem(DELIVERY_KEY(user.id), JSON.stringify(delivery));
  }, [cart, delivery, user?.id, cartLoaded]);

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products],
  );
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (s, l) => s + (productMap[l.productId]?.price ?? 0) * l.quantity,
        0,
      ),
    [cart, productMap],
  );
  const payable = Math.max(subtotal - discountAmount, 0);

  const setField = (k: keyof DeliveryForm, v: string) =>
    setDelivery((d) => ({ ...d, [k]: v }));

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      setCart((c) => c.filter((l) => l.productId !== productId));
    } else {
      setCart((c) =>
        c.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l)),
      );
    }
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponInput("");
  };

  const applyCoupon = async () => {
    if (!couponInput.trim()) {
      notify.warning("Enter a coupon code first");
      return;
    }
    if (subtotal <= 0) {
      notify.warning("Add items to cart first");
      return;
    }
    try {
      setCouponLoading(true);
      const coupon = await getCouponByCode(couponInput.trim().toUpperCase());
      if (!coupon.active) {
        notify.error("This coupon is not active");
        return;
      }
      const today = new Date();
      if (
        new Date(coupon.expiryDate) <
        new Date(today.getFullYear(), today.getMonth(), today.getDate())
      ) {
        notify.error("This coupon has expired");
        return;
      }
      if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
        notify.error("Coupon usage limit reached");
        return;
      }
      const discount =
        coupon.type === "PERCENTAGE"
          ? (subtotal * Number(coupon.value)) / 100
          : Math.min(subtotal, Number(coupon.value));
      setAppliedCoupon(coupon);
      setDiscountAmount(discount);
      setCouponInput(coupon.code);
      notify.success(`Coupon applied: ${formatINR(discount)} off`);
    } catch {
      notify.error("Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponInput("");
    notify.info("Coupon removed");
  };

  const buildAddress = () => {
    const errs: Partial<DeliveryForm> = {};
    if (!delivery.line1.trim()) errs.line1 = "Required";
    if (!delivery.city.trim()) errs.city = "Required";
    if (!delivery.state.trim()) errs.state = "Required";
    if (!/^\d{6}$/.test(delivery.postalCode.trim()))
      errs.postalCode = "Must be 6 digits";
    setDeliveryErrors(errs);
    if (Object.keys(errs).length > 0) return null;
    return [
      delivery.line1.trim(),
      delivery.landmark.trim(),
      `${delivery.city.trim()}, ${delivery.state.trim()} ${delivery.postalCode.trim()}`,
    ]
      .filter(Boolean)
      .join(", ");
  };

  const placeOrder = async () => {
    if (!user?.id) return;
    if (cart.length === 0) {
      notify.warning("Your cart is empty");
      return;
    }
    const deliveryAddress = buildAddress();
    if (!deliveryAddress) {
      notify.warning("Complete all delivery details");
      return;
    }

    for (const line of cart) {
      const stock = inventory[line.productId];
      if (stock != null && stock < line.quantity) {
        notify.error(
          `${productMap[line.productId]?.name ?? "A product"} has insufficient stock`,
        );
        return;
      }
    }

    try {
      setPlacingOrder(true);
      const created = await createOrder({
        userId: user.id,
        deliveryAddress,
        couponCode: appliedCoupon?.code,
        status: "PENDING",
        items: cart.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          priceAtTime: productMap[l.productId]?.price ?? 0,
        })),
      });
      clearCart();
      notify.success(`Order #${created.id} placed successfully`);
      navigate("/my-orders");
    } catch {
      notify.error("Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#191919", letterSpacing: "-0.02em" }}>
          Shopping Cart
        </Typography>
      </Box>

      {cart.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            border: "1px solid #e6e4dd",
            borderRadius: "12px",
          }}
        >
          <ShoppingBagIcon sx={{ fontSize: 44, color: "text.secondary", mb: 2, opacity: 0.6 }} />
          <Typography
            sx={{ fontSize: 18, fontWeight: 600, color: "#191919", mb: 1 }}
          >
            Your cart is empty
          </Typography>
          <Typography sx={{ color: "text.secondary", mb: 3, fontSize: 14 }}>
            Looks like you haven't added anything to your cart yet.
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
            Continue Shopping
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.5fr 1fr" },
            gap: 4,
          }}
        >
          {/* Cart Items */}
          <Box>
            <Typography sx={{ fontWeight: 600, mb: 2, fontSize: 16 }}>
              Items ({cart.reduce((a, c) => a + c.quantity, 0)})
            </Typography>
            <Stack spacing={2}>
              {cart.map((line) => {
                const product = productMap[line.productId];
                if (!product) return null;
                return (
                  <Paper
                    key={line.productId}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: "1px solid #e6e4dd",
                      borderRadius: "12px",
                      display: "flex",
                      gap: 2,
                    }}
                  >
                    <Box
                      component="img"
                      src={imageForProduct(product)}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: "8px",
                        objectFit: "cover",
                        bgcolor: "#faf9f6",
                      }}
                    />
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        sx={{ fontWeight: 600, color: "#191919", fontSize: 15 }}
                      >
                        {product.name}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.5, mb: 0.5 }}>
                        {product.brand?.name} · {product.category?.name} · {product.packaging}
                      </Typography>
                      <Typography
                        sx={{ color: "text.secondary", fontSize: 13 }}
                      >
                        {formatINR(product.price)} each
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: "center",
                          bgcolor: "#faf9f6",
                          p: 0.5,
                          borderRadius: "8px",
                          border: "1px solid #e6e4dd",
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            updateQty(product.id, line.quantity - 1)
                          }
                          sx={{ color: "#5e5e5e", "&:hover": { bgcolor: "#f3f1eb" } }}
                        >
                          <RemoveIcon fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            minWidth: 20,
                            textAlign: "center",
                            fontSize: 14,
                            color: "#191919"
                          }}
                        >
                          {line.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() =>
                            updateQty(product.id, line.quantity + 1)
                          }
                          sx={{ color: "#191919", "&:hover": { bgcolor: "#f3f1eb" } }}
                        >
                          <AddIcon fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: 15,
                          minWidth: 80,
                          textAlign: "right",
                          color: "#191919"
                        }}
                      >
                        {formatINR(product.price * line.quantity)}
                      </Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-start" }}>
              <Button
                variant="text"
                color="error"
                onClick={clearCart}
                startIcon={<DeleteOutlineIcon />}
              >
                Clear Cart
              </Button>
            </Box>
          </Box>

          {/* Checkout Summary */}
          <Box>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: "1px solid #e6e4dd",
                borderRadius: "12px",
                position: "sticky",
                top: 24,
              }}
            >
              <Typography sx={{ fontWeight: 600, mb: 2.5, fontSize: 16, color: "#191919" }}>
                Order Summary
              </Typography>

              {/* Delivery Details */}
              <Box sx={{ mb: 3 }}>
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
                  Delivery Address
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    size="small"
                    label="Address line"
                    value={delivery.line1}
                    onChange={(e) => setField("line1", e.target.value)}
                    error={!!deliveryErrors.line1}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Landmark (optional)"
                    value={delivery.landmark}
                    onChange={(e) => setField("landmark", e.target.value)}
                    fullWidth
                  />
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      label="City"
                      value={delivery.city}
                      onChange={(e) => setField("city", e.target.value)}
                      error={!!deliveryErrors.city}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="State"
                      value={delivery.state}
                      onChange={(e) => setField("state", e.target.value)}
                      error={!!deliveryErrors.state}
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    size="small"
                    label="Postal code"
                    value={delivery.postalCode}
                    onChange={(e) =>
                      setField(
                        "postalCode",
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    error={!!deliveryErrors.postalCode}
                    fullWidth
                  />
                </Stack>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Coupons */}
              <Box sx={{ mb: 3 }}>
                {appliedCoupon ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderRadius: "8px",
                      bgcolor: "#f3f1eb",
                      border: "1px solid #e6e4dd",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <SellIcon
                        fontSize="small"
                        sx={{ color: "#191919" }}
                      />
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#191919" }}>
                        {appliedCoupon.code}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={removeCoupon} sx={{ color: "#5e5e5e" }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    />
                    <Button
                      variant="outlined"
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      sx={{ borderRadius: "8px", border: "1px solid #e6e4dd", fontWeight: 500 }}
                    >
                      Apply
                    </Button>
                  </Stack>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ fontSize: 15, color: "text.secondary" }}>
                    Subtotal
                  </Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                    {formatINR(subtotal)}
                  </Typography>
                </Box>
                {discountAmount > 0 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography sx={{ fontSize: 15, color: "text.secondary" }}>
                      Discount
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "success.main",
                      }}
                    >
                      −{formatINR(discountAmount)}
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 1,
                  }}
                >
                  <Typography
                    sx={{ fontSize: 16, fontWeight: 600, color: "#191919" }}
                  >
                    Total Payable
                  </Typography>
                  <Typography
                    sx={{ fontSize: 18, fontWeight: 700, color: "#191919" }}
                  >
                    {formatINR(payable)}
                  </Typography>
                </Box>
              </Stack>

              <Button
                variant="contained"
                fullWidth
                onClick={placeOrder}
                disabled={placingOrder}
                sx={{
                  py: 1.25,
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: "8px",
                  textTransform: "none",
                  bgcolor: "#191919",
                  "&:hover": { bgcolor: "#2e2e2e" },
                }}
              >
                Complete Checkout
              </Button>
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );
}
