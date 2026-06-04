import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar, Box, Button, Card, CardContent, CardMedia, Chip, Divider,
  IconButton, InputAdornment, Paper, Skeleton, Stack, TextField,
  Typography,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReplayIcon from '@mui/icons-material/Replay';
import SellIcon from '@mui/icons-material/Sell';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';
import { createOrder, getOrdersByUser } from '../api/orders';
import { getProducts } from '../api/products';
import { getInventory } from '../api/inventory';
import { getCoupons, getCouponByCode } from '../api/coupons';
import CouponSuccessPopup from '../components/CouponSuccessPopup';
import StatusBadge from '../components/StatusBadge';
import type { CouponResponse, OrderResponse, Product } from '../types';
import notify from '../utils/notify';

interface CartLine { productId: number; quantity: number; }
interface DeliveryForm { line1: string; landmark: string; city: string; state: string; postalCode: string; }

const CART_KEY     = (uid: number) => `retail_cart_${uid}`;
const DELIVERY_KEY = (uid: number) => `retail_delivery_${uid}`;
const SEEN_COUPON  = (uid: number) => `retail_seen_coupon_${uid}`;

function formatINR(v: number) { return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`; }
function toErr(e: any, fb: string) { return e?.response?.data?.message || e?.message || fb; }
function imageForProduct(id: number) { return `https://picsum.photos/seed/rp-${id}/400/300`; }
function normalizeStatus(s: string) { return s.replace('_', ' '); }

export default function ShopPage() {
  const { user } = useAuth();
  const [products, setProducts]   = useState<Product[]>([]);
  const [orders, setOrders]       = useState<OrderResponse[]>([]);
  const [coupons, setCoupons]     = useState<CouponResponse[]>([]);
  const [inventory, setInventory] = useState<Record<number, number | null>>({});

  const [search, setSearch]             = useState('');
  const [cart, setCart]                 = useState<CartLine[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [loading, setLoading]           = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [couponInput, setCouponInput]       = useState('');
  const [appliedCoupon, setAppliedCoupon]   = useState<CouponResponse | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading]   = useState(false);

  const [delivery, setDelivery] = useState<DeliveryForm>({ line1: '', landmark: '', city: '', state: '', postalCode: '' });
  const [deliveryErrors, setDeliveryErrors] = useState<Partial<DeliveryForm>>({});

  const [popup, setPopup] = useState<{ open: boolean; title: string; description: string; code: string; label: string; value: string }>({
    open: false, title: '', description: '', code: '', label: '', value: '',
  });

  const productMap     = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), [products]);
  const filteredProds  = useMemo(() => products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const cartCount      = useMemo(() => cart.reduce((s, l) => s + l.quantity, 0), [cart]);
  const subtotal       = useMemo(() => cart.reduce((s, l) => s + (productMap[l.productId]?.price ?? 0) * l.quantity, 0), [cart, productMap]);
  const payable        = Math.max(subtotal - discountAmount, 0);
  const selectedOrder  = useMemo(() => orders.find(o => o.id === selectedOrderId) ?? orders[0] ?? null, [orders, selectedOrderId]);

  useEffect(() => {
    if (!user) return;
    setDelivery(d => ({
      ...d,
      line1:      user.address?.trim() || d.line1,
      city:       user.city?.trim()    || d.city,
      state:      user.state?.trim()   || d.state,
      postalCode: user.postalCode?.trim() || d.postalCode,
    }));
  }, [user]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [productList, orderList, couponList] = await Promise.all([
        getProducts(), getOrdersByUser(user.id), getCoupons(),
      ]);
      setProducts(productList);
      setOrders(orderList.sort((a, b) => b.id - a.id));
      setCoupons(couponList);
      setSelectedOrderId(sel => sel ?? orderList[0]?.id ?? null);
      const invEntries = await Promise.all(
        productList.map(async p => {
          try { return [p.id, (await getInventory(p.id)).quantity] as const; }
          catch { return [p.id, null] as const; }
        })
      );
      setInventory(Object.fromEntries(invEntries));
    } catch (e) {
      notify.error(toErr(e, 'Failed to load shop data'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const raw = sessionStorage.getItem(CART_KEY(user.id));
      const rawDel = sessionStorage.getItem(DELIVERY_KEY(user.id));
      if (raw) setCart(JSON.parse(raw));
      if (rawDel) setDelivery(JSON.parse(rawDel));
    } catch { /* ignore */ }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    sessionStorage.setItem(CART_KEY(user.id), JSON.stringify(cart));
    sessionStorage.setItem(DELIVERY_KEY(user.id), JSON.stringify(delivery));
  }, [cart, delivery, user?.id]);

  useEffect(() => {
    if (!user?.id || !coupons.length) return;
    const newest = [...coupons].filter(c => c.active).sort((a, b) => b.id - a.id)[0];
    if (!newest) return;
    const seenKey = SEEN_COUPON(user.id);
    const seenId  = Number(sessionStorage.getItem(seenKey) ?? '0');
    if (newest.id <= seenId) return;
    sessionStorage.setItem(seenKey, String(newest.id));
    const offer = newest.type === 'PERCENTAGE' ? `${newest.value}% off` : `Flat ₹${newest.value} off`;
    setPopup({ open: true, title: 'New Coupon Available', description: 'A fresh discount code is live. Apply it at checkout.', code: newest.code, label: 'Offer', value: offer });
  }, [coupons, user?.id]);

  const setField = (k: keyof DeliveryForm, v: string) => setDelivery(d => ({ ...d, [k]: v }));

  const addToCart = (productId: number) => {
    const product = productMap[productId];
    if (!product) return;
    const stock = inventory[productId];
    if (stock != null && stock <= 0) { notify.warning(`${product.name} is out of stock`); return; }
    setCart(c => {
      const existing = c.find(l => l.productId === productId);
      if (existing) return c.map(l => l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l);
      return [...c, { productId, quantity: 1 }];
    });
    notify.cart(product.name, 'added');
  };

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      const name = productMap[productId]?.name;
      setCart(c => c.filter(l => l.productId !== productId));
      if (name) notify.cart(name, 'removed');
    } else {
      setCart(c => c.map(l => l.productId === productId ? { ...l, quantity: qty } : l));
    }
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponInput('');
  };

  const computeDiscount = (coupon: CouponResponse, sub: number) =>
    coupon.type === 'PERCENTAGE' ? (sub * Number(coupon.value)) / 100 : Math.min(sub, Number(coupon.value));

  const applyCoupon = async () => {
    if (!couponInput.trim()) { notify.warning('Enter a coupon code first'); return; }
    if (subtotal <= 0)       { notify.warning('Add items to cart first'); return; }
    try {
      setCouponLoading(true);
      const coupon = await getCouponByCode(couponInput.trim().toUpperCase());
      if (!coupon.active) { notify.error('This coupon is not active'); return; }
      const today = new Date();
      const expiry = new Date(coupon.expiryDate);
      if (expiry < new Date(today.getFullYear(), today.getMonth(), today.getDate())) { notify.error('This coupon has expired'); return; }
      if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) { notify.error('Coupon usage limit reached'); return; }
      const discount = computeDiscount(coupon, subtotal);
      setAppliedCoupon(coupon);
      setDiscountAmount(discount);
      setCouponInput(coupon.code);
      notify.couponApplied(coupon.code, formatINR(discount));
      setPopup({ open: true, title: 'Coupon Applied!', description: 'This discount will be applied when you place the order.', code: coupon.code, label: 'Discount', value: formatINR(discount) });
    } catch (e) {
      notify.error(toErr(e, 'Invalid coupon code'));
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponInput('');
    notify.info('Coupon removed');
  };

  const validateStock = (lines: CartLine[]) => {
    for (const line of lines) {
      const stock = inventory[line.productId];
      if (stock != null && stock < line.quantity) {
        notify.error(`${productMap[line.productId]?.name ?? 'A product'} has insufficient stock`);
        return false;
      }
    }
    return true;
  };

  const buildAddress = () => {
    const errs: Partial<DeliveryForm> = {};
    if (!delivery.line1.trim())                      errs.line1      = 'Required';
    if (!delivery.city.trim())                       errs.city       = 'Required';
    if (!delivery.state.trim())                      errs.state      = 'Required';
    if (!/^\d{6}$/.test(delivery.postalCode.trim())) errs.postalCode = 'Must be 6 digits';
    setDeliveryErrors(errs);
    if (Object.keys(errs).length > 0) return null;
    return [delivery.line1.trim(), delivery.landmark.trim(), `${delivery.city.trim()}, ${delivery.state.trim()} ${delivery.postalCode.trim()}`]
      .filter(Boolean).join(', ');
  };

  const placeOrder = async () => {
    if (!user?.id) return;
    if (cart.length === 0) { notify.warning('Your cart is empty'); return; }
    const deliveryAddress = buildAddress();
    if (!deliveryAddress) { notify.warning('Complete all delivery details'); return; }
    if (!validateStock(cart)) return;
    try {
      setPlacingOrder(true);
      const created = await createOrder({
        userId: user.id,
        deliveryAddress,
        couponCode: appliedCoupon?.code,
        status: 'PENDING',
        items: cart.map(l => ({ productId: l.productId, quantity: l.quantity, priceAtTime: productMap[l.productId]?.price ?? 0 })),
      });
      setOrders(os => [created, ...os]);
      setSelectedOrderId(created.id);
      clearCart();
      notify.success(`Order #${created.id} placed successfully`);
    } catch (e) {
      notify.error(toErr(e, 'Failed to place order'));
    } finally {
      setPlacingOrder(false);
    }
  };

  const orderAgain = (order: OrderResponse) => {
    const lines = order.items.map(i => ({ productId: i.productId, quantity: i.quantity }));
    if (!validateStock(lines)) return;
    setCart(lines);
    setAppliedCoupon(null); setDiscountAmount(0); setCouponInput('');
    notify.info(`Order #${order.id} loaded into cart`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) 340px' }, gap: 2.5 }}>
        <Stack spacing={2}>
          <Skeleton height={44} variant="rounded" sx={{ borderRadius: '8px' }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {[0,1,2,3,4,5].map(i => <Skeleton key={i} height={230} variant="rounded" sx={{ borderRadius: '8px' }} />)}
          </Box>
        </Stack>
        <Stack spacing={2}>
          <Skeleton height={360} variant="rounded" sx={{ borderRadius: '8px' }} />
          <Skeleton height={240} variant="rounded" sx={{ borderRadius: '8px' }} />
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">
          Shop
          {cartCount > 0 && <Chip label={`${cartCount} items`} size="small" color="primary" sx={{ ml: 1.5, verticalAlign: 'middle' }} />}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2.2fr) 340px' }, gap: 2.5 }}>
        <Box>
          <TextField
            fullWidth size="small"
            placeholder="Search products…"
            value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ mb: 2 }}
          />

          {filteredProds.length === 0 ? (
            <Paper sx={{ textAlign: 'center', py: 8 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>No products found</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
              {filteredProds.map(product => {
                const stock  = inventory[product.id];
                const inCart = cart.find(l => l.productId === product.id)?.quantity ?? 0;
                const isOut  = stock != null && stock <= 0;
                const isLow  = stock != null && stock > 0 && stock <= 5;
                return (
                return (
                  <Card 
                    key={product.id} 
                    elevation={0}
                    sx={{ 
                      opacity: isOut ? 0.6 : 1, 
                      position: 'relative',
                      border: '1px solid',
                      borderColor: 'rgba(226, 232, 240, 0.8)',
                      borderRadius: '16px',
                      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                      transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        borderColor: '#cbd5e1',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)'
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                      <CardMedia
                        component="img" height="200"
                        image={imageForProduct(product.id)} alt={product.name}
                        sx={{ 
                          objectFit: 'cover',
                          transition: 'transform 500ms ease',
                          '&:hover': { transform: 'scale(1.05)' }
                        }}
                      />
                      {isLow && !isOut && (
                        <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                          <Chip label={`Only ${stock} left!`} size="small" sx={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', backdropFilter: 'blur(8px)', bgcolor: 'rgba(245, 158, 11, 0.85)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
                        </Box>
                      )}
                      {isOut && (
                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(2px)' }}>
                          <Chip label="Out of Stock" sx={{ fontWeight: 700, bgcolor: '#0f172a', color: '#fff' }} />
                        </Box>
                      )}
                    </Box>
                    <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 1, color: '#0f172a', lineHeight: 1.2 }} noWrap>{product.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 2.5 }}>
                        <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                          {formatINR(product.price)}
                        </Typography>
                      </Box>
                      {inCart > 0 ? (
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: '#ffffff', p: 0.5, borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.02)' }}>
                          <IconButton size="small" onClick={() => updateQty(product.id, inCart - 1)} sx={{ color: '#475569', '&:hover': { bgcolor: '#f1f5f9' } }}>
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ fontWeight: 700, flex: 1, textAlign: 'center', fontSize: 15 }}>{inCart}</Typography>
                          <IconButton size="small" onClick={() => addToCart(product.id)} disabled={isOut} sx={{ color: '#0f172a', '&:hover': { bgcolor: '#f1f5f9' } }}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ) : (
                        <Button
                          variant={isOut ? 'outlined' : 'contained'} fullWidth 
                          disabled={isOut}
                          startIcon={!isOut && <ShoppingCartIcon fontSize="small" />}
                          onClick={() => addToCart(product.id)}
                          sx={{ 
                            py: 1.2,
                            borderRadius: '10px', 
                            textTransform: 'none', 
                            fontWeight: 700,
                            fontSize: 14,
                            boxShadow: isOut ? 'none' : '0 4px 6px -1px rgba(15, 23, 42, 0.1)',
                            bgcolor: isOut ? 'transparent' : '#0f172a',
                            border: isOut ? '1px solid #cbd5e1' : 'none',
                            color: isOut ? '#64748b' : '#fff',
                            '&:hover': {
                              boxShadow: isOut ? 'none' : '0 10px 15px -3px rgba(15, 23, 42, 0.2)',
                              bgcolor: isOut ? 'transparent' : '#1e293b',
                              transform: isOut ? 'none' : 'translateY(-1px)'
                            },
                            transition: 'all 200ms ease'
                          }}
                        >
                          {isOut ? 'Unavailable' : 'Add to Cart'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>

        <Box 
          sx={{ 
            position: { lg: 'sticky' }, 
            top: { lg: 16 }, 
            alignSelf: { lg: 'start' },
            maxHeight: { lg: 'calc(100vh - 32px)' },
            overflowY: { lg: 'auto' },
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            pb: 2
          }}
        >
          <Stack spacing={2}>
          <Paper sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ fontWeight: 600 }}>Order Summary</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {cart.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                <Typography sx={{ fontSize: 14 }}>Your cart is empty</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5} sx={{ mb: 2 }}>
                {cart.map(line => {
                  const product = productMap[line.productId];
                  if (!product) return null;
                  return (
                    <Box key={line.productId} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }} noWrap>{product.name}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{formatINR(product.price)} each</Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <IconButton size="small" onClick={() => updateQty(product.id, line.quantity - 1)}><RemoveIcon fontSize="small" /></IconButton>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, minWidth: 16, textAlign: 'center' }}>{line.quantity}</Typography>
                        <IconButton size="small" onClick={() => updateQty(product.id, line.quantity + 1)}><AddIcon fontSize="small" /></IconButton>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}

            <Divider sx={{ mb: 2 }} />
            
            {appliedCoupon ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderRadius: 1, bgcolor: '#f1f5f9', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SellIcon fontSize="small" sx={{ color: 'primary.main' }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{appliedCoupon.code}</Typography>
                </Box>
                <IconButton size="small" onClick={removeCoupon}><CloseIcon fontSize="small" /></IconButton>
              </Box>
            ) : (
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  size="small" fullWidth placeholder="Coupon code"
                  value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                />
                <Button variant="outlined" onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()}>
                  Apply
                </Button>
              </Stack>
            )}

            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', mb: 1 }}>Delivery Details</Typography>
            <Stack spacing={1.5}>
              <TextField size="small" label="Address line" value={delivery.line1} onChange={e => setField('line1', e.target.value)} error={!!deliveryErrors.line1} fullWidth />
              <TextField size="small" label="Landmark (optional)" value={delivery.landmark} onChange={e => setField('landmark', e.target.value)} fullWidth />
              <Stack direction="row" spacing={1}>
                <TextField size="small" label="City" value={delivery.city} onChange={e => setField('city', e.target.value)} error={!!deliveryErrors.city} fullWidth />
                <TextField size="small" label="State" value={delivery.state} onChange={e => setField('state', e.target.value)} error={!!deliveryErrors.state} fullWidth />
              </Stack>
              <TextField size="small" label="Postal code" value={delivery.postalCode} onChange={e => setField('postalCode', e.target.value.replace(/\D/g, '').slice(0, 6))} error={!!deliveryErrors.postalCode} fullWidth />
            </Stack>

            <Divider sx={{ my: 2 }} />
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>Subtotal</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{formatINR(subtotal)}</Typography>
              </Box>
              {discountAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>Discount</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'success.main' }}>−{formatINR(discountAmount)}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Total</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{formatINR(payable)}</Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={clearCart} disabled={cart.length === 0} startIcon={<DeleteOutlineIcon fontSize="small" />}>Clear</Button>
              <Button variant="contained" fullWidth onClick={placeOrder} disabled={placingOrder || cart.length === 0}>Place Order</Button>
            </Stack>
          </Paper>
        </Stack>
        </Box>
      </Box>

      <CouponSuccessPopup
        open={popup.open} title={popup.title} description={popup.description}
        couponCode={popup.code} highlightLabel={popup.label} highlightValue={popup.value}
        ctaLabel="Got it" onClose={() => setPopup(p => ({ ...p, open: false }))}
      />
    </Box>
  );
}
