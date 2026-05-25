import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, CircularProgress, Typography,
  Divider, Chip, Paper, Stack, LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getOrders } from '../api/orders';
import { getCoupons } from '../api/coupons';
import { getProducts } from '../api/products';
import type { OrderResponse, CouponResponse, Product } from '../types';

const STATUS_COLORS: Record<string, string> = {
  PENDING:   '#f59e0b',
  CONFIRMED: '#3b82f6',
  SHIPPED:   '#8b5cf6',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
};

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}

function StatCard({ label, value, icon, color, sub }: StatCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
      }}
    >
      {/* top accent bar */}
      <Box sx={{ height: 4, bgcolor: color, width: '100%' }} />
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={0.5} textTransform="uppercase">
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={800} mt={0.5} lineHeight={1}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                {sub}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: color + '18',
              borderRadius: 2.5,
              p: 1.25,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              '& svg': { fontSize: 26 },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [orders, setOrders]   = useState<OrderResponse[]>([]);
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getCoupons(), getProducts()])
      .then(([o, c, p]) => { setOrders(o); setCoupons(c); setProducts(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

  const pendingOrders  = orders.filter(o => o.status === 'PENDING').length;
  const activeCoupons  = coupons.filter(c => c.active).length;

  const statusCount = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const maxStatusCount = Math.max(...Object.values(statusCount), 1);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress size={52} thickness={4} />
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>

      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={800} color="text.primary">
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Welcome back — here's what's happening today.
        </Typography>
      </Box>

      {/* ── Stat Cards Row ── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Total Orders"
            value={orders.length}
            icon={<ShoppingCartIcon />}
            color="#6366f1"
            sub={`${pendingOrders} pending`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Revenue"
            value={`₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            icon={<TrendingUpIcon />}
            color="#10b981"
            sub="From delivered orders"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Products"
            value={products.length}
            icon={<InventoryIcon />}
            color="#f59e0b"
            sub="In catalogue"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Active Coupons"
            value={activeCoupons}
            icon={<LocalOfferIcon />}
            color="#ec4899"
            sub={`${coupons.length} total`}
          />
        </Grid>
      </Grid>

      {/* ── Bottom Row ── */}
      <Grid container spacing={2.5} alignItems="stretch">

        {/* Order Status Breakdown */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              p: 3,
              height: '100%',
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
              Order Status Breakdown
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Distribution across all {orders.length} orders
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            {orders.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, color: 'text.secondary' }}>
                <ShoppingCartIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2">No orders yet</Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {STATUS_ORDER.filter(s => statusCount[s] != null).map(status => {
                  const count = statusCount[status] ?? 0;
                  const pct   = Math.round((count / orders.length) * 100);
                  return (
                    <Box key={status}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: STATUS_COLORS[status], flexShrink: 0 }} />
                          <Typography variant="body2" fontWeight={600} color="text.primary">{status}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="body2" color="text.secondary">{pct}%</Typography>
                          <Chip
                            label={count}
                            size="small"
                            sx={{
                              height: 20,
                              minWidth: 28,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              bgcolor: STATUS_COLORS[status] + '20',
                              color: STATUS_COLORS[status],
                            }}
                          />
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(count / maxStatusCount) * 100}
                        sx={{
                          height: 6,
                          borderRadius: 10,
                          bgcolor: STATUS_COLORS[status] + '18',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: STATUS_COLORS[status],
                            borderRadius: 10,
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              p: 3,
              height: '100%',
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
              Recent Orders
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Latest {Math.min(orders.length, 6)} of {orders.length} orders
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {orders.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, color: 'text.secondary' }}>
                <ShoppingCartIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2">No orders yet</Typography>
              </Box>
            ) : (
              <Stack spacing={0} divider={<Divider sx={{ my: 0 }} />}>
                {orders.slice(0, 6).map(o => (
                  <Box
                    key={o.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      py: 1.5,
                      px: 1,
                      borderRadius: 2,
                      transition: 'background 0.15s',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {/* Order ID badge */}
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        bgcolor: '#6366f118',
                        color: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      #{o.id}
                    </Box>

                    {/* Middle info */}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        User #{o.userId}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}
                      >
                        <AccessTimeIcon sx={{ fontSize: 11 }} />
                        {new Date(o.placedAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                        &nbsp;·&nbsp;{o.deliveryAddress}
                      </Typography>
                    </Box>

                    {/* Right side */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 0.5 }}>
                      <Typography variant="body2" fontWeight={700} color="text.primary">
                        ₹{o.totalAmount?.toFixed(2) ?? '—'}
                      </Typography>
                      <Chip
                        label={o.status}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          bgcolor: STATUS_COLORS[o.status] + '20',
                          color: STATUS_COLORS[o.status],
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}
