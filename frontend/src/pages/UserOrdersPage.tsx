import { useEffect, useState } from 'react';
import { Box, Button, Chip, Divider, Paper, Skeleton, Stack, Typography, IconButton } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../context/AuthContext';
import { getOrdersByUser } from '../api/orders';
import type { OrderResponse } from '../types';
import StatusBadge from '../components/StatusBadge';
import notify from '../utils/notify';
import { useNavigate } from 'react-router-dom';

function formatINR(v: number) { return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`; }

export default function UserOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getOrdersByUser(user.id)
      .then(data => setOrders(data.sort((a, b) => b.id - a.id)))
      .catch(() => notify.error('Failed to load your orders'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
        <Stack spacing={2}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: '12px' }} />)}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>My Orders</Typography>
        <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>View and manage your previous orders</Typography>
      </Box>

      {orders.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
          <SearchIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: '#0f172a', mb: 1 }}>No orders found</Typography>
          <Typography sx={{ color: 'text.secondary', mb: 3 }}>You haven't placed any orders yet.</Typography>
          <Button variant="contained" onClick={() => navigate('/shop')} sx={{ bgcolor: '#0f172a', textTransform: 'none', borderRadius: '8px', px: 3 }}>
            Start Shopping
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          {orders.map(order => (
            <Paper key={order.id} elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '16px', transition: 'all 200ms', '&:hover': { borderColor: '#cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' } }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Order #{order.id}</Typography>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>Placed on {new Date(order.placedAt).toLocaleString()}</Typography>
                </Box>
                <StatusBadge status={order.status} />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5 }}>Items Ordered</Typography>
                  <Stack spacing={1}>
                    {order.items.map(item => (
                      <Box key={item.productId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 14, color: '#0f172a' }}><Typography component="span" sx={{ color: 'text.secondary', fontWeight: 600, mr: 1 }}>{item.quantity}x</Typography> Product #{item.productId}</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{formatINR(Number(item.priceAtTime) * item.quantity)}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
                
                <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5 }}>Order Summary</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>Subtotal</Typography>
                    <Typography sx={{ fontSize: 14 }}>{formatINR(Number(order.totalAmount) + (Number(order.discount) || 0))}</Typography>
                  </Box>
                  {Number(order.discount) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>Discount {order.couponCode && `(${order.couponCode})`}</Typography>
                      <Typography sx={{ fontSize: 14, color: 'success.main', fontWeight: 600 }}>-{formatINR(Number(order.discount))}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Total</Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{formatINR(Number(order.totalAmount))}</Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<ReplayIcon />} 
                  onClick={() => {
                    navigate('/shop');
                    notify.info(`We'll add a reorder feature soon!`);
                  }}
                  sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600, borderColor: '#cbd5e1', color: '#0f172a', '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' } }}
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
