import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Box, Button, Chip, Divider, IconButton, Skeleton,
  Stack, Tooltip, Typography,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { Link } from 'react-router-dom';
import { getOrders } from '../api/orders';
import { getCoupons } from '../api/coupons';
import { getProducts } from '../api/products';
import type { CouponResponse, OrderResponse, Product } from '../types';
import StatusBadge from '../components/StatusBadge';
import notify from '../utils/notify';

function formatINR(value: number) {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function useCountUp(target: number, duration = 900): number {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>();
  const startRef = useRef<number>();

  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }
    startRef.current = undefined;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return current;
}

interface StatCardProps {
  title: string; rawValue: number; display: (v: number) => string;
  subtitle: string; icon: ReactNode; accent: string; accentSubtle: string; delay?: number;
}

function StatCard({ title, rawValue, display, subtitle, icon, accent, accentSubtle, delay = 0 }: StatCardProps) {
  const animated = useCountUp(rawValue);
  return (
    <Box
      className="glow-card"
      sx={{
        p: 2.5, borderRadius: '14px',
        background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
        animation: `fadeInUp 0.5s ${delay}ms ease both`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 900, color: '#f1f5f9', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {display(animated)}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#475569', mt: 0.5 }}>{subtitle}</Typography>
        </Box>
        <Box
          sx={{
            width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
            background: accentSubtle, border: `1px solid ${accent}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accent,
          }}
        >
          {icon}
        </Box>
      </Box>
      <Box sx={{ mt: 2, height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: `${Math.min((rawValue / Math.max(rawValue, 1)) * 100, 100)}%`, background: accent, borderRadius: 99 }} />
      </Box>
    </Box>
  );
}

interface ActionCardProps { title: string; description: string; to: string; cta: string; color?: string; }

function ActionCard({ title, description, to, cta, color = '#6366f1' }: ActionCardProps) {
  return (
    <Box
      sx={{
        p: 2.25, borderRadius: '12px',
        background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', gap: 1,
        transition: 'border-color 200ms ease',
        '&:hover': { borderColor: `${color}55` },
      }}
    >
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{title}</Typography>
      <Typography sx={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6 }}>{description}</Typography>
      <Button
        component={Link} to={to} variant="outlined" size="small"
        endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
        sx={{ alignSelf: 'flex-start', mt: 0.5, fontSize: 12, borderColor: `${color}44`, color, '&:hover': { borderColor: color, background: `${color}10` } }}
      >
        {cta}
      </Button>
    </Box>
  );
}

const AUTO_REFRESH_MS = 60_000;

export default function DashboardPage() {
  const [orders, setOrders]     = useState<OrderResponse[]>([]);
  const [coupons, setCoupons]   = useState<CouponResponse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [o, c, p] = await Promise.all([getOrders(), getCoupons(), getProducts()]);
      setOrders(o);
      setCoupons(c);
      setProducts(p);
      setLastRefresh(new Date());
      if (silent) notify.info('Dashboard refreshed');
    } catch {
      notify.error('Unable to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 60s
  useEffect(() => {
    const timer = setInterval(() => load(true), AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const totalRevenue   = useMemo(() => orders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + Number(o.totalAmount ?? 0), 0), [orders]);
  const pendingOrders  = useMemo(() => orders.filter(o => o.status === 'PENDING').length, [orders]);
  const confirmedOrders= useMemo(() => orders.filter(o => o.status === 'CONFIRMED').length, [orders]);
  const activeCoupons  = useMemo(() => coupons.filter(c => c.active).length, [coupons]);

  // Status distribution
  const statusGroups = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] ?? 0) + 1; });
    return counts;
  }, [orders]);

  if (loading) {
    return (
      <Box sx={{ animation: 'fadeIn 0.3s ease' }}>
        {/* Header skeleton */}
        <Box sx={{ mb: 3 }}>
          <Skeleton width={180} height={22} variant="rounded" sx={{ mb: 1 }} />
          <Skeleton width={320} height={36} variant="rounded" sx={{ mb: 1 }} />
          <Skeleton width={500} height={16} variant="rounded" />
        </Box>
        {/* Stats skeleton */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
          {[0,1,2,3].map(i => <Skeleton key={i} height={130} variant="rounded" sx={{ borderRadius: '14px' }} />)}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 2.5 }}>
          <Skeleton height={380} variant="rounded" sx={{ borderRadius: '14px' }} />
          <Stack spacing={2}>
            <Skeleton height={120} variant="rounded" sx={{ borderRadius: '12px' }} />
            <Skeleton height={120} variant="rounded" sx={{ borderRadius: '12px' }} />
            <Skeleton height={120} variant="rounded" sx={{ borderRadius: '12px' }} />
          </Stack>
        </Box>
      </Box>
    );
  }

  const recentOrders = [...orders].sort((a, b) => b.id - a.id).slice(0, 8);

  return (
    <Box sx={{ animation: 'fadeInUp 0.4s ease both', maxWidth: 1500 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="overline" sx={{ color: '#6366f1' }}>ADMIN OVERVIEW</Typography>
          <Typography variant="h4" sx={{ color: '#f1f5f9', mt: 0.5 }}>Operations Dashboard</Typography>
          <Typography sx={{ color: '#64748b', fontSize: 14, mt: 0.5 }}>
            Real-time metrics across orders, inventory, and coupons.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {lastRefresh && (
            <Typography sx={{ fontSize: 11.5, color: '#475569' }}>
              Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          )}
          <Stack direction="row" spacing={1}>
            <Chip label={`${pendingOrders} pending`} size="small" color={pendingOrders > 0 ? 'warning' : 'default'} />
            <Chip label={`${activeCoupons} coupons`} size="small" color="primary" />
            <Chip label={`${products.length} products`} size="small" />
          </Stack>
          <Tooltip title="Refresh now">
            <IconButton
              size="small"
              onClick={() => load(true)}
              disabled={refreshing}
              sx={{ color: '#475569', '&:hover': { color: '#6366f1' }, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
            >
              <RefreshIcon sx={{ fontSize: 16, animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stat cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard
          title="Total Orders" rawValue={orders.length} display={v => String(v)}
          subtitle={`${pendingOrders} awaiting action`}
          icon={<ShoppingCartIcon fontSize="small" />}
          accent="#6366f1" accentSubtle="rgba(99,102,241,0.12)" delay={0}
        />
        <StatCard
          title="Delivered Revenue" rawValue={totalRevenue} display={v => formatINR(v)}
          subtitle="From completed orders"
          icon={<TrendingUpIcon fontSize="small" />}
          accent="#10b981" accentSubtle="rgba(16,185,129,0.12)" delay={80}
        />
        <StatCard
          title="Products" rawValue={products.length} display={v => String(v)}
          subtitle="In catalogue"
          icon={<InventoryIcon fontSize="small" />}
          accent="#f59e0b" accentSubtle="rgba(245,158,11,0.12)" delay={160}
        />
        <StatCard
          title="Active Coupons" rawValue={activeCoupons} display={v => String(v)}
          subtitle={`${coupons.length} total`}
          icon={<LocalOfferIcon fontSize="small" />}
          accent="#ec4899" accentSubtle="rgba(236,72,153,0.12)" delay={240}
        />
      </Box>

      {/* Lower grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' }, gap: 2.5 }}>
        {/* Recent orders table */}
        <Box sx={{ borderRadius: '14px', background: '#111827', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', animation: 'fadeInUp 0.5s 300ms ease both' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Recent Orders</Typography>
              <Typography sx={{ fontSize: 12, color: '#475569' }}>Latest {recentOrders.length} records</Typography>
            </Box>
            <Button component={Link} to="/orders" size="small" sx={{ fontSize: 12, color: '#6366f1', '&:hover': { background: 'rgba(99,102,241,0.08)' } }} endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}>
              View all
            </Button>
          </Box>

          {recentOrders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ color: '#475569', fontSize: 13 }}>No orders yet</Typography>
            </Box>
          ) : (
            <Box>
              {/* Column headers */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px 100px', px: 2.5, py: 1, gap: 2, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['#', 'User / Address', 'Amount', 'Status'].map(h => (
                  <Typography key={h} sx={{ fontSize: 10.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</Typography>
                ))}
              </Box>
              {recentOrders.map((order, i) => (
                <Box
                  key={order.id}
                  sx={{
                    display: 'grid', gridTemplateColumns: '60px 1fr 110px 100px',
                    px: 2.5, py: 1.5, gap: 2, alignItems: 'center',
                    borderBottom: i < recentOrders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    transition: 'background 150ms ease',
                    '&:hover': { background: 'rgba(255,255,255,0.02)' },
                  }}
                >
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#6366f1' }}>#{order.id}</Typography>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }} noWrap>User #{order.userId}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: '#475569' }} noWrap>{new Date(order.placedAt).toLocaleDateString('en-IN')}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontVariantNumeric: 'tabular-nums' }}>
                    {formatINR(Number(order.totalAmount ?? 0))}
                  </Typography>
                  <StatusBadge status={order.status} size="sm" />
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Right column */}
        <Stack spacing={2} sx={{ animation: 'fadeInUp 0.5s 380ms ease both' }}>
          {/* Status breakdown */}
          <Box sx={{ p: 2.5, borderRadius: '14px', background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', mb: 1.5 }}>Order Status Breakdown</Typography>
            <Stack spacing={1.25}>
              {[
                { status: 'PENDING',   color: '#f59e0b', label: 'Pending'   },
                { status: 'CONFIRMED', color: '#3b82f6', label: 'Confirmed' },
                { status: 'SHIPPED',   color: '#8b5cf6', label: 'Shipped'   },
                { status: 'DELIVERED', color: '#10b981', label: 'Delivered' },
                { status: 'CANCELLED', color: '#ef4444', label: 'Cancelled' },
              ].map(({ status, color, label }) => {
                const count = statusGroups[status] ?? 0;
                const pct = orders.length > 0 ? (count / orders.length) * 100 : 0;
                return (
                  <Box key={status}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{label}</Typography>
                      <Typography sx={{ fontSize: 12, color, fontWeight: 700 }}>{count}</Typography>
                    </Box>
                    <Box sx={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 600ms ease' }} />
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {/* Quick highlights */}
          <Box sx={{ p: 2.25, borderRadius: '14px', background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', mb: 1.5 }}>Quick Highlights</Typography>
            <Stack spacing={1.25}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HourglassTopIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                  <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>Needs action</Typography>
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>{pendingOrders} pending</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ fontSize: 14, color: '#3b82f6' }} />
                  <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>In processing</Typography>
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>{confirmedOrders} confirmed</Typography>
              </Box>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>Avg order value</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                  {orders.length > 0 ? formatINR(orders.reduce((s, o) => s + Number(o.totalAmount ?? 0), 0) / orders.length) : '—'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>Expired coupons</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                  {coupons.filter(c => !c.active).length}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Quick actions */}
          <Stack spacing={1.5}>
            <ActionCard title="Manage Orders" description="Accept, reject, or update order status. Triggers email notifications to customers." to="/orders" cta="Open Orders" color="#6366f1" />
            <ActionCard title="Manage Products" description="Add new products, update prices, and manage inventory quantities." to="/products" cta="Open Products" color="#f59e0b" />
            <ActionCard title="Manage Coupons" description="Create discount codes and toggle active/inactive status." to="/coupons" cta="Open Coupons" color="#ec4899" />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
