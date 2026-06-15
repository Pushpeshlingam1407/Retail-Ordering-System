import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useAuth } from "../context/AuthContext";
import { getProducts } from "../api/products";
import { getInventory } from "../api/inventory";
import { getCoupons } from "../api/coupons";
import type { Product, CouponResponse } from "../types";
import CouponSuccessPopup from "../components/CouponSuccessPopup";
import notify from "../utils/notify";

export interface CartLine {
  productId: number;
  quantity: number;
}

const CART_KEY = (uid: number) => `retail_cart_${uid}`;
const SEEN_COUPON = (uid: number) => `retail_seen_coupon_${uid}`;

function formatINR(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
function toErr(e: unknown, fb: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const err = e as any;
  return err?.response?.data?.message || err?.message || fb;
}
function imageForProduct(product: Product) {
  return `https://placehold.co/400x300/e2e8f0/0f172a?text=${encodeURIComponent(product.name)}`;
}

export default function ShopPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartLoaded, setCartLoaded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [inventory, setInventory] = useState<Record<number, number | null>>({});

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);

  const [popup, setPopup] = useState<{
    open: boolean;
    title: string;
    description: string;
    code: string;
    label: string;
    value: string;
  }>({
    open: false,
    title: "",
    description: "",
    code: "",
    label: "",
    value: "",
  });

  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products],
  );
  const filteredProds = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );
  const cartCount = useMemo(
    () => cart.reduce((s, l) => s + l.quantity, 0),
    [cart],
  );

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [productList, couponList] = await Promise.all([
        getProducts(),
        getCoupons(),
      ]);
      setProducts(productList);
      setCoupons(couponList);
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
    } catch (e) {
      notify.error(toErr(e, "Failed to load shop data"));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const raw = sessionStorage.getItem(CART_KEY(user.id));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setCart(JSON.parse(raw));
    } catch {
      /* ignore */
    } finally {
      setCartLoaded(true);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !cartLoaded) return;
    sessionStorage.setItem(CART_KEY(user.id), JSON.stringify(cart));
  }, [cart, user?.id, cartLoaded]);

  useEffect(() => {
    if (!user?.id || !coupons.length) return;
    const newest = [...coupons]
      .filter((c) => c.active)
      .sort((a, b) => b.id - a.id)[0];
    if (!newest) return;
    const seenKey = SEEN_COUPON(user.id);
    const seenId = Number(sessionStorage.getItem(seenKey) ?? "0");
    if (newest.id <= seenId) return;
    sessionStorage.setItem(seenKey, String(newest.id));
    const offer =
      newest.type === "PERCENTAGE"
        ? `${newest.value}% off`
        : `Flat ₹${newest.value} off`;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPopup({
      open: true,
      title: "New Coupon Available",
      description: "A fresh discount code is live. Apply it at checkout.",
      code: newest.code,
      label: "Offer",
      value: offer,
    });
  }, [coupons, user?.id]);

  const addToCart = (productId: number) => {
    const product = productMap[productId];
    if (!product) return;
    const stock = inventory[productId];
    if (stock != null && stock <= 0) {
      notify.warning(`${product.name} is out of stock`);
      return;
    }
    setCart((c) => {
      const existing = c.find((l) => l.productId === productId);
      if (existing)
        return c.map((l) =>
          l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l,
        );
      return [...c, { productId, quantity: 1 }];
    });
    notify.cart(product.name, "added");
  };

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      const name = productMap[productId]?.name;
      setCart((c) => c.filter((l) => l.productId !== productId));
      if (name) notify.cart(name, "removed");
    } else {
      setCart((c) =>
        c.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l)),
      );
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 2fr) 340px" },
          gap: 2.5,
        }}
      >
        <Stack spacing={2}>
          <Skeleton
            height={44}
            variant="rounded"
            sx={{ borderRadius: "8px" }}
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                height={230}
                variant="rounded"
                sx={{ borderRadius: "8px" }}
              />
            ))}
          </Box>
        </Stack>
        <Stack spacing={2}>
          <Skeleton
            height={360}
            variant="rounded"
            sx={{ borderRadius: "8px" }}
          />
          <Skeleton
            height={240}
            variant="rounded"
            sx={{ borderRadius: "8px" }}
          />
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", width: "100%" }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.02em" }}>
            Shop
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 0.5, fontSize: 14 }}>
            Browse and add items to your cart
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate("/cart")}
          startIcon={<ShoppingCartIcon />}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 1.2,
          }}
        >
          View Cart
          {cartCount > 0 && (
            <Chip
              label={cartCount}
              size="small"
              sx={{
                ml: 1,
                height: 20,
                minWidth: 20,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: "#ffffff",
                color: "#1d1d1f",
                border: "1px solid rgba(0,0,0,0.02)"
              }}
            />
          )}
        </Button>
      </Box>

      <Box>
        <Box>
          <TextField
            fullWidth
            size="small"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 3 }}
          />

          {filteredProds.length === 0 ? (
            <Paper sx={{ textAlign: "center", py: 8 }}>
              <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                No products found
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 3,
              }}
            >
              {filteredProds.map((product) => {
                const stock = inventory[product.id];
                const inCart =
                  cart.find((l) => l.productId === product.id)?.quantity ?? 0;
                const isOut = stock != null && stock <= 0;
                const isLow = stock != null && stock > 0 && stock <= 5;
                return (
                  <Card
                    key={product.id}
                    elevation={0}
                    sx={{
                      opacity: isOut ? 0.6 : 1,
                      position: "relative",
                      border: "1px solid #e6e4dd",
                      borderRadius: "12px",
                      bgcolor: "rgba(255, 255, 255, 0.75)",
                      backdropFilter: "blur(12px) saturate(180%)",
                      transition: "all var(--t-base)",
                      overflow: "hidden",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        borderColor: "#c8c6be",
                        boxShadow: "0 12px 24px -10px rgba(25, 25, 25, 0.04), 0 4px 8px -2px rgba(25, 25, 25, 0.02)",
                      },
                    }}
                  >
                    <Box sx={{ position: "relative", overflow: "hidden", bgcolor: "#f3f1eb" }}>
                      <CardMedia
                        component="img"
                        height="180"
                        image={imageForProduct(product)}
                        alt={product.name}
                        sx={{
                          objectFit: "cover",
                          mixBlendMode: "multiply",
                          transition: "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)",
                          "&:hover": { transform: "scale(1.03)" },
                        }}
                      />
                      {isLow && !isOut && (
                        <Box sx={{ position: "absolute", top: 12, right: 12 }}>
                          <Chip
                            label={`Only ${stock} left!`}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: 10,
                              letterSpacing: 0.5,
                              textTransform: "uppercase",
                              backdropFilter: "blur(8px)",
                              bgcolor: "rgba(180, 83, 9, 0.85)",
                              color: "#fff",
                              border: "1px solid rgba(255,255,255,0.15)",
                            }}
                          />
                        </Box>
                      )}
                      {isOut && (
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "rgba(250,249,246,0.6)",
                            backdropFilter: "blur(1.5px)",
                          }}
                        >
                          <Chip
                            label="Out of Stock"
                            sx={{
                              fontWeight: 600,
                              fontSize: 12,
                              bgcolor: "#1d1d1f",
                              color: "#fff",
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                    <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: 15,
                          mb: 0.5,
                          color: "#1d1d1f",
                          lineHeight: 1.25,
                        }}
                        noWrap
                      >
                        {product.name}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 2 }}>
                        {product.brand?.name} · {product.category?.name} · {product.packaging}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#1d1d1f",
                            lineHeight: 1,
                          }}
                        >
                          {formatINR(product.price)}
                        </Typography>
                      </Box>
                      {inCart > 0 ? (
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
                            onClick={() => updateQty(product.id, inCart - 1)}
                            sx={{
                              color: "#5e5e5e",
                              "&:hover": { bgcolor: "#f3f1eb" },
                            }}
                          >
                            <RemoveIcon fontSize="small" sx={{ fontSize: 16 }} />
                          </IconButton>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              flex: 1,
                              textAlign: "center",
                              fontSize: 14,
                              color: "#1d1d1f"
                            }}
                          >
                            {inCart}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => addToCart(product.id)}
                            disabled={isOut}
                            sx={{
                              color: "#1d1d1f",
                              "&:hover": { bgcolor: "#f3f1eb" },
                            }}
                          >
                            <AddIcon fontSize="small" sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Stack>
                      ) : (
                        <Button
                          variant={isOut ? "outlined" : "contained"}
                          fullWidth
                          disabled={isOut}
                          startIcon={
                            !isOut && <ShoppingCartIcon fontSize="small" sx={{ fontSize: 16 }} />
                          }
                          onClick={() => addToCart(product.id)}
                          sx={{
                            py: 1,
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          {isOut ? "Unavailable" : "Add to Cart"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      <CouponSuccessPopup
        open={popup.open}
        title={popup.title}
        description={popup.description}
        couponCode={popup.code}
        highlightLabel={popup.label}
        highlightValue={popup.value}
        ctaLabel="Got it"
        onClose={() => setPopup((p) => ({ ...p, open: false }))}
      />
    </Box>
  );
}
