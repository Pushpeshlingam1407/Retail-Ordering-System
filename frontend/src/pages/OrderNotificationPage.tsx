import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import type { OrderResponse, OrderStatus } from '../types';

type NotificationState = {
  order?: OrderResponse;
  outcome?: Extract<OrderStatus, 'CONFIRMED' | 'CANCELLED'>;
};

function formatCurrency(value?: number) {
  return `₹${(value ?? 0).toFixed(2)}`;
}

export default function OrderNotificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as NotificationState;
  const order = state.order;
  const outcome = state.outcome ?? order?.status;
  const isConfirmed = outcome === 'CONFIRMED';
  const isCancelled = outcome === 'CANCELLED';

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box
          sx={{
            px: 3,
            py: 4,
            color: 'white',
            background: isCancelled
              ? 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)'
              : 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            {isCancelled ? <CancelIcon sx={{ fontSize: 44 }} /> : <CheckCircleIcon sx={{ fontSize: 44 }} />}
            <Box>
              <Typography variant="h4" fontWeight={800} lineHeight={1.1}>
                {isCancelled ? 'Order Cancelled' : 'Order Confirmed'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.75 }}>
                {isCancelled
                  ? 'The order has been cancelled and the customer will receive an email notification.'
                  : 'The order has been confirmed and the customer will receive a confirmation email.'}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {!order ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ShoppingBagIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4 }} />
              <Typography variant="h6" fontWeight={700} mt={1}>No order details available</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Open this page from the orders screen after confirming or cancelling an order.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`Order #${order.id}`} color="primary" />
                <Chip label={order.status} color={isCancelled ? 'error' : 'success'} />
                <Chip label={formatCurrency(order.totalAmount)} variant="outlined" />
              </Stack>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Delivery Address
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {order.deliveryAddress}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Order Summary
                </Typography>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">Placed at</Typography>
                        <Typography variant="body2" fontWeight={600}>{new Date(order.placedAt).toLocaleString()}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">Coupon</Typography>
                        <Typography variant="body2" fontWeight={600}>{order.couponCode ?? 'None'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">Discount</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatCurrency(order.discount)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">Total</Typography>
                        <Typography variant="body2" fontWeight={800}>{formatCurrency(order.totalAmount)}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Items
                </Typography>
                <Stack spacing={1.25}>
                  {order.items.map(item => (
                    <Card key={item.id} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              Product #{item.productId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Quantity: {item.quantity}
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={700}>
                            {formatCurrency(item.priceAtTime * item.quantity)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate('/orders')}>
                  Back to orders
                </Button>
                <Button variant="contained" onClick={() => navigate('/shop')}>
                  Go to shop
                </Button>
              </Box>
            </Stack>
          )}
        </CardContent>
      </Paper>
    </Box>
  );
}