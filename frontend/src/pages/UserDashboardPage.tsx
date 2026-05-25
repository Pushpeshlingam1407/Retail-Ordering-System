import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Chip, CircularProgress, Divider,
  Paper, Stack, Typography, Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../context/AuthContext';
import { getOrders } from '../api/orders';
import { getCoupons } from '../api/coupons';
import type { OrderResponse, CouponResponse } from '../types';

const STATUS_COLORS: Record<string, string> = {
  PENDING:   '#f59e0b',
  CONFIRMED: '#3b82f6',
  SHIPPED:   '#8b5cf6',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
};

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [orders,  setOrders]  = useState<OrderResponse[]>([]);
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getCoupons()])
      .then(([o, c]) => { setOrders(o); setCoupons(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
  const pendingOrders   = orders.filter(o => o.status === 'PENDING');
  const activeCoupons   = coupons.filter(c => c.active);
  const totalSpent      = deliveredOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);

  const stats = [
    { label: 'My Orders',     value: orders.length,         icon: <ShoppingCartIcon />, color: '#6366f1', sub: `${pendingOrders.length} pending` },
    { label: 'Total Spent',   value: `₹${totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: <AccountCircleIcon />, color: '#10b981', sub: 'On delivered orders' },
    { label: 'Active Coupons',value: activeCoupons.length,  icon: <LocalOfferIcon />,  color: '#ec4899', sub: 'Available to use' },
  ];

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress size={52} thickness={4} />
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Greeting */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={800}>
          Hello, {user?.name ?? 'User'} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Here's an overview of your activity.
        </Typography>
      </Box>

      {/* User Role Badge */}
      <Alert
        icon={<AccountCircleIcon />}
        severity="info"
        sx={{ mb: 3, borderRadius: 2, fontWeight: 500 }}
      >
        You are logged in as a <strong>User</strong>. Contact an admin to manage products, inventory, and coupons.
      </Alert>

      {/* Stat cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {stats.map(s => (
          <Grid item xs={12} sm={4} key={s.label}>
            <Card elevation={0} sx={{
              borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%',
              transition: 'box-shadow 0.2s, transform 0.2s',
              '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
            }}>
              <Box sx={{ height: 4, bgcolor: s.color }} />
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                      {s.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} mt={0.5} lineHeight={1}>{s.value}</Typography>
                    <Typography variant="caption" color="text.secondary" mt={0.5} display="block">{s.sub}</Typography>
                  </Box>
                  <Box sx={{
                    bgcolor: s.color + '18', borderRadius: 2.5, p: 1.25,
                    color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    '& svg': { fontSize: 26 },
                  }}>
                    {s.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} alignItems="stretch">
        {/* Recent Orders */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={0.5}>My Recent Orders</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Latest {Math.min(orders.length, 6)} orders
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {orders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <ShoppingCartIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2">No orders yet</Typography>
              </Box>
            ) : (
              <Stack spacing={0} divider={<Divider />}>
                {orders.slice(0, 6).map(o => (
                  <Box key={o.id} sx={{
                    display: 'flex', alignItems: 'center', gap: 2, py: 1.5, px: 1,
                    borderRadius: 2, transition: 'background 0.15s',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}>
                    <Box sx={{
                      width: 38, height: 38, borderRadius: 2, bgcolor: '#6366f118',
                      color: '#6366f1', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0,
                    }}>
                      #{o.id}
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {o.deliveryAddress}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <AccessTimeIcon sx={{ fontSize: 11 }} />
                        {new Date(o.placedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 0.5 }}>
                      <Typography variant="body2" fontWeight={700}>₹{o.totalAmount?.toFixed(2) ?? '—'}</Typography>
                      <Chip label={o.status} size="small" sx={{
                        height: 18, fontSize: '0.62rem', fontWeight: 700,
                        bgcolor: STATUS_COLORS[o.status] + '20', color: STATUS_COLORS[o.status],
                      }} />
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Available Coupons */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={0.5}>Available Coupons</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Use these codes at checkout
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {activeCoupons.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <LocalOfferIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2">No active coupons</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {activeCoupons.map(c => (
                  <Box key={c.id} sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    p: 1.5, borderRadius: 2,
                    border: '1px dashed', borderColor: '#6366f180',
                    bgcolor: '#6366f108',
                    transition: 'background 0.15s',
                    '&:hover': { bgcolor: '#6366f115' },
                  }}>
                    <Box>
                      <Typography variant="body2" fontWeight={800} color="primary.main" letterSpacing={1}>
                        {c.code}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.type === 'PERCENTAGE' ? `${c.value}% off` : `₹${c.value} off`}
                        &nbsp;· Expires {c.expiryDate}
                      </Typography>
                    </Box>
                    <Chip
                      label={c.type === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`}
                      size="small"
                      sx={{ bgcolor: '#ec489918', color: '#ec4899', fontWeight: 700 }}
                    />
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
