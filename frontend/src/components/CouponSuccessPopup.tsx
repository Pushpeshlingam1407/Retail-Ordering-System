import React from 'react';
import {
  Dialog,
  DialogContent,
  Stack,
  Typography,
  Box,
  Button,
  Grow,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface CouponSuccessPopupProps {
  open: boolean;
  couponCode: string;
  discountAmount: number;
  onClose: () => void;
}

export default function CouponSuccessPopup({
  open,
  couponCode,
  discountAmount,
  onClose,
}: CouponSuccessPopupProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid #e0e0e0',
        },
      }}
      TransitionComponent={Grow}
    >
      <DialogContent sx={{ p: 4, textAlign: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircleOutlineIcon
              sx={{
                fontSize: 48,
                color: '#000000',
              }}
            />
          </Box>

          <Typography variant="h5" fontWeight={700} color="#000000">
            Coupon Applied!
          </Typography>

          <Typography variant="body2" color="#666666" sx={{ maxWidth: 300 }}>
            Your coupon{' '}
            <Typography component="span" fontWeight={700}>
              {couponCode}
            </Typography>{' '}
            has been successfully applied.
          </Typography>

          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: '#f9f9f9',
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              width: '100%',
            }}
          >
            <Typography variant="caption" color="#666666" display="block" mb={0.5}>
              Discount Awarded
            </Typography>
            <Typography variant="h6" fontWeight={700} color="#000000">
              ₹{discountAmount.toLocaleString('en-IN')}
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={onClose}
            fullWidth
            sx={{ mt: 2 }}
          >
            Continue Shopping
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
